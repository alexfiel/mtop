"use server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  secretCode: z.string().min(1, "Secret code is required"),
});

export async function registerAdmin(data: z.infer<typeof formSchema>) {
  try {
    const validated = formSchema.parse(data);

    if (validated.secretCode !== "ADMIN2026") {
      return { success: false, error: "Invalid admin secret code." };
    }

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existing) {
      return { success: false, error: "Email is already registered." };
    }

    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      return { success: false, error: "Admin role not found in database. Please run the seed script." };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        roles: {
          create: [{ role: { connect: { id: adminRole.id } } }],
        },
        accounts: {
          create: {
            accountId: validated.email,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Registration failed." };
  }
}
