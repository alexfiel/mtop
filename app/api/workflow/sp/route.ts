/**
 * app/api/workflow/sp/route.ts
 * Sangguniang Panlungsod (SP - City Council) API Routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { SpDomainService } from "@/lib/workflow/services/sp-service";
import { StateMachineError } from "@/lib/workflow/state-machine";
import { WorkflowActor } from "@/lib/workflow/types";

function extractActor(req: NextRequest): WorkflowActor {
  return {
    id: req.headers.get("x-user-id") || "officer-sp-01",
    name: req.headers.get("x-user-name") || "Hon. Gabriel Lim (SP Committee)",
    domain: (req.headers.get("x-user-domain") as any) || "SP",
    role: (req.headers.get("x-user-role") as any) || "SUPERVISOR",
  };
}

export async function POST(req: NextRequest) {
  try {
    const actor = extractActor(req);
    const body = await req.json();
    const action = req.nextUrl.searchParams.get("action") || body.action;

    if (action === "assess-legislative-tax") {
      const { applicationId, isRenewal } = body;
      if (!applicationId) {
        return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
      }

      const result = await SpDomainService.assessLegislativeTax(
        applicationId,
        !!isRenewal,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "enqueue-order-of-the-day") {
      const { applicationId, sessionDate, sessionNumber } = body;
      if (!applicationId || !sessionDate) {
        return NextResponse.json(
          { error: "applicationId and sessionDate are required" },
          { status: 400 }
        );
      }

      const result = await SpDomainService.enqueueOrderOfTheDay(
        applicationId,
        new Date(sessionDate),
        sessionNumber || `SESSION-${new Date().getFullYear()}-REG`,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "record-council-vote") {
      const { applicationId, vote } = body;
      if (!applicationId || !vote) {
        return NextResponse.json(
          { error: "applicationId and vote payload are required" },
          { status: 400 }
        );
      }

      const result = await SpDomainService.recordCouncilVote(
        applicationId,
        vote,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "return-docket-bplo") {
      const { applicationId, currentTaskId, remarks } = body;
      if (!applicationId || !currentTaskId) {
        return NextResponse.json(
          { error: "applicationId and currentTaskId are required" },
          { status: 400 }
        );
      }

      const result = await SpDomainService.returnDocketToBplo(
        applicationId,
        currentTaskId,
        actor,
        remarks
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
