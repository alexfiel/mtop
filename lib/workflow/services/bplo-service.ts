/**
 * lib/workflow/services/bplo-service.ts
 * Business Permit and Licensing Office (BPLO) Domain Service.
 */

import { prisma } from "@/lib/prisma";
import { DelinquencyBreakdown, WorkflowActor } from "../types";
import { WorkflowStateMachine, StateMachineError } from "../state-machine";
import { etracsClient } from "../etracs-interceptor";

export class BploDomainService {
  /**
   * 1. Intake & Document Verification: confirms statutory requirements & active CTMO clearance
   */
  public static async verifyIntake(
    applicationId: string,
    statutoryDocsVerified: boolean,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "BPLO");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    if (!statutoryDocsVerified) {
      throw new StateMachineError("Statutory documents checklist is incomplete.", 422);
    }

    // Verify CTMO Traffic Clearance exists and is passed
    await WorkflowStateMachine.validateTrafficClearanceGuard(applicationId);

    const application = await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: {
        status: "BPLO_REVIEW",
        remarks: `Statutory requirements verified by ${actor.name} (BPLO).`,
      },
    });

    return application;
  }

  /**
   * 2. Renewal Delinquency Calculation & Dispatch to eTRACS Treasury
   */
  public static async assessDelinquency(
    applicationId: string,
    expiredYearsCount: number,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "BPLO");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { newFranchise: { include: { operator: true } } },
    });

    if (!application) {
      throw new StateMachineError(`Application '${applicationId}' not found.`, 404);
    }

    // Municipal tax calculation formula
    const annualTax = 2000; // Standard MTOP franchise tax per expired year
    const baseTax = annualTax * Math.max(1, expiredYearsCount);
    const surcharge = baseTax * 0.25; // 25% statutory surcharge
    const penaltyInterest = baseTax * (0.02 * (expiredYearsCount * 12)); // 2% per month
    const filingFee = 500;
    const totalDelinquency = baseTax + surcharge + penaltyInterest + filingFee;

    const breakdown: DelinquencyBreakdown = {
      unpaidYears: Array.from({ length: expiredYearsCount }, (_, i) => new Date().getFullYear() - (i + 1)),
      annualFranchiseTax: baseTax,
      surchargePercent: 25,
      surchargeAmount: surcharge,
      interestPercent: expiredYearsCount * 24,
      interestAmount: penaltyInterest,
      filingFee,
      totalDelinquency,
    };

    // Dispatch billing to eTRACS Treasury
    const billingPayload = {
      mtopNo: application.mtopNo || `MTOP-${application.appyear}-${application.id.slice(-4)}`,
      franchiseBodyNumber: application.newFranchise?.franchiseBodyNumber || 1,
      taxpayerName: application.newFranchise?.operator?.name || "Operator",
      taxpayerAddress: application.newFranchise?.operator?.address || "Tagbilaran City",
      assessmentType: "DELINQUENCY" as const,
      items: [
        {
          accountCode: "4-01-01-080",
          accountTitle: "Franchise Tax Delinquency",
          amount: baseTax,
        },
        {
          accountCode: "4-01-01-081",
          accountTitle: "Surcharges & Penalties (MTOP)",
          amount: surcharge + penaltyInterest,
        },
        {
          accountCode: "4-02-01-010",
          accountTitle: "Regulatory Filing Fee",
          amount: filingFee,
        },
      ],
      totalAmount: totalDelinquency,
    };

    const etracsResult = await etracsClient.ingestBilling(billingPayload);

    // Save FranchiseAssessment record
    const assessment = await prisma.franchiseAssessment.create({
      data: {
        applicationId,
        billingReference: etracsResult.billingReference,
        assessmentType: "DELINQUENCY",
        franchiseTax: baseTax,
        surcharge,
        penalty: penaltyInterest,
        filingFee,
        totalAmount: totalDelinquency,
        status: "PENDING",
      },
    });

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: "DELINQUENT_PENDING" },
    });

    return {
      assessment,
      breakdown,
      etracsResult,
    };
  }

  /**
   * 3. Handoff to Sangguniang Panlungsod (SP) once verified & cleared
   */
  public static async handoffToSP(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor,
    remarks?: string
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "BPLO");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    // Enforce Guard: Must have CTMO clearance & Delinquency paid
    await WorkflowStateMachine.validateBploClearanceGuard(applicationId);

    // Forward task to SP
    const transition = await WorkflowStateMachine.forwardTask(
      currentTaskId,
      "SP",
      "Legislative Tax Assessment & Session Hearing",
      "Perform legislative fee assessment and place on Order of the Day for council approval.",
      actor,
      remarks || "Endorsed by BPLO for legislative council review."
    );

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: "READY_FOR_SP" },
    });

    return transition;
  }

  /**
   * 4. Final Release: Receive approved franchise bundle from SP, finalize permit, and issue to operator
   */
  public static async issueFinalPermit(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "BPLO");
    WorkflowStateMachine.validateRolePrerequisite(actor, "ADMIN");

    // Validate SP approval guard
    await WorkflowStateMachine.validateSPApprovalGuard(applicationId);

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { newFranchise: true, spResolution: true },
    });

    if (!application) {
      throw new StateMachineError("Application not found.", 404);
    }

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 3); // Standard 3-year MTOP validity

    // Create or activate Permit
    const permitNumber = `TOP-TAG-${now.getFullYear()}-${application.newFranchise?.franchiseBodyNumber.toString().padStart(4, "0") || "0000"}`;

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: {
        status: "COMPLETED",
        approvedBy: actor.name,
        approvedDate: now,
      },
    });

    if (application.newFranchiseId) {
      await prisma.newFranchise.update({
        where: { id: application.newFranchiseId },
        data: {
          isActive: true,
          isAssigned: true,
          assignedDate: now,
        },
      });
    }

    // Complete active task
    await prisma.franchiseTasks.update({
      where: { id: currentTaskId },
      data: {
        taskdesc: `Final MTOP Permit released by ${actor.name} (${actor.role}). Permit No: ${permitNumber}`,
        updatedAt: now,
      },
    });

    return {
      permitNumber,
      validUntil: expiryDate.toISOString(),
      issuedAt: now.toISOString(),
      issuedBy: actor.name,
    };
  }
}
