/**
 * app/api/workflow/integrations/etracs/billing/route.ts
 * eTRACS Treasury Ingestion Endpoint (POST /etracs/billing).
 */

import { NextRequest, NextResponse } from "next/server";
import { etracsClient } from "@/lib/workflow/etracs-interceptor";
import { EtracsBillingPayload } from "@/lib/workflow/types";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as EtracsBillingPayload;

    if (!payload.mtopNo || !payload.franchiseBodyNumber || !payload.totalAmount) {
      return NextResponse.json(
        { error: "Invalid billing payload: mtopNo, franchiseBodyNumber, and totalAmount are required" },
        { status: 400 }
      );
    }

    const result = await etracsClient.ingestBilling(payload);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to ingest billing into eTRACS" },
      { status: 500 }
    );
  }
}
