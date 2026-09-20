/**
 * app/api/workflow/integrations/etracs/payment-status/[id]/route.ts
 * Fallback Polling Endpoint (GET /etracs/payment-status/{billing_id}).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { etracsClient } from "@/lib/workflow/etracs-interceptor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const billingReference = decodeURIComponent(id);

    // 1. Poll from eTRACS client
    const etracsStatus = await etracsClient.pollPaymentStatus(billingReference);

    // 2. Query local database record
    const assessment = await prisma.franchiseAssessment.findUnique({
      where: { billingReference },
      include: { application: true },
    });

    // 3. Reconcile if eTRACS shows paid but local database is still pending
    if (etracsStatus.isPaid && assessment && assessment.status !== "PAID") {
      const paymentDate = etracsStatus.paymentDate ? new Date(etracsStatus.paymentDate) : new Date();
      await prisma.franchiseAssessment.update({
        where: { id: assessment.id },
        data: {
          status: "PAID",
          orNumber: etracsStatus.orNumber,
          paymentDate,
        },
      });
    }

    return NextResponse.json({
      success: true,
      billingReference,
      isPaid: etracsStatus.isPaid || assessment?.status === "PAID",
      orNumber: etracsStatus.orNumber || assessment?.orNumber,
      amount: assessment?.totalAmount || etracsStatus.amountPaid,
      status: assessment?.status || (etracsStatus.isPaid ? "PAID" : "PENDING"),
      paymentDate: assessment?.paymentDate || etracsStatus.paymentDate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query payment status" },
      { status: 500 }
    );
  }
}
