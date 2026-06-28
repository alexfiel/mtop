import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const franchise = await prisma.franchise.findUnique({ where: { id } });
    
    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
    }

    const accounts = await prisma.itemAccounts.findMany({
      orderBy: { createdAt: 'desc' }
    });

    let applicableFees = [];
    if (franchise.isRenewal) {
      applicableFees = accounts.filter(acc => {
        const name = acc.account_name.toLowerCase();
        return name.includes("mtop - franchise tax renewal") || 
               name.includes("mtop-franchise tax renewal") ||
               name.includes("inspection fee") || 
               name.includes("security seal");
      });
    } else {
      applicableFees = accounts.filter(acc => {
        const name = acc.account_name.toLowerCase();
        return name.includes("mtop - franchise tax new") || 
               name.includes("mtop-franchise tax new") ||
               name.includes("inspection fee") || 
               name.includes("security fee");
      });
    }

    const totalAmount = applicableFees.reduce((sum, acc) => sum + (acc.default_amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        franchise: {
          id: franchise.id,
          franchiseNo: franchise.franchiseNo,
          ownerName: franchise.ownerName,
          isRenewal: franchise.isRenewal,
          status: franchise.status
        },
        fees: applicableFees.map(f => ({
          description: f.account_name,
          accountNumber: f.account_number,
          amount: f.default_amount
        })),
        totalAmount
      }
    });
  } catch (error) {
    console.error("GET Bill Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
