/**
 * lib/workflow/types.ts
 * Multi-Departmental LGU Franchise Application Workflow Engine Domain Types.
 */

export type WorkflowDomain = "TRAFFIC" | "BPLO" | "SP" | "TREASURY";

export type ApplicationType = "NEW" | "RENEWAL";

export type ApplicationWorkflowStatus =
  | "DRAFT"
  | "UNDER_INSPECTION"
  | "VIOLATIONS_PENDING"
  | "TRAFFIC_CLEARED"
  | "BPLO_REVIEW"
  | "DELINQUENT_PENDING"
  | "READY_FOR_SP"
  | "SP_ASSESSMENT"
  | "SP_PAYMENT_PENDING"
  | "SP_IN_SESSION"
  | "SP_APPROVED"
  | "SP_DISAPPROVED"
  | "FINAL_ISSUANCE"
  | "COMPLETED"
  | "CANCELLED";

export type WorkflowTaskStatus = "PENDING" | "ASSIGNED" | "COMPLETED" | "REJECTED";

export type WorkflowUserRole = "ADMIN" | "SUPERVISOR" | "STAFF";

export interface WorkflowActor {
  id: string;
  name: string;
  domain: WorkflowDomain;
  role: WorkflowUserRole;
  email?: string;
}

export interface InspectionDetails {
  engineChassisVerified: boolean;
  roadworthinessPassed: boolean;
  brakesAndLightsOk: boolean;
  bodyPaintOk: boolean;
  remarks?: string;
}

export interface ViolationRecord {
  ticketNo: string;
  code: string;
  description: string;
  fineAmount: number;
  status: "UNPAID" | "PAID" | "SETTLED";
  issuedAt: string;
}

export interface DelinquencyBreakdown {
  unpaidYears: number[];
  annualFranchiseTax: number;
  surchargePercent: number;
  surchargeAmount: number;
  interestPercent: number;
  interestAmount: number;
  filingFee: number;
  totalDelinquency: number;
}

export interface LegislativeAssessmentBreakdown {
  applicationType: ApplicationType;
  baseFranchiseTax: number;
  mayorsPermitFee: number;
  regulatoryStickerFee: number;
  healthSanitaryFee: number;
  filingFee: number;
  totalAssessment: number;
}

export interface SPVoteResult {
  sessionNumber: string;
  orderOfTheDayDate: string;
  resolutionNumber: string;
  votingResult: "APPROVED" | "DISAPPROVED" | "DEFERRED";
  affirmativeVotes: number;
  negativeVotes: number;
  abstainingVotes: number;
  signatoryName: string;
  signatoryTitle: string;
  remarks?: string;
}

// -----------------------------------------------------------------------------
// eTRACS External System Integration Types
// -----------------------------------------------------------------------------
export interface EtracsBillingItem {
  accountCode: string;
  accountTitle: string;
  amount: number;
  remarks?: string;
}

export interface EtracsBillingPayload {
  mtopNo: string;
  franchiseBodyNumber: number;
  taxpayerName: string;
  taxpayerAddress?: string;
  assessmentType: "DELINQUENCY" | "LEGISLATIVE_TAX" | "TRAFFIC_FINES";
  items: EtracsBillingItem[];
  totalAmount: number;
  dueDate?: string;
}

export interface EtracsBillingResponse {
  success: boolean;
  billingReference: string;
  billDate: string;
  totalAmount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  qrCodeData: string;
  message?: string;
}

export interface EtracsPaymentWebhookPayload {
  billingReference: string;
  orNumber: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: "CASH" | "ONLINE" | "CHECK";
  cashierId: string;
  cashierName: string;
  signature: string; // HMAC SHA-256
}

export interface EtracsPaymentStatusResponse {
  billingReference: string;
  isPaid: boolean;
  orNumber: string | null;
  amountPaid: number | null;
  paymentDate: string | null;
  cashierId: string | null;
}
