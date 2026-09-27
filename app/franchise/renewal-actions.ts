"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { BploDomainService } from "@/lib/workflow/services/bplo-service";
import { TrafficDomainService } from "@/lib/workflow/services/traffic-service";
import { SpDomainService } from "@/lib/workflow/services/sp-service";
import { FranchiseBillingEngine } from "@/lib/workflow/billing-calculator";
import { WorkflowActor, WorkflowDomain, WorkflowUserRole } from "@/lib/workflow/types";

async function getActor(
  defaultDomain: WorkflowDomain = "BPLO",
  defaultRole: WorkflowUserRole = "STAFF",
  fallbackName: string = "Elena Vasquez (BPLO)"
): Promise<WorkflowActor> {
  let userId = "officer-default";
  let name = fallbackName;
  let domain = defaultDomain;
  let role = defaultRole;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      userId = session.user.id;
      name = session.user.name || fallbackName;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          roles: { include: { role: true } },
          profile: { include: { domain: true } },
        },
      });

      if (user) {
        const isAdmin = user.roles.some(
          (ur) => ur.role.name === "ADMIN" || ur.role.name === "SUPERADMIN"
        );
        const isSupervisor = user.roles.some((ur) => ur.role.name === "SUPERVISOR");

        if (isAdmin) {
          role = "ADMIN";
        } else if (isSupervisor) {
          role = "SUPERVISOR";
        }

        const userDomainCode = user.profile?.domain?.code || user.profile?.office;
        if (userDomainCode && ["BPLO", "TRAFFIC", "SP", "TREASURY"].includes(userDomainCode)) {
          domain = userDomainCode as WorkflowDomain;
        }
      }
    }
  } catch {
    // Background/SSR context fallback
  }

  return {
    id: userId,
    name,
    domain,
    role,
  };
}

/**
 * 1. Search Franchise for Renewal Intake
 * Returns franchise record and its Last Franchise Renewal Year
 */
export async function searchFranchiseForRenewalAction(query: string) {
  try {
    const results = await BploDomainService.findFranchiseForRenewal(query);
    return { success: true, franchises: results };
  } catch (error: any) {
    console.error("Error searching franchise for renewal:", error);
    return { success: false, error: error.message || "Failed to search franchise." };
  }
}

/**
 * 2. Calculate Delinquency Breakdown (excluding current term)
 */
export async function calculateDelinquencyAction(lastRenewalYear: number) {
  try {
    const result = FranchiseBillingEngine.calculatePastDelinquency({
      lastRenewalYear,
      currentYear: new Date().getFullYear(),
    });
    return { success: true, calculation: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 3. Capture Franchise Application (BPLO Intake)
 * Asks for:
 * a. Last Year renewal
 * b. Resolution number
 * c. Resolution date
 * d. Remarks
 * Logs taskId & task, generates delinquent billing (except current), and if clean forwards to City Traffic.
 */
export async function captureFranchiseRenewalAction(input: {
  franchiseId: string;
  lastRenewalYear: number;
  resolutionNo: string;
  resolutionDate: string;
  remarks?: string;
  actorDomain?: WorkflowDomain;
  actorRole?: WorkflowUserRole;
  actorName?: string;
}) {
  try {
    const actor = await getActor(
      input.actorDomain || "BPLO",
      input.actorRole || "STAFF",
      input.actorName || "Elena Vasquez (BPLO)"
    );

    const result = await BploDomainService.captureRenewalApplication({
      franchiseId: input.franchiseId,
      lastRenewalYear: input.lastRenewalYear,
      resolutionNo: input.resolutionNo,
      resolutionDate: new Date(input.resolutionDate),
      remarks: input.remarks,
      actor,
    });

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return {
      success: true,
      applicationId: result.application.id,
      mtopNo: result.application.mtopNo,
      taskId: result.task.id,
      taskName: result.task.taskname,
      currentDomain: result.application.currentDomain,
      status: result.application.status,
      delinquency: result.delinquencyCalculation,
      isGoodForRenewal: result.isGoodForRenewal,
    };
  } catch (error: any) {
    console.error("Error capturing franchise application:", error);
    return { success: false, error: error.message || "Failed to capture application." };
  }
}

/**
 * 4. Fetch all Applications with full Pipeline Context
 */
export async function getWorkflowApplicationsAction() {
  try {
    const applications = await prisma.franchiseApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        newFranchise: {
          include: {
            operator: true,
            mtopVehicle: true,
          },
        },
        task: true,
        trafficClearance: true,
        spResolution: true,
        assessments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return { success: true, applications };
  } catch (error: any) {
    console.error("Error fetching workflow applications:", error);
    return { success: false, error: error.message || "Failed to fetch applications." };
  }
}

/**
 * 5. City Traffic Issues Clearance and Forwards to SP
 * "if City Traffic issued clearance submit application to SP for Franchise Resolution"
 */
export async function issueTrafficClearanceAndForwardAction(input: {
  applicationId: string;
  currentTaskId: string;
  engineVerified?: boolean;
  roadworthyPassed?: boolean;
  brakesLightsOk?: boolean;
  remarks?: string;
  actorName?: string;
}) {
  try {
    const actor = await getActor("TRAFFIC", "SUPERVISOR", input.actorName || "Engr. Roberto Santos (CTMO)");

    // 1. Record Inspection
    await TrafficDomainService.recordInspection(
      input.applicationId,
      {
        engineChassisVerified: input.engineVerified ?? true,
        roadworthinessPassed: input.roadworthyPassed ?? true,
        brakesAndLightsOk: input.brakesLightsOk ?? true,
        bodyPaintOk: true,
        remarks: input.remarks,
      },
      actor
    );

    // 2. Issue clearance and forward directly to SP
    const result = await TrafficDomainService.forwardToSPForResolution(
      input.applicationId,
      input.currentTaskId,
      actor,
      input.remarks
    );

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return { success: true, application: result.application, spTask: result.spTask };
  } catch (error: any) {
    console.error("Error issuing traffic clearance:", error);
    return { success: false, error: error.message || "Failed to issue traffic clearance." };
  }
}

/**
 * 6. SP Issues Resolution Number for Franchise Renewal
 * "SP issued resolution number for Franchise Renewal"
 */
export async function issueSPResolutionAction(input: {
  applicationId: string;
  currentTaskId: string;
  resolutionNumber: string;
  resolutionDate: string;
  sessionNumber?: string;
  actorName?: string;
  remarks?: string;
}) {
  try {
    const actor = await getActor("SP", "SUPERVISOR", input.actorName || "Hon. Gabriel Lim (SP Council)");

    const result = await SpDomainService.issueRenewalResolution({
      applicationId: input.applicationId,
      currentTaskId: input.currentTaskId,
      resolutionNumber: input.resolutionNumber,
      resolutionDate: new Date(input.resolutionDate),
      sessionNumber: input.sessionNumber || "Regular Legislative Session",
      actor,
      remarks: input.remarks,
    });

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error issuing SP resolution:", error);
    return { success: false, error: error.message || "Failed to issue SP resolution." };
  }
}

/**
 * 7. SP Issues Billing and Submits Application to Treasury for Payment
 * "SP will issued billing for franchise renewal and submit to application to Treasury for payment"
 */
export async function issueSPBillingAndSubmitToTreasuryAction(input: {
  applicationId: string;
  currentTaskId: string;
  actorName?: string;
}) {
  try {
    const actor = await getActor("SP", "STAFF", input.actorName || "Hon. Gabriel Lim (SP Council)");

    const result = await SpDomainService.issueBillingAndSubmitToTreasury(
      input.applicationId,
      input.currentTaskId,
      actor
    );

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error issuing SP renewal billing:", error);
    return { success: false, error: error.message || "Failed to issue renewal billing." };
  }
}

/**
 * 8. Treasury Checks Payment OK and Sends Back Application to SP for Printing
 * "Treasury will check if application is ok for payment"
 * "After payment Treasury will send back application to SP for printing of Franchise Renewal"
 */
export async function verifyTreasuryPaymentAction(input: {
  applicationId: string;
  currentTaskId: string;
  orNumber: string;
  amountPaid: number;
  actorName?: string;
  paymentMode?: "CASH" | "ONLINE" | "CHECK";
}) {
  try {
    const actor = await getActor("TREASURY", "STAFF", input.actorName || "Marcus Tan (Treasury)");

    const result = await SpDomainService.verifyPaymentAndReturnToSP({
      applicationId: input.applicationId,
      currentTaskId: input.currentTaskId,
      orNumber: input.orNumber,
      amountPaid: input.amountPaid,
      paymentMode: input.paymentMode,
      actor,
    });

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error recording Treasury payment:", error);
    return { success: false, error: error.message || "Failed to record Treasury payment." };
  }
}

/**
 * 9. SP Prints Franchise Renewal and Adds Application to the Publication
 * "SP will print Franchise Renewal and add application to the Publication."
 */
export async function printAndPublishFranchiseRenewalAction(input: {
  applicationId: string;
  currentTaskId: string;
  publicationGazette?: string;
  actorName?: string;
}) {
  try {
    const actor = await getActor("SP", "STAFF", input.actorName || "Hon. Gabriel Lim (SP Council)");

    const result = await SpDomainService.printAndPublishFranchiseRenewal(
      input.applicationId,
      input.currentTaskId,
      input.publicationGazette || "Tagbilaran City Official Gazette & SP Bulletin",
      actor
    );

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error printing and publishing franchise renewal:", error);
    return { success: false, error: error.message || "Failed to print and publish renewal." };
  }
}

/**
 * 10. SP Releases the Franchise Renewal
 * "SP will release the franchise renewal"
 * "end"
 */
export async function releaseFranchiseRenewalAction(input: {
  applicationId: string;
  currentTaskId: string;
  actorName?: string;
}) {
  try {
    const actor = await getActor("SP", "SUPERVISOR", input.actorName || "Hon. Gabriel Lim (SP Council)");

    const result = await SpDomainService.releaseFranchiseRenewal(
      input.applicationId,
      input.currentTaskId,
      actor
    );

    revalidatePath("/franchise/application");
    revalidatePath("/franchise-application");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error releasing franchise renewal:", error);
    return { success: false, error: error.message || "Failed to release franchise renewal." };
  }
}
