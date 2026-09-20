/**
 * app/api/workflow/bplo/route.ts
 * BPLO Business Permit and Licensing Office API Routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { BploDomainService } from "@/lib/workflow/services/bplo-service";
import { StateMachineError } from "@/lib/workflow/state-machine";
import { WorkflowActor } from "@/lib/workflow/types";

function extractActor(req: NextRequest): WorkflowActor {
  return {
    id: req.headers.get("x-user-id") || "officer-bplo-01",
    name: req.headers.get("x-user-name") || "Elena Vasquez (BPLO)",
    domain: (req.headers.get("x-user-domain") as any) || "BPLO",
    role: (req.headers.get("x-user-role") as any) || "STAFF",
  };
}

export async function POST(req: NextRequest) {
  try {
    const actor = extractActor(req);
    const body = await req.json();
    const action = req.nextUrl.searchParams.get("action") || body.action;

    if (action === "verify-intake") {
      const { applicationId, statutoryDocsVerified } = body;
      if (!applicationId) {
        return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
      }

      const result = await BploDomainService.verifyIntake(
        applicationId,
        !!statutoryDocsVerified,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "assess-delinquency") {
      const { applicationId, expiredYearsCount } = body;
      if (!applicationId) {
        return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
      }

      const result = await BploDomainService.assessDelinquency(
        applicationId,
        expiredYearsCount || 1,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "handoff-sp") {
      const { applicationId, currentTaskId, remarks } = body;
      if (!applicationId || !currentTaskId) {
        return NextResponse.json(
          { error: "applicationId and currentTaskId are required" },
          { status: 400 }
        );
      }

      const result = await BploDomainService.handoffToSP(
        applicationId,
        currentTaskId,
        actor,
        remarks
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "issue-permit") {
      const { applicationId, currentTaskId } = body;
      if (!applicationId || !currentTaskId) {
        return NextResponse.json(
          { error: "applicationId and currentTaskId are required" },
          { status: 400 }
        );
      }

      const result = await BploDomainService.issueFinalPermit(
        applicationId,
        currentTaskId,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    const status = err instanceof StateMachineError ? err.statusCode : 500;
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status }
    );
  }
}
