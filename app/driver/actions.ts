"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import type {
  DriverRegistrationInput,
  DriverUpdateInput,
  DriverAttachInput,
  AssignedDriverSlotInfo,
} from "./types";

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
    // Outside request context
  }
  return withAudit(userId);
}

/**
 * Safely revalidate routes
 */
function safeRevalidate() {
  try {
    revalidatePath("/driver");
    revalidatePath("/vehicle");
    revalidatePath("/franchise");
    revalidatePath("/operator");
  } catch {
    // Outside request context
  }
}

/**
 * Generate next formatted Driver ID: DRV-YYYY-XXXX
 */
export async function getNextDriverId() {
  const currentYear = new Date().getFullYear();
  const prefix = `DRV-${currentYear}-`;

  const latestDriver = await prisma.driver.findFirst({
    where: {
      driverId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      driverId: "desc",
    },
    select: {
      driverId: true,
    },
  });

  if (!latestDriver || !latestDriver.driverId) {
    return `${prefix}0001`;
  }

  const parts = latestDriver.driverId.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

/**
 * Get list of drivers with operator, franchise, and attachment history
 */
export async function getDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        operator: {
          select: {
            id: true,
            operatorId: true,
            name: true,
            mobileNo: true,
            address: true,
          },
        },
        newFranchise: {
          select: {
            id: true,
            franchiseBodyNumber: true,
            zone: true,
            mtopVehicle: {
              select: {
                id: true,
                plateNumber: true,
                make: true,
                model: true,
              },
            },
          },
        },
        attachmentHistory: {
          orderBy: {
            attachedAt: "desc",
          },
          take: 5,
          include: {
            operator: { select: { name: true } },
            newFranchise: { select: { franchiseBodyNumber: true } },
          },
        },
      },
    });

    const formattedDrivers = drivers.map((d) => ({
      ...d,
      attachmentHistory: d.attachmentHistory.map((h) => ({
        id: h.id,
        driverId: h.driverId,
        operatorId: h.operatorId,
        operatorName: h.operator?.name || null,
        newFranchiseId: h.newFranchiseId,
        franchiseBodyNumber: h.newFranchise?.franchiseBodyNumber || null,
        driverRole: h.driverRole,
        action: h.action,
        attachedAt: h.attachedAt,
        detachedAt: h.detachedAt,
        remarks: h.remarks,
      })),
    }));

    return { success: true, drivers: formattedDrivers };
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    return { success: false, error: error.message || "Failed to load drivers", drivers: [] };
  }
}

/**
 * Get a single driver by ID with full relations & history
 */
export async function getDriverById(id: string) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            operatorId: true,
            name: true,
            mobileNo: true,
            address: true,
          },
        },
        newFranchise: {
          select: {
            id: true,
            franchiseBodyNumber: true,
            zone: true,
            mtopVehicle: {
              select: {
                id: true,
                plateNumber: true,
                make: true,
                model: true,
              },
            },
          },
        },
        attachmentHistory: {
          orderBy: {
            attachedAt: "desc",
          },
          include: {
            operator: { select: { name: true } },
            newFranchise: { select: { franchiseBodyNumber: true } },
          },
        },
      },
    });

    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const formattedDriver = {
      ...driver,
      attachmentHistory: driver.attachmentHistory.map((h) => ({
        id: h.id,
        driverId: h.driverId,
        operatorId: h.operatorId,
        operatorName: h.operator?.name || null,
        newFranchiseId: h.newFranchiseId,
        franchiseBodyNumber: h.newFranchise?.franchiseBodyNumber || null,
        driverRole: h.driverRole,
        action: h.action,
        attachedAt: h.attachedAt,
        detachedAt: h.detachedAt,
        remarks: h.remarks,
      })),
    };

    return { success: true, driver: formattedDriver };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load driver details" };
  }
}

/**
 * Get available Operators and Franchises with Primary & Secondary slot occupancy
 */
export async function getAvailableOperatorsAndFranchises() {
  try {
    const [operators, franchises] = await Promise.all([
      prisma.operator.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          operatorId: true,
          name: true,
          mobileNo: true,
          address: true,
          newFranchise: {
            select: {
              id: true,
              franchiseBodyNumber: true,
            },
          },
          drivers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              driverId: true,
              licenseNo: true,
              driverRole: true,
            },
          },
        },
      }),
      prisma.newFranchise.findMany({
        orderBy: { franchiseBodyNumber: "asc" },
        select: {
          id: true,
          franchiseBodyNumber: true,
          operatorId: true,
          zone: true,
          operator: {
            select: {
              name: true,
            },
          },
          mtopVehicle: {
            select: {
              plateNumber: true,
            },
          },
          drivers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              driverId: true,
              licenseNo: true,
              driverRole: true,
            },
          },
        },
      }),
    ]);

    const formattedOperators = operators.map((op) => {
      let primaryDriver: AssignedDriverSlotInfo | null = null;
      let secondaryDriver: AssignedDriverSlotInfo | null = null;

      op.drivers.forEach((d) => {
        const slotInfo: AssignedDriverSlotInfo = {
          id: d.id,
          name: `${d.firstName} ${d.lastName}`,
          driverId: d.driverId,
          licenseNo: d.licenseNo,
          driverRole: (d.driverRole as "PRIMARY" | "SECONDARY") || "PRIMARY",
        };
        if (d.driverRole === "PRIMARY" && !primaryDriver) {
          primaryDriver = slotInfo;
        } else if (d.driverRole === "SECONDARY" && !secondaryDriver) {
          secondaryDriver = slotInfo;
        } else if (!primaryDriver) {
          primaryDriver = slotInfo;
        } else if (!secondaryDriver) {
          secondaryDriver = slotInfo;
        }
      });

      const driverCount = (primaryDriver ? 1 : 0) + (secondaryDriver ? 1 : 0);

      return {
        id: op.id,
        operatorId: op.operatorId,
        name: op.name,
        mobileNo: op.mobileNo,
        address: op.address,
        newFranchise: op.newFranchise,
        primaryDriver,
        secondaryDriver,
        driverCount,
        isFull: driverCount >= 2,
      };
    });

    const formattedFranchises = franchises.map((f) => {
      let primaryDriver: AssignedDriverSlotInfo | null = null;
      let secondaryDriver: AssignedDriverSlotInfo | null = null;

      f.drivers.forEach((d) => {
        const slotInfo: AssignedDriverSlotInfo = {
          id: d.id,
          name: `${d.firstName} ${d.lastName}`,
          driverId: d.driverId,
          licenseNo: d.licenseNo,
          driverRole: (d.driverRole as "PRIMARY" | "SECONDARY") || "PRIMARY",
        };
        if (d.driverRole === "PRIMARY" && !primaryDriver) {
          primaryDriver = slotInfo;
        } else if (d.driverRole === "SECONDARY" && !secondaryDriver) {
          secondaryDriver = slotInfo;
        } else if (!primaryDriver) {
          primaryDriver = slotInfo;
        } else if (!secondaryDriver) {
          secondaryDriver = slotInfo;
        }
      });

      const driverCount = (primaryDriver ? 1 : 0) + (secondaryDriver ? 1 : 0);

      return {
        id: f.id,
        franchiseBodyNumber: f.franchiseBodyNumber,
        operatorId: f.operatorId,
        operatorName: f.operator?.name || null,
        zone: f.zone,
        vehiclePlate: f.mtopVehicle?.plateNumber || null,
        primaryDriver,
        secondaryDriver,
        driverCount,
        isFull: driverCount >= 2,
      };
    });

    return {
      success: true,
      operators: formattedOperators,
      franchises: formattedFranchises,
    };
  } catch (error: any) {
    console.error("Error loading operators and franchises:", error);
    return {
      success: false,
      error: error.message || "Failed to load options",
      operators: [],
      franchises: [],
    };
  }
}

/**
 * Register a new Driver with optional Primary/Secondary attachment
 */
export async function registerDriver(data: DriverRegistrationInput) {
  try {
    const db = await getAuditDb();

    if (!data.firstName?.trim() || !data.lastName?.trim()) {
      return { success: false, error: "First name and Last name are required." };
    }
    if (!data.licenseNo?.trim()) {
      return { success: false, error: "Driver's License Number is required." };
    }
    if (!data.address?.trim()) {
      return { success: false, error: "Residential address is required." };
    }
    if (!data.contactNo?.trim()) {
      return { success: false, error: "Contact mobile number is required." };
    }
    if (!data.dateOfBirth) {
      return { success: false, error: "Date of Birth is required." };
    }

    const licenseNo = data.licenseNo.trim().toUpperCase();

    // Check unique license number
    const existingLicense = await prisma.driver.findUnique({
      where: { licenseNo },
    });
    if (existingLicense) {
      return {
        success: false,
        error: `A driver with license number '${licenseNo}' is already registered.`,
      };
    }

    // Check email uniqueness if provided
    let trimmedEmail: string | null = null;
    if (data.email && data.email.trim()) {
      trimmedEmail = data.email.trim().toLowerCase();
      const existingEmail = await prisma.driver.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingEmail) {
        return {
          success: false,
          error: `Email address '${trimmedEmail}' is already registered to another driver.`,
        };
      }
    }

    // Check slot availability if attaching
    const chosenRole = data.driverRole || "PRIMARY";
    if (data.newFranchiseId) {
      const existingInSlot = await prisma.driver.findFirst({
        where: {
          newFranchiseId: data.newFranchiseId,
          driverRole: chosenRole,
        },
      });
      if (existingInSlot) {
        return {
          success: false,
          error: `Franchise already has an active ${chosenRole} driver (${existingInSlot.firstName} ${existingInSlot.lastName}). Please select the other role or attach after registration.`,
        };
      }
    }

    // Generate or use assigned driverId
    const driverId = data.driverId?.trim() || (await getNextDriverId());

    const birthDate = new Date(data.dateOfBirth);
    const expiryDate = data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null;
    const isAttached = Boolean(data.operatorId || data.newFranchiseId);

    const newDriver = await db.driver.create({
      data: {
        driverId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        middleName: data.middleName?.trim() || null,
        licenseNo,
        licenseExpiryDate: expiryDate,
        address: data.address.trim(),
        contactNo: data.contactNo.trim(),
        email: trimmedEmail,
        dateOfBirth: birthDate,
        status: data.status || "ACTIVE",
        profilePicture: data.profilePicture || null,
        licenseFrontImage: data.licenseFrontImage || null,
        licenseBackImage: data.licenseBackImage || null,
        operatorId: data.operatorId || null,
        newFranchiseId: data.newFranchiseId || null,
        driverRole: isAttached ? chosenRole : null,
        assignedAt: isAttached ? new Date() : null,
      },
    });

    // Record attachment history if attached on creation
    if (isAttached) {
      await prisma.driverAttachmentHistory.create({
        data: {
          driverId: newDriver.id,
          operatorId: data.operatorId || null,
          newFranchiseId: data.newFranchiseId || null,
          driverRole: chosenRole,
          action: "ATTACHED",
          remarks: `Initial registration assignment as ${chosenRole} driver`,
        },
      });
    }

    safeRevalidate();

    return {
      success: true,
      driver: newDriver,
      message: `Driver ${newDriver.firstName} ${newDriver.lastName} (${newDriver.driverId}) registered successfully!`,
    };
  } catch (error: any) {
    console.error("Error registering driver:", error);
    return {
      success: false,
      error: error.message || "Failed to register driver. Please verify input data.",
    };
  }
}

/**
 * Update an existing driver
 */
export async function updateDriver(id: string, data: DriverUpdateInput) {
  try {
    const db = await getAuditDb();

    const existing = await prisma.driver.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: "Driver not found" };
    }

    if (!data.firstName?.trim() || !data.lastName?.trim()) {
      return { success: false, error: "First name and Last name are required." };
    }
    if (!data.licenseNo?.trim()) {
      return { success: false, error: "License number is required." };
    }
    if (!data.address?.trim() || !data.contactNo?.trim()) {
      return { success: false, error: "Address and Contact Number are required." };
    }

    const licenseNo = data.licenseNo.trim().toUpperCase();

    // Check duplicate license
    const duplicateLicense = await prisma.driver.findFirst({
      where: {
        licenseNo,
        NOT: { id },
      },
    });
    if (duplicateLicense) {
      return { success: false, error: `License number '${licenseNo}' is already taken.` };
    }

    // Check duplicate email
    let trimmedEmail: string | null = null;
    if (data.email && data.email.trim()) {
      trimmedEmail = data.email.trim().toLowerCase();
      const duplicateEmail = await prisma.driver.findFirst({
        where: {
          email: trimmedEmail,
          NOT: { id },
        },
      });
      if (duplicateEmail) {
        return { success: false, error: `Email '${trimmedEmail}' is already in use by another driver.` };
      }
    }

    const birthDate = new Date(data.dateOfBirth);
    const expiryDate = data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null;

    const updated = await db.driver.update({
      where: { id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        middleName: data.middleName?.trim() || null,
        licenseNo,
        licenseExpiryDate: expiryDate,
        address: data.address.trim(),
        contactNo: data.contactNo.trim(),
        email: trimmedEmail,
        dateOfBirth: birthDate,
        status: data.status,
        profilePicture: data.profilePicture !== undefined ? data.profilePicture : existing.profilePicture,
        licenseFrontImage: data.licenseFrontImage !== undefined ? data.licenseFrontImage : existing.licenseFrontImage,
        licenseBackImage: data.licenseBackImage !== undefined ? data.licenseBackImage : existing.licenseBackImage,
      },
    });

    safeRevalidate();

    return {
      success: true,
      driver: updated,
      message: "Driver profile updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return {
      success: false,
      error: error.message || "Failed to update driver.",
    };
  }
}

/**
 * Attach or detach driver to/from Operator and Franchise (Max 2 drivers: PRIMARY & SECONDARY)
 */
export async function attachDriver(driverId: string, input: DriverAttachInput) {
  try {
    const db = await getAuditDb();

    const existing = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        operator: true,
        newFranchise: true,
      },
    });
    if (!existing) {
      return { success: false, error: "Driver not found." };
    }

    // CASE 1: DETACH DRIVER TO STANDALONE POOL
    if (!input.operatorId && !input.newFranchiseId) {
      if (existing.operatorId || existing.newFranchiseId) {
        // Record detachment history
        await prisma.driverAttachmentHistory.create({
          data: {
            driverId,
            operatorId: existing.operatorId,
            newFranchiseId: existing.newFranchiseId,
            driverRole: existing.driverRole || "PRIMARY",
            action: "DETACHED",
            detachedAt: new Date(),
            remarks: "Driver detached and returned to standalone pool",
          },
        });
      }

      const updated = await db.driver.update({
        where: { id: driverId },
        data: {
          operatorId: null,
          newFranchiseId: null,
          driverRole: null,
          assignedAt: null,
        },
      });

      safeRevalidate();
      return {
        success: true,
        driver: updated,
        message: "Driver detached and returned to Standalone Pool.",
      };
    }

    // CASE 2: ATTACH TO OPERATOR / FRANCHISE BODY
    const targetRole = input.driverRole || "PRIMARY";

    // 1. Check Franchise Body Slot Occupancy (if franchise specified)
    if (input.newFranchiseId) {
      const existingInFranchiseSlot = await prisma.driver.findFirst({
        where: {
          newFranchiseId: input.newFranchiseId,
          driverRole: targetRole,
          NOT: { id: driverId },
        },
      });

      if (existingInFranchiseSlot) {
        if (!input.replaceExisting) {
          return {
            success: false,
            error: `Franchise Body already has an assigned ${targetRole} driver: ${existingInFranchiseSlot.firstName} ${existingInFranchiseSlot.lastName} (${existingInFranchiseSlot.driverId || existingInFranchiseSlot.licenseNo}). Enable 'Replace Existing Driver' to displace them, or select the other role.`,
          };
        }

        // Displace the incumbent driver to Standalone Pool
        await db.driver.update({
          where: { id: existingInFranchiseSlot.id },
          data: {
            operatorId: null,
            newFranchiseId: null,
            driverRole: null,
            assignedAt: null,
          },
        });

        // Record displacement history
        await prisma.driverAttachmentHistory.create({
          data: {
            driverId: existingInFranchiseSlot.id,
            operatorId: existingInFranchiseSlot.operatorId,
            newFranchiseId: existingInFranchiseSlot.newFranchiseId,
            driverRole: targetRole,
            action: "REPLACED",
            detachedAt: new Date(),
            remarks: `Displaced from ${targetRole} slot by driver ${existing.firstName} ${existing.lastName}`,
          },
        });
      }
    }

    // 2. Check Operator Slot Occupancy (if operator specified without franchise)
    if (input.operatorId && !input.newFranchiseId) {
      const existingInOpSlot = await prisma.driver.findFirst({
        where: {
          operatorId: input.operatorId,
          driverRole: targetRole,
          newFranchiseId: null,
          NOT: { id: driverId },
        },
      });

      if (existingInOpSlot) {
        if (!input.replaceExisting) {
          return {
            success: false,
            error: `Operator already has an assigned ${targetRole} driver: ${existingInOpSlot.firstName} ${existingInOpSlot.lastName}. Enable 'Replace Existing Driver' to displace them, or select the other role.`,
          };
        }

        // Displace incumbent
        await db.driver.update({
          where: { id: existingInOpSlot.id },
          data: {
            operatorId: null,
            newFranchiseId: null,
            driverRole: null,
            assignedAt: null,
          },
        });

        await prisma.driverAttachmentHistory.create({
          data: {
            driverId: existingInOpSlot.id,
            operatorId: existingInOpSlot.operatorId,
            driverRole: targetRole,
            action: "REPLACED",
            detachedAt: new Date(),
            remarks: `Displaced from ${targetRole} slot by driver ${existing.firstName} ${existing.lastName}`,
          },
        });
      }
    }

    // 3. If the driver was previously assigned elsewhere, record detachment of old assignment
    if (
      existing.operatorId &&
      (existing.operatorId !== input.operatorId || existing.newFranchiseId !== input.newFranchiseId)
    ) {
      await prisma.driverAttachmentHistory.create({
        data: {
          driverId,
          operatorId: existing.operatorId,
          newFranchiseId: existing.newFranchiseId,
          driverRole: existing.driverRole || "PRIMARY",
          action: "DETACHED",
          detachedAt: new Date(),
          remarks: "Reassigned to new operator/franchise",
        },
      });
    }

    // 4. Resolve paired operatorId or newFranchiseId automatically
    let resolvedOperatorId = input.operatorId || null;
    if (!resolvedOperatorId && input.newFranchiseId) {
      const franchise = await prisma.newFranchise.findUnique({
        where: { id: input.newFranchiseId },
        select: { operatorId: true },
      });
      if (franchise?.operatorId) {
        resolvedOperatorId = franchise.operatorId;
      }
    }

    let resolvedFranchiseId = input.newFranchiseId || null;
    if (!resolvedFranchiseId && input.operatorId) {
      const op = await prisma.operator.findUnique({
        where: { id: input.operatorId },
        select: { newFranchise: { select: { id: true } } },
      });
      if (op?.newFranchise?.id) {
        resolvedFranchiseId = op.newFranchise.id;
      }
    }

    // Update driver with new assignment
    const updated = await db.driver.update({
      where: { id: driverId },
      data: {
        operatorId: resolvedOperatorId,
        newFranchiseId: resolvedFranchiseId,
        driverRole: targetRole,
        assignedAt: new Date(),
      },
      include: {
        operator: true,
        newFranchise: true,
      },
    });

    // 5. Record new attachment history
    await prisma.driverAttachmentHistory.create({
      data: {
        driverId,
        operatorId: resolvedOperatorId,
        newFranchiseId: resolvedFranchiseId,
        driverRole: targetRole,
        action: "ATTACHED",
        remarks: `Assigned as ${targetRole} driver`,
      },
    });

    safeRevalidate();

    return {
      success: true,
      driver: updated,
      message: `Driver successfully assigned as ${targetRole} driver.`,
    };
  } catch (error: any) {
    console.error("Error attaching driver:", error);
    return {
      success: false,
      error: error.message || "Failed to update driver attachment.",
    };
  }
}

/**
 * Delete a driver
 */
export async function deleteDriver(id: string) {
  try {
    const db = await getAuditDb();

    const existing = await prisma.driver.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: "Driver not found." };
    }

    await db.driver.delete({
      where: { id },
    });

    safeRevalidate();

    return {
      success: true,
      message: `Driver record removed successfully.`,
    };
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return {
      success: false,
      error: error.message || "Failed to delete driver.",
    };
  }
}

/**
 * Fetch Driver Statistics with Primary & Secondary breakdowns
 */
export async function getDriverStats() {
  try {
    const [total, active, primaryCount, secondaryCount, standalone] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: "ACTIVE" } }),
      prisma.driver.count({ where: { driverRole: "PRIMARY" } }),
      prisma.driver.count({ where: { driverRole: "SECONDARY" } }),
      prisma.driver.count({
        where: {
          operatorId: null,
          newFranchiseId: null,
        },
      }),
    ]);

    return {
      success: true,
      stats: { total, active, primaryCount, secondaryCount, standalone },
    };
  } catch (error: any) {
    console.error("Error loading driver stats:", error);
    return {
      success: false,
      stats: { total: 0, active: 0, primaryCount: 0, secondaryCount: 0, standalone: 0 },
    };
  }
}

/**
 * Fetch available standalone active drivers for assignment to operators or franchises
 */
export async function getStandaloneDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        operatorId: null,
        newFranchiseId: null,
        status: "ACTIVE",
      },
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        driverId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        licenseNo: true,
        contactNo: true,
        status: true,
        profilePicture: true,
      },
    });

    return { success: true, drivers };
  } catch (error: any) {
    console.error("Error loading standalone drivers:", error);
    return { success: false, error: error.message || "Failed to load available drivers", drivers: [] };
  }
}

/**
 * Detach a driver from their current unit/operator and return them to the Standalone Pool
 */
export async function detachDriver(driverId: string) {
  return await attachDriver(driverId, {
    operatorId: null,
    newFranchiseId: null,
    driverRole: null,
  });
}
