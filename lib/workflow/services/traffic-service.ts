/**
 * lib/workflow/services/traffic-service.ts
 * City Traffic Management Office (CTMO) Domain Service.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { InspectionDetails, WorkflowActor } from "../types";
import { WorkflowStateMachine, StateMachineError } from "../state-machine";

export class TrafficDomainService {
  /**
   * 1. Inspect vehicle and verify engine/chassis and physical unit
   */
  public static async recordInspection(
    applicationId: string,
    inspection: InspectionDetails,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "TRAFFIC");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { newFranchise: { include: { mtopVehicle: true, operator: true } } },
    });

    if (!application) {
      throw new StateMachineError(`Application '${applicationId}' not found.`, 404);
    }

    const inspectionStatus =
      inspection.engineChassisVerified &&
      inspection.roadworthinessPassed &&
      inspection.brakesAndLightsOk &&
      inspection.bodyPaintOk
        ? "PASSED"
        : "FAILED";

    // Query violation registry for vehicle and operator
    const plate = application.newFranchise?.mtopVehicle?.plateNumber;
    const operatorId = application.newFranchise?.operatorId;

    const violations = await prisma.violation.findMany({
      where: {
        status: { in: ["UNPAID", "PENDING"] },
        OR: [
          plate ? { tricycle: { plateNo: plate } } : {},
          operatorId ? { driver: { operatorId } } : {},
        ],
      },
      include: { type: true },
    });

    const certNumber = `CTMO-CLR-${new Date().getFullYear()}-${application.appyear}-${Math.floor(1000 + Math.random() * 9000)}`;
    const verificationHash = crypto
      .createHash("sha256")
      .update(`${certNumber}-${application.id}-${inspectionStatus}-${new Date().toISOString()}`)
      .digest("hex");

    const clearance = await prisma.trafficClearance.upsert({
      where: { applicationId },
      create: {
        applicationId,
        certificateNo: certNumber,
        inspectionStatus,
        engineChassisVerified: inspection.engineChassisVerified,
        roadworthinessPassed: inspection.roadworthinessPassed,
        violationsCount: violations.length,
        violationsSettled: violations.length === 0,
        violationsSnapshot: JSON.stringify(violations),
        remarks: inspection.remarks,
        verificationHash,
        clearedAt: inspectionStatus === "PASSED" && violations.length === 0 ? new Date() : null,
        clearedBy: actor.name,
      },
      update: {
        inspectionStatus,
        engineChassisVerified: inspection.engineChassisVerified,
        roadworthinessPassed: inspection.roadworthinessPassed,
        violationsCount: violations.length,
        violationsSettled: violations.length === 0,
        violationsSnapshot: JSON.stringify(violations),
        remarks: inspection.remarks,
        verificationHash,
        clearedAt: inspectionStatus === "PASSED" && violations.length === 0 ? new Date() : null,
        clearedBy: actor.name,
      },
    });

    // Update application status
    const newStatus =
      inspectionStatus === "PASSED" && violations.length === 0
        ? "TRAFFIC_CLEARED"
        : violations.length > 0
        ? "VIOLATIONS_PENDING"
        : "UNDER_INSPECTION";

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
    });

    return {
      clearance,
      violations,
      status: newStatus,
    };
  }

  /**
   * 2. Settle traffic violations and issue Traffic Clearance Certificate
   */
  public static async settleViolationsAndIssueClearance(
    applicationId: string,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "TRAFFIC");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    const clearance = await prisma.trafficClearance.findUnique({
      where: { applicationId },
    });

    if (!clearance) {
      throw new StateMachineError("Traffic clearance record not found.", 404);
    }

    if (clearance.inspectionStatus !== "PASSED") {
      throw new StateMachineError("Physical unit inspection must pass first.", 422);
    }

    const updated = await prisma.trafficClearance.update({
      where: { applicationId },
      data: {
        violationsSettled: true,
        violationsCount: 0,
        clearedAt: new Date(),
        clearedBy: actor.name,
      },
    });

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: "TRAFFIC_CLEARED" },
    });

    return updated;
  }

  /**
   * 3. Forward Cleared Application to SP for Franchise Resolution
   * "if City Traffic issued clearance submit application to SP for Franchise Resolution"
   */
  public static async forwardToSPForResolution(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor,
    remarks?: string
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "TRAFFIC");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    // Guard: Verify traffic clearance passed and official certificate issued
    await WorkflowStateMachine.validateTrafficClearanceGuard(applicationId);

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { trafficClearance: true, newFranchise: true },
    });

    if (!application) {
      throw new StateMachineError("Application not found.", 404);
    }

    const certNo = application.trafficClearance?.certificateNo || "CTMO-CLR";

    return await prisma.$transaction(async (tx) => {
      // Complete active traffic task
      if (currentTaskId) {
        await tx.franchiseTasks.update({
          where: { id: currentTaskId },
          data: {
            taskdesc: `Traffic clearance #${certNo} issued by ${actor.name}. Endorsed to Sangguniang Panlungsod.`,
            updatedAt: new Date(),
          },
        });
      }

      // Create SP Resolution Task
      const spTask = await tx.franchiseTasks.create({
        data: {
          office: "SP",
          taskname: "Franchise Renewal Resolution Enactment",
          taskdesc: `Review docket with Traffic Clearance #${certNo}. Enact SP Resolution for Franchise Body #${application.newFranchise?.franchiseBodyNumber || application.id}.`,
          userId: actor.id,
          newFranchiseId: application.newFranchiseId,
        },
      });

      // Update application: currentDomain = "SP", status = "SP_RESOLUTION_PENDING"
      const updatedApp = await tx.franchiseApplication.update({
        where: { id: applicationId },
        data: {
          currentDomain: "SP",
          status: "SP_RESOLUTION_PENDING",
          taskId: spTask.id,
          remarks: remarks
            ? `${application.remarks || ""}\n[CTMO Cleared]: ${remarks}`
            : application.remarks,
        },
      });

      return {
        application: updatedApp,
        spTask,
      };
    });
  }
}

