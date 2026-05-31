"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createFranchiseApplication(data: {
  ownerName: string;
  address: string;
  contactNo: string;
  email: string;
  dateOfBirth: Date;
  isRenewal: boolean;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);
  
  const year = new Date().getFullYear();
  const prefix = `TAG-MTOP-${year}-`;
  
  const lastFranchise = await prisma.franchise.findFirst({
    where: {
      franchiseNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      franchiseNo: 'desc',
    },
  });

  let nextSequence = 1;
  if (lastFranchise) {
    const lastSequenceStr = lastFranchise.franchiseNo.replace(prefix, "");
    const lastSequenceNum = parseInt(lastSequenceStr, 10);
    if (!isNaN(lastSequenceNum)) {
      nextSequence = lastSequenceNum + 1;
    }
  }

  const franchiseNo = `${prefix}${nextSequence.toString().padStart(4, "0")}`;

  await db.franchise.create({
    data: {
      ...data,
      franchiseNo,
      status: "PENDING",
    },
  });
  revalidatePath("/franchises");
}

export async function updateFranchiseStatus(
  id: string,
  status: string,
  extraData?: { resolutionNo?: string; approvedOn?: Date; areaOfOperation?: string; expiresAt?: Date }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);
  
  let expiresAt = extraData?.expiresAt;

  if (status === "APPROVED" && extraData?.approvedOn) {
    const franchise = await db.franchise.findUnique({ where: { id } });
    if (franchise) {
      const yearsToAdd = franchise.isRenewal ? 3 : 6;
      expiresAt = new Date(extraData.approvedOn);
      expiresAt.setFullYear(expiresAt.getFullYear() + yearsToAdd);
    }
  }

  await db.franchise.update({
    where: { id },
    data: {
      status,
      ...extraData,
      expiresAt,
    },
  });
  revalidatePath("/franchises");
}

export async function getFranchises(status?: string) {
  return await prisma.franchise.findMany({
    where: status ? { status } : undefined,
    include: {
      tricycle: true,
    },
    orderBy: { ownerName: "asc" },
  });
}

export async function recordFranchisePayment(data: {
  franchiseId: string;
  amount: number;
  orNumber: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);

  await db.$transaction(async (tx) => {
    // 1. Create a FranchiseTransaction for the payment
    await tx.franchiseTransaction.create({
      data: {
        franchiseId: data.franchiseId,
        transactionType: "FRANCHISE_FEE",
        paymentStatus: "PAID",
        amount: data.amount,
        paymentDate: new Date(),
        orNumber: data.orNumber,
      },
    });

    // 2. Update Franchise status to ACTIVE
    await tx.franchise.update({
      where: { id: data.franchiseId },
      data: { status: "ACTIVE" },
    });
  });

  revalidatePath("/franchises");
}
