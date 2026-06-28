"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createItemAccount(data: {
  account_name: string;
  account_number: string;
  default_amount: number;
  fundtype: string;
}) {
  try {
    const newAccount = await prisma.itemAccounts.create({
      data: {
        account_name: data.account_name,
        account_number: data.account_number,
        default_amount: data.default_amount,
        fundtype: data.fundtype,
        isActive: true,
      },
    });

    revalidatePath("/financial");
    return { success: true, data: newAccount };
  } catch (error) {
    console.error("Failed to create ItemAccount:", error);
    return { success: false, error: "Failed to create Item Account. Account number might already exist." };
  }
}

export async function getItemAccounts() {
  try {
    return await prisma.itemAccounts.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Failed to fetch ItemAccounts:", error);
    return [];
  }
}
