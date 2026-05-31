"use server";

import { prisma, withAudit } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "ENFORCER", "CASHIER", "VIEWER", "USER"]),
});

const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, users };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    const validated = createUserSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
        accounts: {
          create: {
            accountId: validated.email,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(id: string, data: z.infer<typeof userSchema>) {
  try {
    const validated = userSchema.parse(data);

    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    await db.user.update({
      where: { id },
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

export async function updateUserPassword(id: string, password: string) {
  try {
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await prisma.account.findFirst({
      where: { userId: id, providerId: "credential" },
    });

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
    } else {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        await prisma.account.create({
          data: {
            userId: id,
            accountId: user.email,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      }
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update password" };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const db = withAudit(session?.user?.id);

    await db.user.delete({
      where: { id },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}
