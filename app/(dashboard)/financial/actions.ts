"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function checkAdminAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { authorized: false, isSuperAdmin: false, session: null };
  
  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    include: { role: true }
  });
  
  const isSuperAdmin = userRoles.some(ur => ur.role.name === "SUPERADMIN");
  const isAdmin = userRoles.some(ur => ur.role.name === "ADMIN");
  
  return { authorized: isAdmin || isSuperAdmin, isSuperAdmin, session };
}

export async function createItemAccount(data: {
  account_name: string;
  account_number: string;
  default_amount: number;
  fundtype: string;
}) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized. Admin access required." };

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

export async function updateItemAccount(id: string, data: {
  account_name: string;
  account_number: string;
  default_amount: number;
  fundtype: string;
  isActive: boolean;
}) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized. Admin access required." };

    const updatedAccount = await prisma.itemAccounts.update({
      where: { id },
      data: {
        account_name: data.account_name,
        account_number: data.account_number,
        default_amount: data.default_amount,
        fundtype: data.fundtype,
        isActive: data.isActive,
      },
    });

    revalidatePath("/financial");
    return { success: true, data: updatedAccount };
  } catch (error) {
    console.error("Failed to update ItemAccount:", error);
    return { success: false, error: "Failed to update Item Account." };
  }
}

export async function deleteItemAccount(id: string) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized. Admin access required." };

    await prisma.itemAccounts.delete({
      where: { id },
    });

    revalidatePath("/financial");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ItemAccount:", error);
    return { success: false, error: "Failed to delete Item Account. It might be used in existing transactions." };
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
