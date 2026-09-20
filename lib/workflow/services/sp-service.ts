/**
 * lib/workflow/services/sp-service.ts
 * Sangguniang Panlungsod (SP - City Council) Domain Service.
 */

import { prisma } from "@/lib/prisma";
import { LegislativeAssessmentBreakdown, SPVoteResult, WorkflowActor } from "../types";
import { WorkflowStateMachine, StateMachineError } from "../state-machine";
import { etracsClient } from "../etracs-interceptor";

export class SpDomainService {
  /**
   * 1. Conduct legislative franchise tax assessment and dispatch billing to Treasury (eTRACS)
   */
  public static async assessLegislativeTax(
    applicationId: string,
    isRenewal: boolean,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    const application = await prisma.franchiseApplication.findUnique({
      where: { id: applicationId },
      include: { newFranchise: { include: { operator: true } } },
    });

    if (!application) {
      throw new StateMachineError(`Application '${applicationId}' not found.`, 404);
    }

    // Schedule of fees
    const baseFranchiseTax = isRenewal ? 6000 : 12000; // 3-year term
    const mayorsPermitFee = 1500;
    const regulatoryStickerFee = 350;
    const healthSanitaryFee = 250;
    const filingFee = 500;
    const total =
      baseFranchiseTax +
      mayorsPermitFee +
      regulatoryStickerFee +
      healthSanitaryFee +
      filingFee;

    const breakdown: LegislativeAssessmentBreakdown = {
      applicationType: isRenewal ? "RENEWAL" : "NEW",
      baseFranchiseTax,
      mayorsPermitFee,
      regulatoryStickerFee,
      healthSanitaryFee,
      filingFee,
      totalAssessment: total,
    };

    // Dispatch to eTRACS
    const billingPayload = {
      mtopNo: application.mtopNo || `MTOP-${application.appyear}-${application.id.slice(-4)}`,
      franchiseBodyNumber: application.newFranchise?.franchiseBodyNumber || 1,
      taxpayerName: application.newFranchise?.operator?.name || "Operator",
      taxpayerAddress: application.newFranchise?.operator?.address || "Tagbilaran City",
      assessmentType: "LEGISLATIVE_TAX" as const,
      items: [
        {
          accountCode: "4-01-01-080",
          accountTitle: `Franchise Fee (${isRenewal ? "Renewal 3-Yr" : "New 3-Yr"})`,
          amount: baseFranchiseTax,
        },
        {
          accountCode: "4-02-01-010",
          accountTitle: "Mayor's Permit Regulatory Fee",
          amount: mayorsPermitFee,
        },
        {
          accountCode: "4-02-01-020",
          accountTitle: "Official MTOP Metal Plate & Validation Sticker",
          amount: regulatoryStickerFee,
        },
        {
          accountCode: "4-02-01-030",
          accountTitle: "Health & Sanitary Inspection Fee",
          amount: healthSanitaryFee,
        },
        {
          accountCode: "4-02-01-040",
          accountTitle: "Filing & Documentation Fee",
          amount: filingFee,
        },
      ],
      totalAmount: total,
    };

    const etracsResult = await etracsClient.ingestBilling(billingPayload);

    // Save FranchiseAssessment record
    const assessment = await prisma.franchiseAssessment.create({
      data: {
        applicationId,
        billingReference: etracsResult.billingReference,
        assessmentType: "LEGISLATIVE_TAX",
        franchiseTax: baseFranchiseTax,
        filingFee,
        clearanceFee: healthSanitaryFee + regulatoryStickerFee,
        totalAmount: total,
        status: "PENDING",
      },
    });

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: "SP_PAYMENT_PENDING" },
    });

    return {
      assessment,
      breakdown,
      etracsResult,
    };
  }

  /**
   * 2. Enqueue application to Order of the Day for council session hearing
   */
  public static async enqueueOrderOfTheDay(
    applicationId: string,
    sessionDate: Date,
    sessionNumber: string,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    // Guard: Verify payment
    const assessment = await prisma.franchiseAssessment.findFirst({
      where: {
        applicationId,
        assessmentType: "LEGISLATIVE_TAX",
      },
    });

    if (!assessment || assessment.status !== "PAID") {
      throw new StateMachineError(
        "Guard Failed: eTRACS Treasury payment must be confirmed before scheduling council hearing.",
        422
      );
    }

    const resolution = await prisma.sPResolution.upsert({
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

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: "SP_IN_SESSION" },
    });

    return resolution;
  }

  /**
   * 3. Record Council Voting Result, generate Resolution & print Franchise Certificate
   */
  public static async recordCouncilVote(
    applicationId: string,
    vote: SPVoteResult,
    actor: WorkflowActor
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    const now = new Date();
    const resolution = await prisma.sPResolution.upsert({
      where: { applicationId },
      create: {
        applicationId,
        sessionNumber: vote.sessionNumber,
        orderOfTheDayDate: new Date(vote.orderOfTheDayDate),
        resolutionNumber: vote.resolutionNumber,
        votingResult: vote.votingResult,
        affirmativeVotes: vote.affirmativeVotes,
        negativeVotes: vote.negativeVotes,
        abstainingVotes: vote.abstainingVotes,
        publishedAt: vote.votingResult === "APPROVED" ? now : null,
        publicationGazette: vote.votingResult === "APPROVED" ? "Tagbilaran City Gazette & SP Bulletin" : null,
        certificatePrinted: vote.votingResult === "APPROVED",
        signatoryName: vote.signatoryName,
        signatoryTitle: vote.signatoryTitle,
        signedAt: vote.votingResult === "APPROVED" ? now : null,
        remarks: vote.remarks,
      },
      update: {
        sessionNumber: vote.sessionNumber,
        resolutionNumber: vote.resolutionNumber,
        votingResult: vote.votingResult,
        affirmativeVotes: vote.affirmativeVotes,
        negativeVotes: vote.negativeVotes,
        abstainingVotes: vote.abstainingVotes,
        publishedAt: vote.votingResult === "APPROVED" ? now : null,
        publicationGazette: vote.votingResult === "APPROVED" ? "Tagbilaran City Gazette & SP Bulletin" : null,
        certificatePrinted: vote.votingResult === "APPROVED",
        signatoryName: vote.signatoryName,
        signatoryTitle: vote.signatoryTitle,
        signedAt: vote.votingResult === "APPROVED" ? now : null,
        remarks: vote.remarks,
      },
    });

    const newStatus = vote.votingResult === "APPROVED" ? "SP_APPROVED" : "SP_DISAPPROVED";

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        resolutionNo: vote.resolutionNumber,
        resolutionDate: now,
      },
    });

    return resolution;
  }

  /**
   * 4. Return Finalized Docket back to BPLO for executive release
   */
  public static async returnDocketToBplo(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor,
    remarks?: string
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "SP");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    // Guard: Must have approved SP resolution
    await WorkflowStateMachine.validateSPApprovalGuard(applicationId);

    const transition = await WorkflowStateMachine.forwardTask(
      currentTaskId,
      "BPLO",
      "Executive Permit Final Release",
      "Issue sealed Certificate of Franchise and physical MTOP permit to operator.",
      actor,
      remarks || "SP Resolution approved. Forwarding to BPLO for permit release."
    );

    await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: { status: "FINAL_ISSUANCE" },
    });

    return transition;
  }
}
