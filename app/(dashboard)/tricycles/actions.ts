"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function verifyFranchiseForRegistration(franchiseNo: string) {
  const franchise = await prisma.franchise.findUnique({
    where: { franchiseNo },
    include: {
      tricycle: true,
    },
  });

  if (!franchise) {
    return { success: false, error: "Franchise not found." };
  }

  if (franchise.status !== "ACTIVE") {
    return { success: false, error: `Franchise is not active. Current status: ${franchise.status}` };
  }

  if (franchise.expiresAt && new Date(franchise.expiresAt) < new Date()) {
    return { success: false, error: "Franchise has expired." };
  }

  if (franchise.tricycle) {
    return { success: false, error: "This franchise already has a registered tricycle." };
  }

  return { success: true, franchise };
}

export async function getActiveDrivers() {
  return await prisma.driver.findMany({
    where: { status: "ACTIVE" },
    orderBy: { lastName: "asc" },
  });
}

export async function registerTricycle(data: {
  make: string;
  model: string;
  color: string;
  plateNo: string;
  chassisNo: string;
  motorNo: string;
  bodyNumber: string;
  franchiseId: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    await db.tricycle.create({
      data: {
        ...data,
        status: "ACTIVE",
      },
    });

    revalidatePath("/tricycles");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "A tricycle with this Plate Number, Chassis Number, or Motor Number already exists." };
    }
    return { success: false, error: error.message || "Failed to register tricycle." };
  }
}

export async function getTricycles() {
  return await prisma.tricycle.findMany({
    include: {
      franchise: true,
      mainDriver: true,
      extraDriver: true,
    },
    orderBy: {
      bodyNumber: "asc",
    },
  });
}

export async function assignDriversToTricycle(tricycleId: string, mainDriverId: string | null, extraDriverId: string | null) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    if (mainDriverId && extraDriverId && mainDriverId === extraDriverId) {
      return { success: false, error: "Main driver and Extra driver cannot be the same person." };
    }

    await db.tricycle.update({
      where: { id: tricycleId },
      data: {
        mainDriverId,
        extraDriverId,
      },
    });

    revalidatePath("/tricycles");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
