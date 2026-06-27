"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getBodyNumbers() {
  return await prisma.bodyNumber.findMany({
    include: {
      franchise: true,
    },
    orderBy: { bodyNumber: "asc" },
  });
}

export async function createBodyNumber(bodyNumber: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);

  try {
    await db.bodyNumber.create({
      data: {
        bodyNumber,
        franchiseId: null,
      },
    });
    revalidatePath("/body-numbers");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "This body number already exists." };
    }
    return { error: "Failed to add body number." };
  }
}

export async function deleteBodyNumber(bodyNumber: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);

  try {
    await db.bodyNumber.delete({
      where: { bodyNumber },
    });
    revalidatePath("/body-numbers");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete body number." };
  }
}

export async function generateBodyNumberRange(start: number, end: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = withAudit(session?.user?.id);

  if (start > end) {
    return { error: "Start number must be less than or equal to end number." };
  }

  // Cap the range to prevent excessive inserts in a single request
  if (end - start > 5000) {
    return { error: "Cannot generate more than 5000 body numbers at once." };
  }

  try {
    const data = [];
    for (let i = start; i <= end; i++) {
      data.push({ bodyNumber: i, franchiseId: null });
    }

    const result = await db.bodyNumber.createMany({
      data,
      skipDuplicates: true, // Will ignore if the body number already exists
    });

    revalidatePath("/body-numbers");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error generating body numbers:", error);
    return { error: "Failed to generate body numbers." };
  }
}
