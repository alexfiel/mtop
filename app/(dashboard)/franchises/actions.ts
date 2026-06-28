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
  tricycle: {
    make: string;
    model: string;
    color: string;
    plateNo: string;
    chassisNo: string;
    motorNo: string;
    bodyNumber: string;
  };
}) {
  try {
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

    await db.$transaction(async (tx) => {
      const franchise = await tx.franchise.create({
        data: {
          ownerName: data.ownerName,
          address: data.address,
          contactNo: data.contactNo,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          isRenewal: data.isRenewal,
          franchiseNo,
          status: "PENDING",
        },
      });

      await tx.tricycle.create({
        data: {
          make: data.tricycle.make,
          model: data.tricycle.model,
          color: data.tricycle.color,
          plateNo: data.tricycle.plateNo,
          chassisNo: data.tricycle.chassisNo,
          motorNo: data.tricycle.motorNo,
          bodyNumber: data.tricycle.bodyNumber,
          franchiseId: franchise.id,
        },
      });

      const bodyNumInt = parseInt(data.tricycle.bodyNumber, 10);
      if (!isNaN(bodyNumInt)) {
        await tx.bodyNumber.update({
          where: { bodyNumber: bodyNumInt },
          data: { franchiseId: franchise.id },
        });
      }
    });

    revalidatePath("/franchises");
    revalidatePath("/body-numbers");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating franchise application:", error);
    if (error?.code === "P2002") {
      const target = error.meta?.target as string[];
      if (target?.includes("email")) {
        return { error: "This email address is already in use.", field: "email" };
      }
      return { error: "A franchise with this unique information already exists." };
    }
    return { error: "Failed to submit application. Please try again." };
  }
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
      const yearsToAdd = 3; // Both New and Renewal expire in 3 years
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

export async function getUnassignedBodyNumbers() {
  return await prisma.bodyNumber.findMany({
    where: { franchiseId: null },
    orderBy: { bodyNumber: "asc" },
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

    // 2. Update Franchise status to FOR_SP_APPROVAL
    await tx.franchise.update({
      where: { id: data.franchiseId },
      data: { status: "FOR_SP_APPROVAL" },
    });
  });

  revalidatePath("/franchises");
}

export async function searchFranchiseForRenewal(franchiseNo: string) {
  const franchise = await prisma.franchise.findUnique({
    where: { franchiseNo },
    include: { tricycle: true }
  });
  return franchise;
}

export async function processFranchiseRenewal(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);

  const franchise = await db.franchise.update({
    where: { id },
    data: {
      status: "FOR_BILLING",
      isRenewal: true,
    }
  });

  revalidatePath("/franchises");
  return franchise;
}
