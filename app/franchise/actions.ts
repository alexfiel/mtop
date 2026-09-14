"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface CreateNewFranchiseInput {
  franchiseBodyNumber: number;
  zone?: string;
  isActive?: boolean;
  remarks?: string;
  operatorId?: string;
  mtopVehicleId?: string;
}

export interface UpdateNewFranchiseInput {
  franchiseBodyNumber?: number;
  zone?: string;
  isActive?: boolean;
  remarks?: string;
}

export interface MTOPVehicleInput {
  registeredOwnerName: string;
  registeredAddress: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  registrationNumber: string;
  operatorId?: string;
  userId?: string;
}

export interface AssignOperatorVehicleInput {
  franchiseId: string;
  operatorId: string;
  mtopVehicleId?: string;
  newVehicle?: MTOPVehicleInput;
  remarks?: string;
}

/**
 * Safely obtain an authenticated audit DB instance without crashing if headers() is called outside request context
 */
async function getAuditDb() {
  let userId: string | undefined = undefined;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    userId = session?.user?.id;
  } catch {
    // Outside request context (e.g. background tasks or direct scripts)
  }
  return withAudit(userId);
}

/**
 * Safely revalidate the route if within an active request context
 */
function safeRevalidate() {
  try {
    revalidatePath("/franchise");
  } catch {
    // Outside request context
  }
}

/**
 * Suggest next sequential franchise body number
 */
export async function getNextAvailableBodyNumber(): Promise<number> {
  const latestFranchise = await prisma.newFranchise.findFirst({
    orderBy: { franchiseBodyNumber: "desc" },
    select: { franchiseBodyNumber: true },
  });

  if (!latestFranchise) {
    return 1001; // Standard Tagbilaran MTOP start series
  }

  return latestFranchise.franchiseBodyNumber + 1;
}

export interface GenerateBodyNumberInput {
  startRange?: number; // e.g. 1
  endRange?: number;   // e.g. 3000
}

/**
 * Generate next available franchise body number based on input range (e.g. 1 to 3000)
 */
export async function generateBodyNumber(input?: GenerateBodyNumberInput): Promise<{
  success: boolean;
  bodyNumber?: number;
  error?: string;
  reason?: string;
}> {
  try {
    const start = Math.max(1, Math.floor(Number(input?.startRange) || 1));
    const end = Math.max(start, Math.floor(Number(input?.endRange) || 3000));

    // Fetch existing franchise body numbers in range
    const existing = await prisma.newFranchise.findMany({
      where: {
        franchiseBodyNumber: {
          gte: start,
          lte: end,
        },
      },
      select: { franchiseBodyNumber: true },
    });
    const taken = new Set(existing.map((f) => f.franchiseBodyNumber));

    // Find the first available number in the range [start, end]
    let candidate: number | null = null;
    for (let i = start; i <= end; i++) {
      if (!taken.has(i)) {
        candidate = i;
        break;
      }
    }

    if (candidate === null) {
      return {
        success: false,
        error: `All body numbers in range ${start} to ${end} are already taken.`,
      };
    }

    return {
      success: true,
      bodyNumber: candidate,
      reason: `Found next available Body #${candidate} in range ${start} to ${end}.`,
    };
  } catch (error: any) {
    console.error("Error generating body number in range:", error);
    return {
      success: false,
      error: "Failed to generate body number from range.",
    };
  }
}

/**
 * Batch generate available body numbers in range (e.g. 1 to 3000) into unassigned pool
 */
export async function batchGenerateFranchiseRange(
  startRange: number,
  endRange: number,
  zone: string = "Tagbilaran City"
) {
  try {
    const start = Math.max(1, Math.floor(Number(startRange) || 1));
    const end = Math.max(start, Math.floor(Number(endRange) || 3000));

    if (start > end) {
      return { success: false, error: "Start range must be less than or equal to end range." };
    }

    if (end - start > 5000) {
      return { success: false, error: "Cannot generate more than 5,000 body numbers at once." };
    }

    const db = await getAuditDb();

    // Find existing numbers in range
    const existing = await prisma.newFranchise.findMany({
      where: {
        franchiseBodyNumber: {
          gte: start,
          lte: end,
        },
      },
      select: { franchiseBodyNumber: true },
    });
    const taken = new Set(existing.map((f) => f.franchiseBodyNumber));

    const records = [];
    for (let i = start; i <= end; i++) {
      if (!taken.has(i)) {
        records.push({
          franchiseBodyNumber: i,
          zone: zone.trim() || "Tagbilaran City",
          isActive: false,
          isAssigned: false,
        });
      }
    }

    if (records.length === 0) {
      return {
        success: false,
        error: `All body numbers in range ${start} to ${end} already exist in the database.`,
      };
    }

    const result = await db.newFranchise.createMany({
      data: records,
      skipDuplicates: true,
    });

    safeRevalidate();
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Error batch generating body numbers:", error);
    return { success: false, error: error.message || "Failed to batch generate body numbers." };
  }
}

/**
 * Fetch all NewFranchise records with operator and vehicle details
 */
export async function getNewFranchises() {
  try {
    return await prisma.newFranchise.findMany({
      orderBy: { franchiseBodyNumber: "asc" },
      include: {
        operator: {
          select: {
            id: true,
            operatorId: true,
            name: true,
            email: true,
            mobileNo: true,
            profilePicture: true,
            address: true,
            status: true,
          },
        },
        mtopVehicle: {
          select: {
            id: true,
            plateNumber: true,
            make: true,
            model: true,
            year: true,
            color: true,
            engineNumber: true,
            chassisNumber: true,
            registrationNumber: true,
            registeredOwnerName: true,
            registeredAddress: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching franchises:", error);
    return [];
  }
}

/**
 * Fetch operators available for assignment (operators with no active franchise attached)
 */
export async function getAvailableOperators() {
  try {
    return await prisma.operator.findMany({
      where: {
        newFranchise: null,
      },
      include: {
        vehicle: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching available operators:", error);
    return [];
  }
}

/**
 * Fetch operators who do not currently have an enrolled MTOPVehicle
 */
export async function getOperatorsWithoutVehicle() {
  try {
    return await prisma.operator.findMany({
      where: {
        vehicle: null,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching operators without vehicle:", error);
    return [];
  }
}

/**
 * Fetch vehicles available for assignment (vehicles with no franchise attached)
 */
export async function getAvailableVehicles() {
  try {
    return await prisma.mTOPVehicle.findMany({
      where: {
        newFranchise: null,
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            operatorId: true,
          },
        },
      },
      orderBy: { plateNumber: "asc" },
    });
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    return [];
  }
}

/**
 * Create a new Franchise Body Number
 */
export async function createNewFranchise(data: CreateNewFranchiseInput) {
  try {
    const db = await getAuditDb();

    // Validate body number
    const bodyNum = Number(data.franchiseBodyNumber);
    if (!bodyNum || isNaN(bodyNum) || bodyNum <= 0) {
      return { success: false, error: "Please provide a valid numeric Body Number." };
    }

    // Check duplicate body number
    const existing = await prisma.newFranchise.findUnique({
      where: { franchiseBodyNumber: bodyNum },
    });

    if (existing) {
      return {
        success: false,
        error: `Franchise Body Number #${bodyNum} already exists in the system.`,
      };
    }

    const isDirectAssigned = Boolean(data.operatorId);

    const franchise = await db.newFranchise.create({
      data: {
        franchiseBodyNumber: bodyNum,
        zone: data.zone?.trim() || "Tagbilaran City",
        isActive: data.isActive ?? false,
        remarks: data.remarks?.trim() || null,
        isAssigned: isDirectAssigned,
        assignedDate: isDirectAssigned ? new Date() : null,
        operatorId: data.operatorId || null,
        mtopVehicleId: data.mtopVehicleId || null,
      },
      include: {
        operator: true,
        mtopVehicle: true,
      },
    });

    safeRevalidate();
    return { success: true, franchise };
  } catch (error: any) {
    console.error("Error creating franchise:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A franchise with this body number or operator already exists." };
    }
    return { success: false, error: error.message || "Failed to create franchise." };
  }
}

/**
 * Update franchise details (body number, zone, active status, remarks)
 */
export async function updateNewFranchise(id: string, data: UpdateNewFranchiseInput) {
  try {
    const db = await getAuditDb();

    // If body number changed, check uniqueness
    if (data.franchiseBodyNumber !== undefined) {
      const bodyNum = Number(data.franchiseBodyNumber);
      if (isNaN(bodyNum) || bodyNum <= 0) {
        return { success: false, error: "Body Number must be a positive integer." };
      }

      const duplicate = await prisma.newFranchise.findFirst({
        where: {
          franchiseBodyNumber: bodyNum,
          NOT: { id },
        },
      });

      if (duplicate) {
        return { success: false, error: `Franchise Body Number #${bodyNum} is already taken.` };
      }
    }

    const updated = await db.newFranchise.update({
      where: { id },
      data: {
        ...(data.franchiseBodyNumber ? { franchiseBodyNumber: Number(data.franchiseBodyNumber) } : {}),
        ...(data.zone !== undefined ? { zone: data.zone.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.remarks !== undefined ? { remarks: data.remarks?.trim() || null } : {}),
      },
      include: {
        operator: true,
        mtopVehicle: true,
      },
    });

    safeRevalidate();
    return { success: true, franchise: updated };
  } catch (error: any) {
    console.error("Error updating franchise:", error);
    return { success: false, error: error.message || "Failed to update franchise." };
  }
}

/**
 * Enroll a new vehicle using Prisma model MTOPVehicle
 */
export async function enrollMTOPVehicle(data: MTOPVehicleInput) {
  try {
    const db = await getAuditDb();

    if (!data.operatorId) {
      return { success: false, error: "Operator ID is required to enroll an MTOP Vehicle." };
    }
    if (!data.plateNumber?.trim()) {
      return { success: false, error: "Plate Number is required." };
    }
    if (!data.registrationNumber?.trim()) {
      return { success: false, error: "Registration / CR Number is required." };
    }
    if (!data.registeredOwnerName?.trim() || !data.registeredAddress?.trim()) {
      return { success: false, error: "Registered Owner Name and Address are required." };
    }
    if (!data.make?.trim() || !data.model?.trim()) {
      return { success: false, error: "Vehicle Make and Model are required." };
    }
    if (!data.color?.trim()) {
      return { success: false, error: "Color scheme is required." };
    }
    if (!data.engineNumber?.trim() || !data.chassisNumber?.trim()) {
      return { success: false, error: "Engine Number and Chassis Number are required." };
    }

    const plate = data.plateNumber.trim().toUpperCase();
    const regNo = data.registrationNumber.trim().toUpperCase();

    // Check unique constraints
    const existing = await prisma.mTOPVehicle.findFirst({
      where: {
        OR: [
          { plateNumber: plate },
          { registrationNumber: regNo },
          { operatorId: data.operatorId },
        ],
      },
    });

    if (existing) {
      if (existing.plateNumber === plate) {
        return { success: false, error: `Vehicle with Plate '${plate}' already exists.` };
      }
      if (existing.registrationNumber === regNo) {
        return { success: false, error: `Vehicle with Registration '${regNo}' already exists.` };
      }
      if (existing.operatorId === data.operatorId) {
        return { success: false, error: "This operator already has an enrolled vehicle." };
      }
    }

    const vehicle = await db.mTOPVehicle.create({
      data: {
        registeredOwnerName: data.registeredOwnerName.trim(),
        registeredAddress: data.registeredAddress.trim(),
        make: data.make.trim(),
        model: data.model.trim(),
        year: Number(data.year) || new Date().getFullYear(),
        plateNumber: plate,
        engineNumber: data.engineNumber.trim().toUpperCase(),
        chassisNumber: data.chassisNumber.trim().toUpperCase(),
        color: data.color.trim(),
        registrationNumber: regNo,
        operatorId: data.operatorId,
      },
      include: {
        operator: true,
      },
    });

    safeRevalidate();
    return { success: true, vehicle };
  } catch (error: any) {
    console.error("Error enrolling MTOPVehicle:", error);
    return { success: false, error: error.message || "Failed to enroll MTOP vehicle." };
  }
}

/**
 * Assign Operator and Vehicle to an unassigned NewFranchise
 */
export async function assignOperatorAndVehicle(input: AssignOperatorVehicleInput) {
  try {
    const db = await getAuditDb();

    // Verify franchise exists and is eligible
    const franchise = await prisma.newFranchise.findUnique({
      where: { id: input.franchiseId },
      include: { operator: true },
    });

    if (!franchise) {
      return { success: false, error: "Franchise not found." };
    }

    // Verify operator
    const operator = await prisma.operator.findUnique({
      where: { id: input.operatorId },
      include: { newFranchise: true, vehicle: true },
    });

    if (!operator) {
      return { success: false, error: "Operator not found." };
    }

    if (operator.newFranchise && operator.newFranchise.id !== franchise.id) {
      return {
        success: false,
        error: `Operator '${operator.name}' already has Franchise Body #${operator.newFranchise.franchiseBodyNumber} assigned.`,
      };
    }

    let resolvedVehicleId: string | null = null;

    // Handle vehicle selection / creation
    if (input.newVehicle) {
      // Create new vehicle for this operator using Prisma model MTOPVehicle
      const { plateNumber, registrationNumber } = input.newVehicle;

      const plate = plateNumber.trim().toUpperCase();
      const regNo = registrationNumber.trim().toUpperCase();

      // Check duplicate plate or registration
      const existingVehicle = await prisma.mTOPVehicle.findFirst({
        where: {
          OR: [
            { plateNumber: plate },
            { registrationNumber: regNo },
          ],
        },
      });

      if (existingVehicle) {
        return {
          success: false,
          error: `A vehicle with plate '${plate}' or registration '${regNo}' already exists.`,
        };
      }

      // If operator already had a vehicle, check if it's already there
      if (operator.vehicle) {
        resolvedVehicleId = operator.vehicle.id;
      } else {
        const createdVehicle = await db.mTOPVehicle.create({
          data: {
            registeredOwnerName: input.newVehicle.registeredOwnerName?.trim() || operator.name,
            registeredAddress: input.newVehicle.registeredAddress?.trim() || operator.address,
            make: input.newVehicle.make.trim(),
            model: input.newVehicle.model.trim(),
            year: Number(input.newVehicle.year) || new Date().getFullYear(),
            plateNumber: plateNumber.trim().toUpperCase(),
            engineNumber: input.newVehicle.engineNumber.trim().toUpperCase(),
            chassisNumber: input.newVehicle.chassisNumber.trim().toUpperCase(),
            color: input.newVehicle.color.trim(),
            registrationNumber: registrationNumber.trim().toUpperCase(),
            operatorId: operator.id,
          },
        });
        resolvedVehicleId = createdVehicle.id;
      }
    } else if (input.mtopVehicleId) {
      resolvedVehicleId = input.mtopVehicleId;
    } else if (operator.vehicle) {
      resolvedVehicleId = operator.vehicle.id;
    }

    // Prepare audit remarks
    const assignLog = `Assigned to Operator ${operator.name} (${operator.operatorId}) on ${new Date().toLocaleDateString()}`;
    const updatedRemarks = input.remarks
      ? `${input.remarks} | ${assignLog}`
      : franchise.remarks
      ? `${franchise.remarks} | ${assignLog}`
      : assignLog;

    // Update franchise to assigned state
    const updatedFranchise = await db.newFranchise.update({
      where: { id: franchise.id },
      data: {
        operatorId: operator.id,
        mtopVehicleId: resolvedVehicleId,
        isAssigned: true,
        assignedDate: new Date(),
        isActive: true, // Automatically activate on assignment
        remarks: updatedRemarks,
      },
      include: {
        operator: true,
        mtopVehicle: true,
      },
    });

    safeRevalidate();
    return { success: true, franchise: updatedFranchise };
  } catch (error: any) {
    console.error("Error assigning franchise:", error);
    return { success: false, error: error.message || "Failed to assign operator and vehicle." };
  }
}

/**
 * Unassign Operator and Vehicle from a franchise (releasing back to unassigned pool)
 */
export async function unassignFranchise(franchiseId: string, reason?: string) {
  try {
    const db = await getAuditDb();

    const franchise = await prisma.newFranchise.findUnique({
      where: { id: franchiseId },
      include: { operator: true },
    });

    if (!franchise) {
      return { success: false, error: "Franchise not found." };
    }

    const unassignLog = `Unassigned on ${new Date().toLocaleDateString()}${
      reason ? `: ${reason.trim()}` : ""
    }`;
    const newRemarks = franchise.remarks
      ? `${franchise.remarks} | ${unassignLog}`
      : unassignLog;

    const updated = await db.newFranchise.update({
      where: { id: franchiseId },
      data: {
        operatorId: null,
        mtopVehicleId: null,
        isAssigned: false,
        assignedDate: null,
        isActive: false, // Deactivate upon unassigning
        remarks: newRemarks,
      },
      include: {
        operator: true,
        mtopVehicle: true,
      },
    });

    safeRevalidate();
    return { success: true, franchise: updated };
  } catch (error: any) {
    console.error("Error unassigning franchise:", error);
    return { success: false, error: error.message || "Failed to unassign franchise." };
  }
}

/**
 * Delete a NewFranchise record
 */
export async function deleteNewFranchise(franchiseId: string) {
  try {
    const db = await getAuditDb();

    const franchise = await prisma.newFranchise.findUnique({
      where: { id: franchiseId },
      include: { applications: true, tasks: true },
    });

    if (!franchise) {
      return { success: false, error: "Franchise not found." };
    }

    if (franchise.applications.length > 0) {
      return {
        success: false,
        error: `Cannot delete Body #${franchise.franchiseBodyNumber} because it is linked to ${franchise.applications.length} official franchise application record(s).`,
      };
    }

    await db.newFranchise.delete({
      where: { id: franchiseId },
    });

    safeRevalidate();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting franchise:", error);
    return { success: false, error: error.message || "Failed to delete franchise." };
  }
}

/**
 * Toggle franchise active status
 */
export async function toggleFranchiseStatus(franchiseId: string) {
  try {
    const db = await getAuditDb();

    const franchise = await prisma.newFranchise.findUnique({
      where: { id: franchiseId },
    });

    if (!franchise) {
      return { success: false, error: "Franchise not found." };
    }

    const updated = await db.newFranchise.update({
      where: { id: franchiseId },
      data: {
        isActive: !franchise.isActive,
      },
      include: {
        operator: true,
        mtopVehicle: true,
      },
    });

    safeRevalidate();
    return { success: true, franchise: updated };
  } catch (error: any) {
    console.error("Error toggling franchise status:", error);
    return { success: false, error: error.message || "Failed to toggle status." };
  }
}
