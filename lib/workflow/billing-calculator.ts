/**
 * lib/workflow/billing-calculator.ts
 * Tagbilaran City MTOP Franchise Delinquency & Renewal Billing Computation Engine.
 * Conforms to LGC 1991 (RA 7160 Sec. 168) and Tagbilaran City MTOP Ordinances.
 */

export interface DelinquencyCalculationInput {
  lastRenewalYear: number;
  currentYear?: number;
  inspectionFeePerCycle?: number;
}

export interface UnrenewedCycle {
  startYear: number;
  endYear: number;
  cycleLabel: string;
}

export interface DelinquencyCalculationResult {
  lastRenewalYear: number;
  currentYear: number;
  unrenewedCycleCount: number;
  unrenewedCycles: UnrenewedCycle[];
  baseFranchiseTax: number; // 6,000 every 3 years
  inspectionFee: number; // e.g. 360 per cycle
  surchargePercent: number; // 25% statutory
  surchargeAmount: number;
  interestPercent: number; // 2% per month, capped at 72%
  interestAmount: number;
  totalDelinquentAmount: number;
  isDelinquent: boolean;
  remarks: string;
}

export interface RenewalBillingBreakdown {
  applicationYear: number;
  renewalTermYears: number; // 3 years standard
  baseFranchiseFee: number; // 6,000 for 3-year term
  mayorsPermitFee: number; // 1,500
  regulatoryStickerFee: number; // 350
  healthSanitaryFee: number; // 250
  filingFee: number; // 500
  totalRenewalAmount: number;
}

export class FranchiseBillingEngine {
  public static readonly BASE_3YR_FRANCHISE_FEE = 6000;
  public static readonly DEFAULT_INSPECTION_FEE = 360;
  public static readonly SURCHARGE_RATE = 0.25; // 25%
  public static readonly MONTHLY_INTEREST_RATE = 0.02; // 2% per month
  public static readonly MAX_INTEREST_CAP = 0.72; // Maximum statutory cap: 72% (36 months)

  /**
   * Calculates delinquent franchise billing for expired past 3-year cycles,
   * STRICTLY EXCLUDING the current renewal term.
   */
  public static calculatePastDelinquency(
    input: DelinquencyCalculationInput
  ): DelinquencyCalculationResult {
    const currentYear = input.currentYear || new Date().getFullYear();
    const lastRenewalYear = Math.max(1990, Math.min(currentYear, input.lastRenewalYear));
    const inspectionFeePerCycle =
      input.inspectionFeePerCycle !== undefined
        ? input.inspectionFeePerCycle
        : this.DEFAULT_INSPECTION_FEE;

    const yearsElapsed = currentYear - lastRenewalYear;
    // MTOP franchise terms are 3-year cycles.
    // The current 3-year cycle is being renewed now and handled by SP, so we exclude it.
    const total3YearCycles = Math.floor(yearsElapsed / 3);
    const unrenewedCycleCount = Math.max(0, total3YearCycles - 1);

    const unrenewedCycles: UnrenewedCycle[] = [];
    for (let i = 0; i < unrenewedCycleCount; i++) {
      const cycleStart = lastRenewalYear + i * 3;
      const cycleEnd = cycleStart + 3;
      unrenewedCycles.push({
        startYear: cycleStart,
        endYear: cycleEnd,
        cycleLabel: `${cycleStart} - ${cycleEnd} (Expired)`,
      });
    }

    if (unrenewedCycleCount === 0) {
      return {
        lastRenewalYear,
        currentYear,
        unrenewedCycleCount: 0,
        unrenewedCycles: [],
        baseFranchiseTax: 0,
        inspectionFee: 0,
        surchargePercent: 25,
        surchargeAmount: 0,
        interestPercent: 0,
        interestAmount: 0,
        totalDelinquentAmount: 0,
        isDelinquent: false,
        remarks: `Clean Renewal: Last renewal was in ${lastRenewalYear}. No past delinquent 3-year terms. Current ${currentYear} renewal applies.`,
      };
    }

    const baseFranchiseTax = unrenewedCycleCount * this.BASE_3YR_FRANCHISE_FEE;
    const inspectionFee = unrenewedCycleCount * inspectionFeePerCycle;
    const taxableBase = baseFranchiseTax + inspectionFee;

    // Surcharge of 25%
    const surchargeAmount = Math.round(taxableBase * this.SURCHARGE_RATE * 100) / 100;

    // Interest of 2% per month, capped at 72% maximum
    // Calculate months overdue from the expiration of the earliest unrenewed term
    const earliestExpirationYear = lastRenewalYear + 3;
    const monthsOverdue = Math.max(1, (currentYear - earliestExpirationYear) * 12);
    const calculatedRate = monthsOverdue * this.MONTHLY_INTEREST_RATE;
    const cappedRate = Math.min(this.MAX_INTEREST_CAP, calculatedRate);
    const interestPercent = Math.round(cappedRate * 100);
    const interestAmount = Math.round(taxableBase * cappedRate * 100) / 100;

    const totalDelinquentAmount =
      Math.round((taxableBase + surchargeAmount + interestAmount) * 100) / 100;

    return {
      lastRenewalYear,
      currentYear,
      unrenewedCycleCount,
      unrenewedCycles,
      baseFranchiseTax,
      inspectionFee,
      surchargePercent: 25,
      surchargeAmount,
      interestPercent,
      interestAmount,
      totalDelinquentAmount,
      isDelinquent: true,
      remarks: `Delinquent: ${unrenewedCycleCount} overdue 3-year franchise term(s) detected (${unrenewedCycles
        .map((c) => c.cycleLabel)
        .join(", ")}). Current ${currentYear} renewal term excluded.`,
    };
  }

  /**
   * Generates standard renewal fee breakdown for the CURRENT 3-year term (issued by SP)
   */
  public static calculateCurrentRenewalBilling(
    applicationYear: number = new Date().getFullYear()
  ): RenewalBillingBreakdown {
    const baseFranchiseFee = this.BASE_3YR_FRANCHISE_FEE; // 6,000 for 3 years
    const mayorsPermitFee = 1500;
    const regulatoryStickerFee = 350;
    const healthSanitaryFee = 250;
    const filingFee = 500;
    const totalRenewalAmount =
      baseFranchiseFee +
      mayorsPermitFee +
      regulatoryStickerFee +
      healthSanitaryFee +
      filingFee;

    return {
      applicationYear,
      renewalTermYears: 3,
      baseFranchiseFee,
      mayorsPermitFee,
      regulatoryStickerFee,
      healthSanitaryFee,
      filingFee,
      totalRenewalAmount,
    };
  }
}
