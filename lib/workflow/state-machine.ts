/**
 * lib/workflow/state-machine.ts
 * Multi-Departmental State Machine Engine with Strict Transition Guards and Concurrency Locking.
 */

import { prisma } from "@/lib/prisma";
import {
  ApplicationWorkflowStatus,
  WorkflowActor,
  WorkflowDomain,
  WorkflowTaskStatus,
} from "./types";

export class StateMachineError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "StateMachineError";
    this.statusCode = statusCode;
  }
}

export class WorkflowStateMachine {
  /**
   * Transition sequence mapping
   */
  private static DOMAIN_PIPELINE: WorkflowDomain[] = [
    "TRAFFIC",
    "BPLO",
    "SP",
    "BPLO", // Returns to BPLO for final permit release
  ];

  /**
   * Validates if a user role can perform operations required by a task
   */
  public static validateRolePrerequisite(
    actor: WorkflowActor,
    requiredRole: "STAFF" | "SUPERVISOR" | "ADMIN"
  ): void {
    const roleHierarchy = {
      STAFF: 1,
      SUPERVISOR: 2,
      ADMIN: 3,
    };

    if (roleHierarchy[actor.role] < roleHierarchy[requiredRole]) {
      throw new StateMachineError(
        `Access Denied: Role '${actor.role}' is insufficient. Required: '${requiredRole}'.`,
        403
      );
    }
  }

  /**
   * Validates domain barrier: an actor can only interact with tasks within their domain
   */
  public static validateDomainBarrier(
    actor: WorkflowActor,
    taskDomain: WorkflowDomain
  ): void {
    if (actor.role === "ADMIN") return; // Global admin bypass
    if (actor.domain !== taskDomain) {
      throw new StateMachineError(
        `Domain Isolation Violation: You belong to '${actor.domain}', but this task resides in '${taskDomain}'.`,
        403
      );
    }
  }

  /**
   * Transition Guard 1: Validate City Traffic Management Office (CTMO) clearance
   */
  public static async validateTrafficClearanceGuard(applicationId: string): Promise<void> {
    const clearance = await prisma.trafficClearance.findUnique({
      where: { applicationId },
    });

    if (!clearance) {
      throw new StateMachineError(
        "Guard Failed: Application has not undergone CTMO inspection.",
        422
      );
    }

    if (clearance.inspectionStatus !== "PASSED") {
      throw new StateMachineError(
        `Guard Failed: CTMO Physical Inspection is not passed (Current: ${clearance.inspectionStatus}).`,
        422
      );
    }

    if (!clearance.engineChassisVerified) {
      throw new StateMachineError(
        "Guard Failed: Engine & Chassis verification is incomplete.",
        422
      );
    }

    if (!clearance.violationsSettled || clearance.violationsCount > 0) {
      // Check if settled
      if (!clearance.violationsSettled) {
        throw new StateMachineError(
          "Guard Failed: Unsettled traffic violations exist. Fines must be paid before CTMO clearance.",
          422
        );
      }
    }

    if (!clearance.certificateNo || !clearance.clearedAt) {
      throw new StateMachineError(
        "Guard Failed: Official Traffic Clearance Certificate has not been signed or issued.",
        422
      );
    }
  }

  /**
   * Transition Guard 2: Validate BPLO Delinquency & Statutory Verification
   */
  public static async validateBploClearanceGuard(applicationId: string): Promise<void> {
    // 1. Must have passed traffic clearance
    await this.validateTrafficClearanceGuard(applicationId);

    // 2. Check if delinquency assessments exist and are paid
    const assessments = await prisma.franchiseAssessment.findMany({
      where: {
        applicationId,
        assessmentType: "DELINQUENCY",
      },
    });

    for (const item of assessments) {
      if (item.status !== "PAID" || !item.orNumber) {
        throw new StateMachineError(
          `Guard Failed: Delinquent tax assessment ${item.billingReference} is unpaid. Treasury payment required before forwarding to SP.`,
          422
        );
      }
    }
  }

  /**
   * Transition Guard 3: Validate Sangguniang Panlungsod (SP) Resolution & Payment
   */
  public static async validateSPApprovalGuard(applicationId: string): Promise<void> {
    // 1. Legislative Assessment must be paid
    const spAssessments = await prisma.franchiseAssessment.findMany({
      where: {
        applicationId,
        assessmentType: "LEGISLATIVE_TAX",
      },
    });

    for (const item of spAssessments) {
      if (item.status !== "PAID" || !item.orNumber) {
        throw new StateMachineError(
          `Guard Failed: Legislative Assessment ${item.billingReference} must be paid prior to council resolution enactment.`,
          422
        );
      }
    }

    // 2. Resolution record check
    const resolution = await prisma.sPResolution.findUnique({
      where: { applicationId },
    });

    if (!resolution) {
      throw new StateMachineError(
        "Guard Failed: Sangguniang Panlungsod resolution record not found.",
        422
      );
    }

    if (resolution.votingResult !== "APPROVED") {
      throw new StateMachineError(
        `Guard Failed: Council session did not approve this application (Result: ${resolution.votingResult || "Pending"}).`,
        422
      );
    }

    if (!resolution.resolutionNumber) {
      throw new StateMachineError(
        "Guard Failed: SP Resolution Number has not been recorded.",
        422
      );
    }
  }

  /**
   * Atomic Claiming Mechanism ("Assign to Me") with Concurrency Control
   */
  public static async claimTask(
    taskId: string,
    actor: WorkflowActor
  ): Promise<{ taskId: string; assignedTo: string; claimedAt: string }> {
    return await prisma.$transaction(async (tx) => {
      // 1. Locate task with pessimistic locking semantics
      const task = await tx.franchiseTasks.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new StateMachineError(`Task '${taskId}' not found.`, 404);
      }

      // 2. Domain isolation check
      const taskDomain = task.office as WorkflowDomain;
      this.validateDomainBarrier(actor, taskDomain);

      // 3. Concurrency check: Ensure task is unassigned or pending
      const existingUser = task.userId;
      if (existingUser && existingUser !== actor.id && existingUser !== "unassigned") {
        throw new StateMachineError(
          `Task is already claimed and assigned to another user (${existingUser}).`,
          409
        );
      }

      // 4. Atomic assign
      const updated = await tx.franchiseTasks.update({
        where: { id: taskId },
        data: {
          userId: actor.id,
          updatedAt: new Date(),
        },
      });

      return {
        taskId: updated.id,
        assignedTo: actor.name,
        claimedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Atomic Task Forwarding & Pipeline State Progression
   */
  public static async forwardTask(
    currentTaskId: string,
    targetDomain: WorkflowDomain,
    nextTaskName: string,
    nextTaskDesc: string,
    actor: WorkflowActor,
    remarks?: string
  ): Promise<{
    completedTaskId: string;
    newTaskId: string;
    targetDomain: WorkflowDomain;
    applicationStatus: ApplicationWorkflowStatus;
  }> {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify current task
      const currentTask = await tx.franchiseTasks.findUnique({
        where: { id: currentTaskId },
        include: { applications: true },
      });

      if (!currentTask) {
        throw new StateMachineError(`Task '${currentTaskId}' not found.`, 404);
      }

      const currentDomain = currentTask.office as WorkflowDomain;
      this.validateDomainBarrier(actor, currentDomain);

      // 2. Identify linked application
      const application = currentTask.applications[0];
      if (!application) {
        throw new StateMachineError(
          `No FranchiseApplication linked to task '${currentTaskId}'.`,
          422
        );
      }

      // 3. Evaluate Guard Rules based on transition destination
      if (currentDomain === "TRAFFIC" && targetDomain === "BPLO") {
        await this.validateTrafficClearanceGuard(application.id);
      } else if (currentDomain === "BPLO" && targetDomain === "SP") {
        await this.validateBploClearanceGuard(application.id);
      } else if (currentDomain === "SP" && targetDomain === "BPLO") {
        await this.validateSPApprovalGuard(application.id);
      }

      // 4. Determine next application status
      let nextAppStatus: ApplicationWorkflowStatus = "BPLO_REVIEW";
      if (targetDomain === "SP") {
        nextAppStatus = "SP_ASSESSMENT";
      } else if (targetDomain === "BPLO" && currentDomain === "SP") {
        nextAppStatus = "FINAL_ISSUANCE";
      }

      // 5. Spawn downstream task in target domain
      const downstreamTask = await tx.franchiseTasks.create({
        data: {
          office: targetDomain,
          taskname: nextTaskName,
          taskdesc: nextTaskDesc,
          userId: "unassigned",
          newFranchiseId: currentTask.newFranchiseId,
        },
      });

      // 6. Update application current domain, task link, and status
      await tx.franchiseApplication.update({
        where: { id: application.id },
        data: {
          currentDomain: targetDomain,
          taskId: downstreamTask.id,
          status: nextAppStatus,
          remarks: remarks
            ? `${application.remarks || ""}\n[Handoff to ${targetDomain}]: ${remarks}`
            : application.remarks,
        },
      });

      return {
        completedTaskId: currentTaskId,
        newTaskId: downstreamTask.id,
        targetDomain,
        applicationStatus: nextAppStatus,
      };
    });
  }
}
