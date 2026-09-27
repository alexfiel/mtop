/**
 * lib/workflow/services/bplo-service.ts
 * Business Permit and Licensing Office (BPLO) Domain Service.
 * Implements Capture Franchise Application, Delinquency Calculation, and Routing to City Traffic.
 */

import { prisma } from "@/lib/prisma";
import { WorkflowActor } from "../types";
import { WorkflowStateMachine, StateMachineError } from "../state-machine";
import { etracsClient } from "../etracs-interceptor";
import { FranchiseBillingEngine, DelinquencyCalculationResult } from "../billing-calculator";

export interface CaptureRenewalApplicationInput {
  franchiseId: string;
  lastRenewalYear: number;
  resolutionNo: string;
  resolutionDate: Date | string;
  remarks?: string;
  actor: WorkflowActor;
}

export class BploDomainService {
  /**
   * 1. Franchise Lookup by Name, Body Number, or Operator
   * Retrieves franchise details and detects the Last Franchise Renewal Year.
   */
  public static async findFranchiseForRenewal(query: string) {
    const trimmed = query.trim();
    const asNumber = parseInt(trimmed, 10);

    const franchises = await prisma.newFranchise.findMany({
      where: {
        OR: [
          !isNaN(asNumber) ? { franchiseBodyNumber: asNumber } : {},
          {
            operator: {
              OR: [
                { name: { contains: trimmed, mode: "insensitive" } },
                { operatorId: { contains: trimmed, mode: "insensitive" } },
              ],
            },
          },
          {
            mtopVehicle: {
              plateNumber: { contains: trimmed, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        operator: true,
        mtopVehicle: true,
        applications: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      take: 10,
    });

    return franchises.map((f) => {
      // Find the last renewal year:
      // 1. Explicitly stored on franchise
      // 2. Or from the latest approved application
      // 3. Or year of creation / assigned date
      // 4. Default to 3 years prior to current (e.g. 2023)
      const currentYear = new Date().getFullYear();
      let detectedLastYear = f.lastRenewalYear;

      if (!detectedLastYear && f.applications && f.applications.length > 0) {
        const lastApp = f.applications.find(
          (a) => a.status === "COMPLETED" || a.status === "SP_APPROVED"
        );
        if (lastApp) {
          detectedLastYear = lastApp.appyear;
        }
      }

      if (!detectedLastYear && f.assignedDate) {
        detectedLastYear = new Date(f.assignedDate).getFullYear();
      }

      if (!detectedLastYear) {
        detectedLastYear = currentYear - 3; // Default to 1 full 3-year term ago (clean renewal baseline)
      }

      const delinquentCalc = FranchiseBillingEngine.calculatePastDelinquency({
        lastRenewalYear: detectedLastYear,
        currentYear,
      });

      return {
        id: f.id,
        franchiseBodyNumber: f.franchiseBodyNumber,
        zone: f.zone,
        isActive: f.isActive,
        isAssigned: f.isAssigned,
        operator: f.operator,
        mtopVehicle: f.mtopVehicle,
        lastRenewalYear: detectedLastYear,
        priorResolutionNo: f.priorResolutionNo || "SP-RES-2023-088",
        priorResolutionDate: f.priorResolutionDate || new Date("2023-06-15"),
        delinquencyPreview: delinquentCalc,
        isGoodForRenewal: !delinquentCalc.isDelinquent,
      };
    });
  }

  /**
   * 2. Capture Franchise Application
   * - Sets the last renewal year of the franchise
   * - Records: (a) Last Year renewal, (b) resolution number, (c) resolution date, (d) remarks
   * - Logs the taskId and task in FranchiseTasks
   * - Generates franchise billing except for current (6,000 / 3 yrs, inspection fee, 25% surcharge, 2% monthly interest <= 72%)
   * - If good for renewal (clean / no delinquent), submits application directly to City Traffic for Clearance!
   */
  public static async captureRenewalApplication(input: CaptureRenewalApplicationInput) {
    const { franchiseId, lastRenewalYear, resolutionNo, resolutionDate, remarks, actor } = input;

    WorkflowStateMachine.validateDomainBarrier(actor, "BPLO");
    WorkflowStateMachine.validateRolePrerequisite(actor, "STAFF");

    const franchise = await prisma.newFranchise.findUnique({
      where: { id: franchiseId },
      include: { operator: true, mtopVehicle: true },
    });

    if (!franchise) {
      throw new StateMachineError(`Franchise with ID '${franchiseId}' not found.`, 404);
    }

    const currentYear = new Date().getFullYear();
    const resDate = new Date(resolutionDate);

    // Calculate delinquent billing for unrenewed terms prior to current
    const delinquentCalc = FranchiseBillingEngine.calculatePastDelinquency({
      lastRenewalYear,
      currentYear,
    });

    const isGoodForRenewal = !delinquentCalc.isDelinquent;

    return await prisma.$transaction(async (tx) => {
      // 1. Update NewFranchise with recorded lastRenewalYear & prior resolution info
      await tx.newFranchise.update({
        where: { id: franchiseId },
        data: {
          lastRenewalYear,
          priorResolutionNo: resolutionNo,
          priorResolutionDate: resDate,
        },
      });

      // 2. Create the initial Task in FranchiseTasks: City Traffic Clearance & Inspection
      const initialTask = await tx.franchiseTasks.create({
        data: {
          office: "TRAFFIC",
          taskname: "City Traffic Clearance & Vehicle Inspection",
          taskdesc: `Conduct CTMO vehicle inspection & roadworthiness clearance for Franchise Body #${franchise.franchiseBodyNumber}. Intake captured by ${actor.name} (BPLO).`,
          userId: actor.id,
          newFranchiseId: franchise.id,
        },
      });

      const mtopNo = `MTOP-${currentYear}-${String(franchise.franchiseBodyNumber).padStart(4, "0")}`;

      // 3. Create FranchiseApplication record
      const application = await tx.franchiseApplication.create({
        data: {
          mtopNo,
          appyear: currentYear,
          apptype: "RENEWAL",
          lastRenewalYear,
          priorResolutionNo: resolutionNo,
          priorResolutionDate: resDate,
          remarks: remarks || `Franchise Renewal Intake. Prior Resolution: ${resolutionNo} dated ${resDate.toISOString().slice(0, 10)}.`,
          status: "UNDER_INSPECTION",
          currentDomain: "TRAFFIC", // Routed to City Traffic
          taskId: initialTask.id,
          newFranchiseId: franchise.id,
        },
      });

      // Update current application pointer on NewFranchise
      await tx.newFranchise.update({
        where: { id: franchiseId },
        data: { currentApplicationId: application.id },
      });

      // 4. If delinquent, generate FranchiseAssessment record for overdue terms
      let assessmentRecord = null;
      if (delinquentCalc.isDelinquent && delinquentCalc.totalDelinquentAmount > 0) {
        const billingPayload = {
          mtopNo,
          franchiseBodyNumber: franchise.franchiseBodyNumber,
          taxpayerName: franchise.operator?.name || "Operator",
          taxpayerAddress: franchise.operator?.address || "Tagbilaran City",
          assessmentType: "DELINQUENCY" as const,
          items: [
            {
              accountCode: "4-01-01-080",
              accountTitle: `Overdue Franchise Tax (${delinquentCalc.unrenewedCycleCount} cycle(s) @ 6,000/3-yr)`,
              amount: delinquentCalc.baseFranchiseTax,
            },
            {
              accountCode: "4-02-01-030",
              accountTitle: "Overdue Annual Inspection Fees",
              amount: delinquentCalc.inspectionFee,
            },
            {
              accountCode: "4-01-01-081",
              accountTitle: "Statutory Surcharge (25%)",
              amount: delinquentCalc.surchargeAmount,
            },
            {
              accountCode: "4-01-01-082",
              accountTitle: `Monthly Penalty Interest (${delinquentCalc.interestPercent}% capped at 72%)`,
              amount: delinquentCalc.interestAmount,
            },
          ],
          totalAmount: delinquentCalc.totalDelinquentAmount,
        };

        const etracsResult = await etracsClient.ingestBilling(billingPayload);

        assessmentRecord = await tx.franchiseAssessment.create({
          data: {
            applicationId: application.id,
            billingReference: etracsResult.billingReference,
            assessmentType: "DELINQUENCY",
            franchiseTax: delinquentCalc.baseFranchiseTax,
            surcharge: delinquentCalc.surchargeAmount,
            penalty: delinquentCalc.interestAmount,
            clearanceFee: delinquentCalc.inspectionFee,
            totalAmount: delinquentCalc.totalDelinquentAmount,
            status: "PENDING",
          },
        });
      }

      return {
        application,
        task: initialTask,
        delinquencyCalculation: delinquentCalc,
        assessment: assessmentRecord,
        isGoodForRenewal,
      };
    });
  }

  /**
   * Verify statutory documents
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

    const application = await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: {
        status: "UNDER_INSPECTION",
        remarks: `Statutory requirements verified by ${actor.name} (BPLO).`,
      },
    });

    return application;
  }

  /**
   * Legacy endpoint compatibility: Assess delinquency for N expired years
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

    const calc = FranchiseBillingEngine.calculatePastDelinquency({
      lastRenewalYear: application.lastRenewalYear || new Date().getFullYear() - expiredYearsCount,
      currentYear: new Date().getFullYear(),
    });

    return {
      breakdown: calc,
      totalDelinquency: calc.totalDelinquentAmount,
    };
  }

  /**
   * Legacy endpoint compatibility: Handoff to SP
   */
  public static async handoffToSP(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor,
    remarks?: string
  ) {
    WorkflowStateMachine.validateDomainBarrier(actor, "BPLO");
    WorkflowStateMachine.validateRolePrerequisite(actor, "SUPERVISOR");

    const transition = await WorkflowStateMachine.forwardTask(
      currentTaskId,
      "SP",
      "Franchise Renewal Resolution",
      "Enact council resolution for franchise renewal.",
      actor,
      remarks || "Endorsed to SP."
    );

    return transition;
  }

  /**
   * Legacy endpoint compatibility: Issue Final Permit
   */
  public static async issueFinalPermit(
    applicationId: string,
    currentTaskId: string,
    actor: WorkflowActor
  ) {
    const now = new Date();
    const updated = await prisma.franchiseApplication.update({
      where: { id: applicationId },
      data: {
        status: "COMPLETED",
        approvedBy: actor.name,
        approvedDate: now,
      },
    });
    if (currentTaskId) {
      await prisma.franchiseTasks.update({
        where: { id: currentTaskId },
        data: {
          taskdesc: `Final permit issued by ${actor.name}.`,
          updatedAt: now,
        },
      });
    }
    return updated;
  }
}
