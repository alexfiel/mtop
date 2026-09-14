"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface RegisterOperatorInput {
  operatorId?: string;
  name: string;
  address: string;
  email: string;
  mobileNo: string;
  dateOfBirth: string | Date;
  validIDType: string;
  validIDNumber: string;
  validIDExpiryDate: string | Date;
  profilePicture?: string;
  validIdFront?: string;
  validIdBack?: string;
}

export async function getNextOperatorId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OP-154-${year}-`;

  const existingOperators = await prisma.operator.findMany({
    where: {
      operatorId: {
        startsWith: prefix,
      },
    },
    select: {
      operatorId: true,
    },
  });

  let maxSequence = 0;
  for (const op of existingOperators) {
    const seqPart = op.operatorId.replace(prefix, "");
    const seqNum = parseInt(seqPart, 10);
    if (!isNaN(seqNum) && seqNum > maxSequence) {
      maxSequence = seqNum;
    }
  }

  const nextSequence = maxSequence + 1;
  return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
}

export async function registerOperator(data: RegisterOperatorInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const db = withAudit(session?.user?.id);

    // Auto-generate operatorId if not supplied (format: OP-154-CURRENTYEAR-0000 incremental)
    let operatorId = data.operatorId?.trim();
    if (!operatorId) {
      operatorId = await getNextOperatorId();
    }

    // Check for existing records to return friendly messages
    const existingChecks = await prisma.operator.findFirst({
      where: {
        OR: [
          { operatorId },
          { email: data.email.trim().toLowerCase() },
          { mobileNo: data.mobileNo.trim() },
          { validIDNumber: data.validIDNumber.trim() },
          { name: data.name.trim() },
        ],
      },
      select: {
        operatorId: true,
        email: true,
        mobileNo: true,
        validIDNumber: true,
        name: true,
      },
    });

    if (existingChecks) {
      if (existingChecks.operatorId === operatorId) {
        return { success: false, error: `Operator ID '${operatorId}' is already registered.` };
      }
      if (existingChecks.email.toLowerCase() === data.email.trim().toLowerCase()) {
        return { success: false, error: `An operator with email '${data.email}' already exists.` };
      }
      if (existingChecks.mobileNo === data.mobileNo.trim()) {
        return { success: false, error: `An operator with mobile number '${data.mobileNo}' already exists.` };
      }
      if (existingChecks.validIDNumber.toLowerCase() === data.validIDNumber.trim().toLowerCase()) {
        return { success: false, error: `An operator with ID Number '${data.validIDNumber}' is already registered.` };
      }
      if (existingChecks.name.toLowerCase() === data.name.trim().toLowerCase()) {
        return { success: false, error: `An operator with the name '${data.name}' is already registered.` };
      }
    }

    const encodedBy = session?.user?.name || session?.user?.email || "System Licensing Officer";

    const operator = await db.operator.create({
      data: {
        operatorId,
        name: data.name.trim(),
        address: data.address.trim(),
        email: data.email.trim().toLowerCase(),
        mobileNo: data.mobileNo.trim(),
        dateOfBirth: new Date(data.dateOfBirth),
        validIDType: data.validIDType,
        validIDNumber: data.validIDNumber.trim(),
        validIDExpiryDate: new Date(data.validIDExpiryDate),
        profilePicture: data.profilePicture || null,
        validIdFront: data.validIdFront || null,
        validIdBack: data.validIdBack || null,
        encodedBy,
        status: "PENDING",
        isVerified: false,
      },
    });

    revalidatePath("/operator");
    return { success: true, operator };
  } catch (error: any) {
    console.error("Error creating operator:", error);
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      return {
        success: false,
        error: `A unique constraint violation occurred on: ${target}.`,
      };
    }
    return {
      success: false,
      error: error.message || "Failed to register operator. Please check inputs and try again.",
    };
  }
}

export async function getOperators() {
  return await prisma.operator.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      newFranchise: {
        include: {
          mtopVehicle: true,
        },
      },
      vehicle: true,
    },
  });
}

export async function getOperatorById(id: string) {
  return await prisma.operator.findUnique({
    where: { id },
    include: {
      newFranchise: {
        include: {
          mtopVehicle: true,
        },
      },
      vehicle: true,
    },
  });
}
