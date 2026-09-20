"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import type { MTOPVehicleInput, VehicleUpdateInput } from "./types";

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
 * Safely revalidate routes if within an active request context
 */
function safeRevalidate() {
  try {
    revalidatePath("/vehicle");
    revalidatePath("/franchise");
  } catch {
    // Outside request context
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
        vehicleImage: data.vehicleImage || null,
        ltoCrDocument: data.ltoCrDocument || null,
        ltoOrDocument: data.ltoOrDocument || null,
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
 * Fetch all MTOP vehicles with operator and assigned franchise
 */
export async function getVehicles() {
  try {
    return await prisma.mTOPVehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        operator: {
          include: {
            newFranchise: true,
          },
        },
        newFranchise: true,
      },
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

/**
 * Fetch operators eligible for vehicle enrollment (operators without any enrolled vehicle)
 */
export async function getOperatorsWithoutVehicle() {
  try {
    return await prisma.operator.findMany({
      where: {
        vehicle: null,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        operatorId: true,
        address: true,
        mobileNo: true,
      },
    });
  } catch (error) {
    console.error("Error fetching operators without vehicle:", error);
    return [];
  }
}

/**
 * Update an existing vehicle's specifications
 */
export async function updateVehicle(id: string, data: VehicleUpdateInput) {
  try {
    const db = await getAuditDb();

    const existing = await prisma.mTOPVehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Vehicle not found." };
    }

    const plate = data.plateNumber ? data.plateNumber.trim().toUpperCase() : existing.plateNumber;
    const regNo = data.registrationNumber ? data.registrationNumber.trim().toUpperCase() : existing.registrationNumber;

    // Check unique conflicts if plate or registration changed
    if (plate !== existing.plateNumber || regNo !== existing.registrationNumber) {
      const conflict = await prisma.mTOPVehicle.findFirst({
        where: {
          id: { not: id },
          OR: [
            { plateNumber: plate },
            { registrationNumber: regNo },
          ],
        },
      });

      if (conflict) {
        if (conflict.plateNumber === plate) {
          return { success: false, error: `Vehicle with Plate '${plate}' already exists.` };
        }
        if (conflict.registrationNumber === regNo) {
          return { success: false, error: `Vehicle with Registration '${regNo}' already exists.` };
        }
      }
    }

    const updated = await db.mTOPVehicle.update({
      where: { id },
      data: {
        ...(data.registeredOwnerName && { registeredOwnerName: data.registeredOwnerName.trim() }),
        ...(data.registeredAddress && { registeredAddress: data.registeredAddress.trim() }),
        ...(data.make && { make: data.make.trim() }),
        ...(data.model && { model: data.model.trim() }),
        ...(data.year && { year: Number(data.year) }),
        ...(data.plateNumber && { plateNumber: plate }),
        ...(data.engineNumber && { engineNumber: data.engineNumber.trim().toUpperCase() }),
        ...(data.chassisNumber && { chassisNumber: data.chassisNumber.trim().toUpperCase() }),
        ...(data.color && { color: data.color.trim() }),
        ...(data.registrationNumber && { registrationNumber: regNo }),
        ...(data.vehicleImage !== undefined && { vehicleImage: data.vehicleImage }),
        ...(data.ltoCrDocument !== undefined && { ltoCrDocument: data.ltoCrDocument }),
        ...(data.ltoOrDocument !== undefined && { ltoOrDocument: data.ltoOrDocument }),
      },
      include: {
        operator: true,
        newFranchise: true,
      },
    });

    safeRevalidate();
    return { success: true, vehicle: updated };
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    return { success: false, error: error.message || "Failed to update vehicle." };
  }
}

/**
 * Safely delete an MTOP vehicle
 */
export async function deleteVehicle(id: string) {
  try {
    const db = await getAuditDb();

    const vehicle = await prisma.mTOPVehicle.findUnique({
      where: { id },
      include: {
        newFranchise: true,
        operator: {
          include: { newFranchise: true },
        },
      },
    });

    if (!vehicle) {
      return { success: false, error: "Vehicle not found." };
    }

    // Check if vehicle is actively assigned to a franchise
    if (vehicle.newFranchise) {
      return {
        success: false,
        error: `Cannot delete vehicle. It is actively linked to Franchise Body #${vehicle.newFranchise.franchiseBodyNumber}. Please unassign the franchise first.`,
      };
    }

    if (vehicle.operator?.newFranchise) {
      return {
        success: false,
        error: `Cannot delete vehicle. Its operator has Franchise Body #${vehicle.operator.newFranchise.franchiseBodyNumber} assigned. Please unassign the franchise first.`,
      };
    }

    await db.mTOPVehicle.delete({
      where: { id },
    });

    safeRevalidate();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting vehicle:", error);
    return { success: false, error: error.message || "Failed to delete vehicle." };
  }
}
