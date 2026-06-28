import { NextResponse } from "next/server";
import { prisma, withAudit } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, orNumber } = body;

    if (amount === undefined || !orNumber) {
      return NextResponse.json({ error: "Missing amount or orNumber" }, { status: 400 });
    }

    const franchise = await prisma.franchise.findUnique({ where: { id } });
    
    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    await db.$transaction(async (tx) => {
      // Create the transaction record
      await tx.franchiseTransaction.create({
        data: {
          franchiseId: id,
          transactionType: "FRANCHISE_FEE",
          paymentStatus: "PAID",
          amount: parseFloat(amount.toString()),
          paymentDate: new Date(),
          orNumber: orNumber,
        },
      });

      // Update the franchise status to FOR_SP_APPROVAL upon payment
      await tx.franchise.update({
        where: { id },
        data: { status: "FOR_SP_APPROVAL" },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Payment recorded successfully",
      data: {
        franchiseId: id,
        status: "FOR_SP_APPROVAL"
      }
    });
  } catch (error: any) {
    console.error("PUT Payment Error:", error);
    if (error?.code === "P2002") {
       return NextResponse.json({ error: "OR Number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
