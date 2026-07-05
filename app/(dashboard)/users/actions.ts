"use server";

import { prisma, withAudit } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
});

export async function getRoles() {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, roles };
  } catch (error) {
    return { success: false, error: "Failed to fetch roles" };
  }
}

const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function getUsers() {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, users };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

async function isTargetUserSuperAdmin(userId: string) {
  const targetUserRoles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } });
  return targetUserRoles.some(ur => ur.role.name === "SUPERADMIN");
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const validated = createUserSchema.parse(data);

    if (!access.isSuperAdmin) {
      const superadminRole = await prisma.role.findFirst({ where: { name: "SUPERADMIN" } });
      const isTryingToAssignSuperadmin = validated.roles.some(
        r => r.toUpperCase() === "SUPERADMIN" || (superadminRole && r === superadminRole.id)
      );
      if (isTryingToAssignSuperadmin) {
        return { success: false, error: "Only Superadmins can assign the SUPERADMIN role." };
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    // Resolve or create roles
    const roleConnectOrCreate = await Promise.all(
      validated.roles.map(async (roleStr) => {
        const existingRole = await prisma.role.findFirst({
          where: { OR: [{ id: roleStr }, { name: roleStr }] }
        });
        
        if (existingRole) {
          return existingRole.id;
        } else {
          const newRole = await prisma.role.create({
            data: {
              name: roleStr.toUpperCase(),
              function: `Custom ${roleStr} Role`,
            }
          });
          return newRole.id;
        }
      })
    );

    // Use better-auth to create the user with the correct hash format
    // We pass headers so auth knows context
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: validated.name,
        email: validated.email,
        password: validated.password,
      }
    });

    if (!signUpResult.user) {
      return { success: false, error: "Failed to create user via auth" };
    }

    // Attach roles
    await db.userRole.createMany({
      data: roleConnectOrCreate.map((roleId) => ({
        userId: signUpResult.user.id,
        roleId: roleId
      }))
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
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin && await isTargetUserSuperAdmin(id)) {
      return { success: false, error: "Admins cannot modify Superadmin accounts." };
    }

    const validated = userSchema.parse(data);

    if (!access.isSuperAdmin) {
      const superadminRole = await prisma.role.findFirst({ where: { name: "SUPERADMIN" } });
      const isTryingToAssignSuperadmin = validated.roles.some(
        r => r.toUpperCase() === "SUPERADMIN" || (superadminRole && r === superadminRole.id)
      );
      if (isTryingToAssignSuperadmin) {
        return { success: false, error: "Only Superadmins can assign the SUPERADMIN role." };
      }
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    // Resolve or create roles
    const roleConnectOrCreate = await Promise.all(
      validated.roles.map(async (roleStr) => {
        const existingRole = await prisma.role.findFirst({
          where: { OR: [{ id: roleStr }, { name: roleStr }] }
        });
        
        if (existingRole) {
          return { role: { connect: { id: existingRole.id } } };
        } else {
          return {
            role: {
              create: {
                name: roleStr.toUpperCase(),
                function: `Custom ${roleStr} Role`,
              }
            }
          };
        }
      })
    );

    await db.user.update({
      where: { id },
      data: {
        name: validated.name,
        email: validated.email,
        roles: {
          deleteMany: {},
          create: roleConnectOrCreate
        },
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
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin && await isTargetUserSuperAdmin(id)) {
      return { success: false, error: "Admins cannot modify Superadmin accounts." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const res = await auth.api.setPassword({
      body: {
        userId: id,
        newPassword: password,
      }
    });

    if (res.status === false) {
       return { success: false, error: "Failed to set password via auth API" }
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update password" };
  }
}

export async function deleteUser(id: string) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin && await isTargetUserSuperAdmin(id)) {
      return { success: false, error: "Admins cannot delete Superadmin accounts." };
    }

    const session = access.session;
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
