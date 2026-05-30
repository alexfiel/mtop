"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFeeRules() {
  return await prisma.feeRule.findMany({
    orderBy: [
      { applicationType: "asc" },
      { description: "asc" }
    ],
  });
}

export async function createFeeRule(data: { applicationType: string; description: string; amount: number; isActive: boolean }) {
  try {
    await prisma.feeRule.create({ data });
    revalidatePath("/settings/fees");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create fee rule." };
  }
}

export async function updateFeeRule(id: string, data: { applicationType: string; description: string; amount: number; isActive: boolean }) {
  try {
    await prisma.feeRule.update({ where: { id }, data });
    revalidatePath("/settings/fees");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update fee rule." };
  }
}

export async function deleteFeeRule(id: string) {
  try {
    await prisma.feeRule.delete({ where: { id } });
    revalidatePath("/settings/fees");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete fee rule." };
  }
}
