/**
 * lib/workflow/services/sp-service.ts
 * Sangguniang Panlungsod (SP - City Council) & Treasury Integrated Domain Service.
 * Implements SP Resolution Issuance, Renewal Billing, Treasury Payment, Printing, Publication, and Release.
 */

import { prisma } from "@/lib/prisma";
import { WorkflowActor } from "../types";
import { WorkflowStateMachine, StateMachineError } from "../state-machine";
import { etracsClient } from "../etracs-interceptor";
import { FranchiseBillingEngine } from "../billing-calculator";

export interface IssueResolutionInput {
  applicationId: string;
  currentTaskId: string;
  resolutionNumber: string;
  resolutionDate: Date | string;
  sessionNumber?: string;
  votingResult?: "APPROVED" | "DISAPPROVED" | "DEFERRED";
  actor: WorkflowActor;
  remarks?: string;
}

export interface TreasuryPaymentInput {
  applicationId: string;
  currentTaskId: string;
  orNumber: string;
  amountPaid: number;
  actor: WorkflowActor;
  paymentMode?: "CASH" | "ONLINE" | "CHECK";
}

export class SpDomainService {
  /**
   * 1. SP Issues Resolution Number & Date for Franchise Renewal
   * Condition: City Traffic Clearance must be passed and verified.
   */
  public static async issueRenewalResolution(input: IssueResolutionInput) {
    const {
      applicationId,
      currentTaskId,
      resolutionNumber,
      resolutionDate,
      sessionNumber = "Regular Session",
      votingResult = "APPROVED",
      actor,
      remarks,
    } = input;

    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    // Guard: Verify Traffic Clearance
    await WorkflowStateMachine.validateTrafficClearanceGuard(applicationId);

    const resDate = new Date(resolutionDate);
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // Upsert SP Resolution record
      const resolution = await tx.sPResolution.upsert({
        where: { applicationId },
        create: {
          applicationId,
          resolutionNumber,
          orderOfTheDayDate: resDate,
          sessionNumber,
          votingResult,
          affirmativeVotes: 12,
          negativeVotes: 0,
          abstainingVotes: 0,
          signatoryName: actor.name,
          signatoryTitle: "City Vice Mayor & SP Presiding Officer",
          signedAt: now,
          remarks,
        },
        update: {
          resolutionNumber,
          orderOfTheDayDate: resDate,
          sessionNumber,
          votingResult,
          signatoryName: actor.name,
          signedAt: now,
          remarks,
        },
      });

      // Update application
      const updatedApp = await tx.franchiseApplication.update({
        where: { id: applicationId },
        data: {
          resolutionNo: resolutionNumber,
          resolutionDate: resDate,
          status: "SP_RESOLUTION_ISSUED",
          remarks: remarks
            ? `SP Resolution #${resolutionNumber} enacted on ${resDate.toISOString().slice(0, 10)}. ${remarks}`
            : `SP Resolution #${resolutionNumber} enacted for Franchise Renewal.`,
        },
      });

      return {
        resolution,
        application: updatedApp,
      };
    });
  }

  /**
   * 2. SP Issues Billing for Franchise Renewal and Submits Application to Treasury for Payment
   * Schedule: ₱6,000 every 3 years + municipal regulatory fees
   */
  public static async issueBillingAndSubmitToTreasury(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { newFranchise: { include: { operator: true } }, spResolution: true },
    });

    if (!application) {
      throw new StateMachineError(`Application '${applicationId}' not found.`, 404);
    }

    if (!application.resolutionNo) {
      throw new StateMachineError(
        "Guard Failed: SP Resolution Number must be issued before generating renewal billing.",
        422
      );
    }

    const feeBreakdown = FranchiseBillingEngine.calculateCurrentRenewalBilling(application.appyear);

    const billingPayload = {
      mtopNo: application.mtopNo || `MTOP-${application.appyear}-${application.id.slice(-4)}`,
      franchiseBodyNumber: application.newFranchise?.franchiseBodyNumber || 1,
      taxpayerName: application.newFranchise?.operator?.name || "Operator",
      taxpayerAddress: application.newFranchise?.operator?.address || "Tagbilaran City",
      assessmentType: "LEGISLATIVE_TAX" as const,
      items: [
        {
          accountCode: "4-01-01-080",
          accountTitle: "Franchise Renewal Tax (3-Year Term)",
          amount: feeBreakdown.baseFranchiseFee,
        },
        {
          accountCode: "4-02-01-010",
          accountTitle: "Mayor's Permit Regulatory Fee",
          amount: feeBreakdown.mayorsPermitFee,
        },
        {
          accountCode: "4-02-01-020",
          accountTitle: "Official MTOP Metal Plate & Validation Sticker",
          amount: feeBreakdown.regulatoryStickerFee,
        },
        {
          accountCode: "4-02-01-030",
          accountTitle: "Health & Sanitary Inspection Fee",
          amount: feeBreakdown.healthSanitaryFee,
        },
        {
          accountCode: "4-02-01-040",
          accountTitle: "Filing & Documentation Fee",
          amount: feeBreakdown.filingFee,
        },
      ],
      totalAmount: feeBreakdown.totalRenewalAmount,
    };

    const etracsResult = await etracsClient.ingestBilling(billingPayload);

    return await prisma.$transaction(async (tx) => {
      // Create Assessment
      const assessment = await tx.franchiseAssessment.create({
        data: {
          applicationId,
          billingReference: etracsResult.billingReference,
          assessmentType: "LEGISLATIVE_TAX",
          franchiseTax: feeBreakdown.baseFranchiseFee,
          filingFee: feeBreakdown.filingFee,
          clearanceFee: feeBreakdown.healthSanitaryFee + feeBreakdown.regulatoryStickerFee,
          totalAmount: feeBreakdown.totalRenewalAmount,
          status: "PENDING",
        },
      });

      // Complete current task
      if (currentTaskId) {
        await tx.franchiseTasks.update({
          where: { id: currentTaskId },
          data: {
            taskdesc: `SP billing issued (${etracsResult.billingReference}). Forwarded to Treasury for payment.`,
            updatedAt: new Date(),
          },
        });
      }

      // Create Treasury Task
      const treasuryTask = await tx.franchiseTasks.create({
        data: {
          office: "TREASURY",
          taskname: "Treasury Payment & Official Receipt Verification",
          taskdesc: `Verify payment for Billing Ref ${etracsResult.billingReference} (₱${feeBreakdown.totalRenewalAmount.toLocaleString()}). Issued by SP for Renewal Resolution #${application.resolutionNo}.`,
          userId: actor.id,
          newFranchiseId: application.newFranchiseId,
        },
      });

      // Update application
      const updatedApp = await tx.franchiseApplication.update({
        where: { id: applicationId },
        data: {
          status: "TREASURY_PAYMENT_PENDING",
          currentDomain: "TREASURY",
          taskId: treasuryTask.id,
        },
      });

      return {
        assessment,
        feeBreakdown,
        treasuryTask,
        application: updatedApp,
      };
    });
  }

  /**
   * 3. Treasury Checks if Application is OK for Payment, Records OR, and Sends Back to SP for Printing
   */
  public static async verifyPaymentAndReturnToSP(input: TreasuryPaymentInput) {
    const { applicationId, currentTaskId, orNumber, amountPaid, actor, paymentMode = "CASH" } = input;

    WorkflowStateMachine.validateDomainBarrier(actor, "TREASURY");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    const assessment = await prisma.franchiseAssessment.findFirst({
      where: { applicationId, assessmentType: "LEGISLATIVE_TAX" },
    });

    if (!assessment) {
      throw new StateMachineError("Franchise legislative assessment record not found.", 404);
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // Mark assessment paid
      const updatedAssessment = await tx.franchiseAssessment.update({
        where: { id: assessment.id },
        data: {
          status: "PAID",
          orNumber,
          paymentDate: now,
          paymentDetails: JSON.stringify({
            amountPaid,
            mode: paymentMode,
            cashier: actor.name,
            timestamp: now.toISOString(),
          }),
        },
      });

      // Complete treasury task
      if (currentTaskId) {
        await tx.franchiseTasks.update({
          where: { id: currentTaskId },
          data: {
            taskdesc: `Payment confirmed by Treasury Cashier ${actor.name}. OR #${orNumber} issued. Returning to SP for certificate printing.`,
            updatedAt: now,
          },
        });
      }

      // Create SP Printing Task
      const spPrintTask = await tx.franchiseTasks.create({
        data: {
          office: "SP",
          taskname: "Print Franchise Renewal & Add to Publication",
          taskdesc: `Payment verified under OR #${orNumber}. Print official Certificate of Franchise Renewal and record in legislative gazette publication.`,
          userId: actor.id,
          newFranchiseId: assessment.applicationId,
        },
      });

      // Update application: sent back to SP
      const updatedApp = await tx.franchiseApplication.update({
        where: { id: applicationId },
        data: {
          status: "PAID_PENDING_PRINTING",
          currentDomain: "SP",
          taskId: spPrintTask.id,
        },
      });

      return {
        assessment: updatedAssessment,
        application: updatedApp,
        spTask: spPrintTask,
      };
    });
  }

  /**
   * 4. SP Prints Franchise Renewal Certificate and Adds Application to the Publication
   */
  public static async printAndPublishFranchiseRenewal(
    applicationId: string,
    currentTaskId: string,
    publicationGazette: string = "Tagbilaran City Official Gazette & SP Bulletin",
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    // Guard: Payment must be completed
    const assessment = await prisma.franchiseAssessment.findFirst({
      where: { applicationId, assessmentType: "LEGISLATIVE_TAX" },
    });

    if (!assessment || assessment.status !== "PAID") {
      throw new StateMachineError(
        "Guard Failed: eTRACS Treasury payment must be verified before printing and publication.",
        422
      );
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // Update SPResolution
      const updatedResolution = await tx.sPResolution.update({
        where: { applicationId },
        data: {
          certificatePrinted: true,
          publishedAt: now,
          publicationGazette,
        },
      });

      // Update application
      const updatedApp = await tx.franchiseApplication.update({
        where: { id: applicationId },
        data: {
          status: "SP_PRINTED_PUBLISHED",
          publishedAt: now,
          publicationGazette,
        },
      });

      if (currentTaskId) {
        await tx.franchiseTasks.update({
          where: { id: currentTaskId },
          data: {
            taskdesc: `Franchise Renewal printed and published in ${publicationGazette} on ${now.toISOString().slice(0, 10)}. Ready for final release.`,
            updatedAt: now,
          },
        });
      }

      return {
        resolution: updatedResolution,
        application: updatedApp,
      };
    });
  }

  /**
   * 5. SP Releases the Franchise Renewal (End of Workflow)
   */
  public static async releaseFranchiseRenewal(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { spResolution: true, newFranchise: true },
    });

    if (!application) {
      throw new StateMachineError(`Application '${applicationId}' not found.`, 404);
    }

    if (!application.spResolution?.certificatePrinted || !application.spResolution?.publishedAt) {
      throw new StateMachineError(
        "Guard Failed: Certificate must be printed and recorded in publication prior to release.",
        422
      );
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // Finalize application
      const completedApp = await tx.franchiseApplication.update({
        where: { id: applicationId },
        data: {
          status: "COMPLETED",
          releasedAt: now,
          releasedBy: actor.name,
          approvedBy: actor.name,
          approvedDate: now,
        },
      });

      // Activate franchise and update lastRenewalYear
      if (application.newFranchiseId) {
        await tx.newFranchise.update({
          where: { id: application.newFranchiseId },
          data: {
            isActive: true,
            lastRenewalYear: application.appyear,
            priorResolutionNo: application.resolutionNo,
            priorResolutionDate: application.resolutionDate,
          },
        });
      }

      // Complete task
      if (currentTaskId) {
        await tx.franchiseTasks.update({
          where: { id: currentTaskId },
          data: {
            taskdesc: `Franchise Renewal released to operator by ${actor.name} (${actor.role}). Workflow completed.`,
            updatedAt: now,
          },
        });
      }

      return {
        application: completedApp,
        releasedAt: now,
        releasedBy: actor.name,
      };
    });
  }

  /**
   * Legacy endpoint compatibility: Assess legislative tax
   */
  public static async assessLegislativeTax(
    applicationId: string,
    isRenewal: boolean,
    actor: WorkflowActor
  ) {
    return await this.issueBillingAndSubmitToTreasury(applicationId, "", actor);
  }

  /**
   * Legacy endpoint compatibility: Enqueue Order of the Day
   */
  public static async enqueueOrderOfTheDay(
    applicationId: string,
    sessionDate: Date,
    sessionNumber: string,
    actor: WorkflowActor
  ) {
    return await prisma.sPResolution.upsert({
      where: { applicationId },
      create: {
        applicationId,
        orderOfTheDayDate: sessionDate,
        sessionNumber,
        votingResult: "DEFERRED",
      },
      update: {
        orderOfTheDayDate: sessionDate,
        sessionNumber,
      },
    });
  }

  /**
   * Legacy endpoint compatibility: Record Council Vote
   */
  public static async recordCouncilVote(
    applicationId: string,
    vote: any,
    actor: WorkflowActor
  ) {
    return await this.issueRenewalResolution({
      applicationId,
      currentTaskId: "",
      resolutionNumber: vote.resolutionNumber || `SP-RES-${new Date().getFullYear()}-001`,
      resolutionDate: vote.orderOfTheDayDate || new Date(),
      sessionNumber: vote.sessionNumber || "Regular Session",
      votingResult: vote.votingResult || "APPROVED",
      actor,
      remarks: vote.remarks,
    });
  }

  /**
   * Legacy endpoint compatibility: Return docket to BPLO
   */
  public static async returnDocketToBplo(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor,
    remarks?: string
  ) {
    return await this.releaseFranchiseRenewal(applicationId, currentTaskId, actor);
  }
}
