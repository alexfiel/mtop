/**
 * lib/workflow/etracs-interceptor.ts
 * Resilient eTRACS Treasury Ledger API Adapter / Interceptor Layer.
 * Implements HMAC authentication, exponential backoff retries, and schema adaptation.
 */

import crypto from "crypto";
import {
  EtracsBillingPayload,
  EtracsBillingResponse,
  EtracsPaymentStatusResponse,
  EtracsPaymentWebhookPayload,
} from "./types";

export interface EtracsConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: EtracsConfig = {
  baseUrl: process.env.ETRACS_API_URL || "https://etracs.tagbilaran.gov.ph/api/v2",
  apiKey: process.env.ETRACS_API_KEY || "etracs_mtop_client_live_key",
  secretKey: process.env.ETRACS_SECRET_KEY || "etracs_secret_signing_hmac_2026",
  maxRetries: 3,
  timeoutMs: 8000,
};

export class EtracsInterceptor {
  private config: EtracsConfig;

  // Local simulated ledger for development / offline resilience
  private static mockLedger: Map<
    string,
    {
      billing: EtracsBillingPayload;
      isPaid: boolean;
      orNumber: string | null;
      paymentDate: string | null;
      amountPaid: number;
    }
  > = new Map();

  constructor(config?: Partial<EtracsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generates cryptographic HMAC-SHA256 signature for outgoing and incoming payloads
   */
  public generateHmacSignature(data: string): string {
    return crypto
      .createHmac("sha256", this.config.secretKey)
      .update(data)
      .digest("hex");
  }

  /**
   * Verifies incoming webhook signatures from Treasury
   */
  public verifyWebhookSignature(payloadString: string, incomingSignature: string): boolean {
    const expected = this.generateHmacSignature(payloadString);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(incomingSignature, "hex")
      );
    } catch {
      return false;
    }
  }

  /**
   * Resilient execute with exponential backoff & jitter
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (err: any) {
      if (retryCount >= this.config.maxRetries) {
        throw err;
      }
      const backoffMs = Math.pow(2, retryCount) * 400 + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return this.executeWithRetry(operation, retryCount + 1);
    }
  }

  /**
   * 1. Ingest and register a billing statement from BPLO or SP into eTRACS
   */
  public async ingestBilling(payload: EtracsBillingPayload): Promise<EtracsBillingResponse> {
    return this.executeWithRetry(async () => {
      // In real deployment with active eTRACS server:
      const timestamp = new Date().toISOString();
      const billingRef = `ETRACS-BILL-${new Date().getFullYear()}-${payload.franchiseBodyNumber.toString().padStart(4, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payloadString = JSON.stringify(payload);
      const signature = this.generateHmacSignature(payloadString);

      // Attempt live upstream call if ETRACS_LIVE_ENABLED is set
      if (process.env.ETRACS_LIVE_ENABLED === "true") {
        const response = await fetch(`${this.config.baseUrl}/billing/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-eTRACS-API-Key": this.config.apiKey,
            "X-eTRACS-Signature": signature,
            "X-eTRACS-Timestamp": timestamp,
          },
          body: payloadString,
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`eTRACS Error: ${response.status} ${response.statusText}`);
        }
        return (await response.json()) as EtracsBillingResponse;
      }

      // High-fidelity fallback / adapter emulation:
      EtracsInterceptor.mockLedger.set(billingRef, {
        billing: payload,
        isPaid: false,
        orNumber: null,
        paymentDate: null,
        amountPaid: 0,
      });

      return {
        success: true,
        billingReference: billingRef,
        billDate: timestamp,
        totalAmount: payload.totalAmount,
        status: "PENDING",
        qrCodeData: `https://etracs.tagbilaran.gov.ph/pay?ref=${billingRef}&amount=${payload.totalAmount}`,
        message: `Registered in Treasury Assessment Queue (${payload.assessmentType})`,
      };
    });
  }

  /**
   * 2. Fallback polling endpoint to verify payment status and reconcile OR numbers
   */
  public async pollPaymentStatus(
    billingReference: string
  ): Promise<EtracsPaymentStatusResponse> {
    return this.executeWithRetry(async () => {
      if (process.env.ETRACS_LIVE_ENABLED === "true") {
        const signature = this.generateHmacSignature(billingReference);
        const response = await fetch(
          `${this.config.baseUrl}/payment-status/${encodeURIComponent(billingReference)}`,
          {
            method: "GET",
            headers: {
              "X-eTRACS-API-Key": this.config.apiKey,
              "X-eTRACS-Signature": signature,
            },
            signal: AbortSignal.timeout(this.config.timeoutMs),
          }
        );

        if (!response.ok) {
          throw new Error(`eTRACS Polling Failed: ${response.statusText}`);
        }
        return (await response.json()) as EtracsPaymentStatusResponse;
      }

      // Check simulated ledger
      const record = EtracsInterceptor.mockLedger.get(billingReference);
      if (!record) {
        return {
          billingReference,
          isPaid: false,
          orNumber: null,
          amountPaid: null,
          paymentDate: null,
          cashierId: null,
        };
      }

      return {
        billingReference,
        isPaid: record.isPaid,
        orNumber: record.orNumber,
        amountPaid: record.amountPaid,
        paymentDate: record.paymentDate,
        cashierId: "CASHIER-MAIN-04",
      };
    });
  }

  /**
   * 3. Webhook listener: processes confirmed payment event from Treasury
   */
  public async processPaymentWebhook(
    payload: EtracsPaymentWebhookPayload
  ): Promise<{ reconciled: boolean; billingReference: string; orNumber: string }> {
    // Record in ledger
    const record = EtracsInterceptor.mockLedger.get(payload.billingReference);
    if (record) {
      record.isPaid = true;
      record.orNumber = payload.orNumber;
      record.paymentDate = payload.paymentDate;
      record.amountPaid = payload.amountPaid;
    }

    return {
      reconciled: true,
      billingReference: payload.billingReference,
      orNumber: payload.orNumber,
    };
  }

  /**
   * Helper to manually simulate cash collection in eTRACS for testing/demonstration
   */
  public simulateCashPayment(
    billingReference: string,
    amount: number
  ): EtracsPaymentWebhookPayload {
    const orNumber = `OR-TAG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const payload: EtracsPaymentWebhookPayload = {
      billingReference,
      orNumber,
      amountPaid: amount,
      paymentDate: now,
      paymentMode: "CASH",
      cashierId: "CASHIER-TREASURY-01",
      cashierName: "Elena Rodriguez (Revenue Collector II)",
      signature: "",
    };

    payload.signature = this.generateHmacSignature(JSON.stringify(payload));

    const record = EtracsInterceptor.mockLedger.get(billingReference);
    if (record) {
      record.isPaid = true;
      record.orNumber = orNumber;
      record.paymentDate = now;
      record.amountPaid = amount;
    }

    return payload;
  }
}

export const etracsClient = new EtracsInterceptor();
