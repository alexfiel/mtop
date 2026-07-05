"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactNo: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

export async function updateProfile(data: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    
    const validated = updateProfileSchema.parse(data);

    // Update base User model
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validated.name },
    });

    // Upsert UserProfile model
    const dateOfBirth = validated.dateOfBirth ? new Date(validated.dateOfBirth) : null;
    
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        contactNo: validated.contactNo || null,
        jobTitle: validated.jobTitle || null,
        department: validated.department || null,
        office: validated.office || null,
        dateOfBirth: dateOfBirth,
        address: validated.address || null,
      },
      create: {
        userId: session.user.id,
        contactNo: validated.contactNo || null,
        jobTitle: validated.jobTitle || null,
        department: validated.department || null,
        office: validated.office || null,
        dateOfBirth: dateOfBirth,
        address: validated.address || null,
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile" };
  }
}
