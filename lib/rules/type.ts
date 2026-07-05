export type ApplicationType = "NEW" | "RENEWAL" | "RETIREMENT";

export type ApplicationStatus = "PENDING" | "FOR_BILLING" | "FOR_PAYMENT" | "FOR_SP_APPROVAL" | "APPROVED" | "PUBLISHED" | "ACTIVE" | "SUSPENDED" | "REVOKED";

export type FranchiseStatus = "PENDING" | "FOR_SP_APPROVAL" | "APPROVED" | "PUBLISHED" | "ACTIVE" | "SUSPENDED" | "REVOKED";

export type DriverStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type PermitStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export type PaymentStatus = "PAID" | "UNPAID";

export type ViolationStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export interface FranchiseApplicationFacts {
    applicationTye: ApplicationType;


}


