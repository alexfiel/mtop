/**
 * app/api/workflow/traffic/route.ts
 * CTMO City Traffic Management Office API Routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { TrafficDomainService } from "@/lib/workflow/services/traffic-service";
import { StateMachineError } from "@/lib/workflow/state-machine";
import { WorkflowActor } from "@/lib/workflow/types";

function extractActor(req: NextRequest): WorkflowActor {
  return {
    id: req.headers.get("x-user-id") || "officer-traffic-01",
    name: req.headers.get("x-user-name") || "Engr. Roberto Santos (CTMO)",
    domain: (req.headers.get("x-user-domain") as any) || "TRAFFIC",
    role: (req.headers.get("x-user-role") as any) || "STAFF",
  };
}

export async function POST(req: NextRequest) {
  try {
    const actor = extractActor(req);
    const body = await req.json();
    const action = req.nextUrl.searchParams.get("action") || body.action;

    if (action === "inspect") {
      const { applicationId, inspection } = body;
      if (!applicationId || !inspection) {
        return NextResponse.json(
          { error: "applicationId and inspection details are required" },
          { status: 400 }
        );
      }

      const result = await TrafficDomainService.recordInspection(
        applicationId,
        inspection,
        actor
      );
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "settle-and-clear") {
      const { applicationId } = body;
      if (!applicationId) {
        return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
      }

      const result = await TrafficDomainService.settleViolationsAndIssueClearance(
        applicationId,
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
