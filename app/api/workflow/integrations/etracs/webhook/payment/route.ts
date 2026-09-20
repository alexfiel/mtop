/**
 * app/api/workflow/integrations/etracs/webhook/payment/route.ts
 * Treasury Payment Webhook Listener (POST /etracs/webhook/payment).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { etracsClient } from "@/lib/workflow/etracs-interceptor";
import { EtracsPaymentWebhookPayload } from "@/lib/workflow/types";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-etracs-signature") || "";

    // Optional signature verification check
    if (process.env.NODE_ENV === "production" && signature) {
      const isValid = etracsClient.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody) as EtracsPaymentWebhookPayload;

    if (!payload.billingReference || !payload.orNumber) {
      return NextResponse.json(
        { error: "billingReference and orNumber are required" },
        { status: 400 }
      );
    }

    // Process through interceptor ledger
    await etracsClient.processPaymentWebhook(payload);

    // Reconcile and update database assessment record
    const assessment = await prisma.franchiseAssessment.findUnique({
      where: { billingReference: payload.billingReference },
      include: { application: true },
    });

    if (assessment) {
      const paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : new Date();

      await prisma.franchiseAssessment.update({
        where: { id: assessment.id },
        data: {
          status: "PAID",
          orNumber: payload.orNumber,
          paymentDate,
          paymentDetails: JSON.stringify(payload),
        },
      });

      // Update application status if it was awaiting payment
      if (assessment.assessmentType === "DELINQUENCY") {
        await prisma.franchiseApplication.update({
          where: { id: assessment.applicationId },
          data: {
            status: "BPLO_REVIEW",
            remarks: `${assessment.application.remarks || ""}\n[eTRACS Treasury]: Delinquency paid under OR #${payload.orNumber}.`,
          },
        });
      } else if (assessment.assessmentType === "LEGISLATIVE_TAX") {
        await prisma.franchiseApplication.update({
          where: { id: assessment.applicationId },
          data: {
            status: "SP_IN_SESSION",
            remarks: `${assessment.application.remarks || ""}\n[eTRACS Treasury]: Legislative fees paid under OR #${payload.orNumber}.`,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        reconciled: true,
        billingReference: payload.billingReference,
        orNumber: payload.orNumber,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process payment webhook" },
      { status: 500 }
    );
  }
}
