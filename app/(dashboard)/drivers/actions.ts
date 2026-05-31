"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function registerDriver(data: {
  firstName: string;
  lastName: string;
  middleName?: string;
  licenseNo: string;
  address: string;
  contactNo: string;
  email: string;
  dateOfBirth: Date;
  profilePicture?: string;
  licensePicture?: string;
}) {
  const { profilePicture, licensePicture, ...driverData } = data;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    const driver = await db.driver.create({
      data: {
        ...driverData,
        profilePicture: profilePicture || null,
        documents: licensePicture ? {
          create: {
            fileUrl: licensePicture,
            fileType: "IMAGE",
            documentType: "DRIVERS_LICENSE",
          }
        } : undefined
      }
    });

    revalidatePath("/drivers");
    return { success: true, driver };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "A driver with this License Number or Email already exists." };
    }
    return { success: false, error: error.message || "Failed to register driver." };
  }
}

export async function getDrivers() {
  return await prisma.driver.findMany({
    include: {
      mainTricycles: true,
      extraTricycles: true,
      documents: true,
    },
    orderBy: {
      lastName: "asc",
    },
  });
}

export async function getDriverById(id: string) {
  return await prisma.driver.findUnique({
    where: { id },
  });
}
