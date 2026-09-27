"use server";

import { prisma, withAudit } from "@/lib/prisma";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function checkAdminAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { authorized: false, isSuperAdmin: false, session: null };
  
  // Verify that the user itself is not disabled
  try {
    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (caller && (caller as any).isActive === false) {
      return { authorized: false, isSuperAdmin: false, session: null };
    }
  } catch (err) {
    console.warn("Could not check caller active status:", err);
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    include: { role: true }
  });
  
  const isSuperAdmin = userRoles.some(ur => ur.role.name === "SUPERADMIN");
  const isAdmin = userRoles.some(ur => ur.role.name === "ADMIN");
  
  return { authorized: isAdmin || isSuperAdmin, isSuperAdmin, session };
}

// -------------------------------------------------------------
// USER VALIDATION SCHEMAS
// -------------------------------------------------------------
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
  domainId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  office: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  contactNo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof userSchema>;

// -------------------------------------------------------------
// DOMAIN VALIDATION SCHEMAS
// -------------------------------------------------------------
const domainSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  type: z.enum(["WORKFLOW", "DEPARTMENT", "OFFICE"]).default("WORKFLOW"),
  allowedEmailDomain: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type DomainInput = z.infer<typeof domainSchema>;

// -------------------------------------------------------------
// USER ACTIONS
// -------------------------------------------------------------
export async function getRoles() {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, roles };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch roles" };
  }
}

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
        },
        profile: {
          include: {
            domain: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch users" };
  }
}

async function isTargetUserSuperAdmin(userId: string) {
  const targetUserRoles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } });
  return targetUserRoles.some(ur => ur.role.name === "SUPERADMIN");
}

export async function createUser(data: CreateUserInput) {
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
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists in system" };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    // 1. Resolve domain details if domainId provided
    let domainRecord = null;
    if (validated.domainId && (prisma as any).domain) {
      domainRecord = await prisma.domain.findUnique({
        where: { id: validated.domainId },
      });
    }

    // 2. Hash password with Better-Auth's compatible crypto
    const hashedPassword = await hashPassword(validated.password);

    // 3. Resolve role IDs
    const roleIds = await Promise.all(
      validated.roles.map(async (roleStr) => {
        const existingRole = await prisma.role.findFirst({
          where: { OR: [{ id: roleStr }, { name: roleStr.toUpperCase() }] },
        });

        if (existingRole) {
          return existingRole.id;
        } else {
          const newRole = await prisma.role.create({
            data: {
              name: roleStr.toUpperCase(),
              function: `Custom ${roleStr} Role`,
            },
          });
          return newRole.id;
        }
      })
    );

    // 4. Create User, Account, UserRole, and UserProfile atomically
    const newUser = await db.user.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        emailVerified: true,
        isActive: validated.isActive !== undefined ? validated.isActive : true,
        accounts: {
          create: {
            providerId: "credential",
            accountId: validated.email.toLowerCase().trim(),
            password: hashedPassword,
          },
        },
        roles: {
          create: roleIds.map((roleId) => ({
            roleId,
          })),
        },
        profile: {
          create: {
            domainId: domainRecord ? domainRecord.id : validated.domainId || null,
            office: domainRecord ? domainRecord.code : validated.office || null,
            department: domainRecord ? domainRecord.name : validated.department || null,
            jobTitle: validated.jobTitle || null,
            contactNo: validated.contactNo || null,
          },
        },
      },
    });

    revalidatePath("/users");
    return { success: true, userId: newUser.id };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { success: false, error: error.message || "Failed to create user" };
  }
}

export async function updateUser(id: string, data: UpdateUserInput) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin && (await isTargetUserSuperAdmin(id))) {
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

    // Resolve domain details
    let domainRecord = null;
    if (validated.domainId && (prisma as any).domain) {
      domainRecord = await prisma.domain.findUnique({
        where: { id: validated.domainId },
      });
    }

    // Resolve or create roles
    const roleIds = await Promise.all(
      validated.roles.map(async (roleStr) => {
        const existingRole = await prisma.role.findFirst({
          where: { OR: [{ id: roleStr }, { name: roleStr.toUpperCase() }] },
        });

        if (existingRole) {
          return existingRole.id;
        } else {
          const newRole = await prisma.role.create({
            data: {
              name: roleStr.toUpperCase(),
              function: `Custom ${roleStr} Role`,
            },
          });
          return newRole.id;
        }
      })
    );

    // Update User and UserRoles
    await db.user.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        ...(validated.isActive !== undefined && {
          isActive: validated.isActive,
          ...(validated.isActive === false ? { disabledAt: new Date() } : { disabledAt: null, disabledReason: null }),
        }),
        roles: {
          deleteMany: {},
          create: roleIds.map((roleId) => ({
            roleId,
          })),
        },
      },
    });

    // If disabled, delete all active sessions
    if (validated.isActive === false) {
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    // Upsert UserProfile
    await db.userProfile.upsert({
      where: { userId: id },
      update: {
        domainId: domainRecord ? domainRecord.id : validated.domainId || null,
        office: domainRecord ? domainRecord.code : validated.office || null,
        department: domainRecord ? domainRecord.name : validated.department || null,
        jobTitle: validated.jobTitle || null,
        contactNo: validated.contactNo || null,
      },
      create: {
        userId: id,
        domainId: domainRecord ? domainRecord.id : validated.domainId || null,
        office: domainRecord ? domainRecord.code : validated.office || null,
        department: domainRecord ? domainRecord.name : validated.department || null,
        jobTitle: validated.jobTitle || null,
        contactNo: validated.contactNo || null,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Update user error:", error);
    return { success: false, error: error.message || "Failed to update user" };
  }
}

/**
 * Superadmin action to disable or enable user access to the system.
 * Disabling revokes active sessions immediately and prevents future sign in.
 */
export async function toggleUserAccess(userId: string, disable: boolean, reason?: string) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin) {
      return { success: false, error: "Only Superadmin accounts have permission to disable or restore system access." };
    }

    if (access.session?.user?.id === userId) {
      return { success: false, error: "You cannot disable your own Superadmin account." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!targetUser) {
      return { success: false, error: "User account not found." };
    }

    const isTargetSuperAdmin = targetUser.roles.some((ur) => ur.role.name === "SUPERADMIN");
    if (isTargetSuperAdmin && disable) {
      return { success: false, error: "Superadmin accounts cannot be disabled for system stability." };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    if (disable) {
      // 1. Mark user as disabled
      await db.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          disabledAt: new Date(),
          disabledReason: reason?.trim() || "Account access suspended by Super Admin",
        },
      });

      // 2. Invalidate all active sessions immediately
      await prisma.session.deleteMany({
        where: { userId },
      });
    } else {
      // Restore user access
      await db.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          disabledAt: null,
          disabledReason: null,
        },
      });
    }

    revalidatePath("/users");
    return {
      success: true,
      message: disable
        ? `Access disabled for ${targetUser.name}. All active sessions terminated.`
        : `Access restored for ${targetUser.name}.`,
    };
  } catch (error: any) {
    console.error("Toggle user access error:", error);
    return { success: false, error: error.message || "Failed to update user access status." };
  }
}

export async function updateUserPassword(id: string, password: string) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin && (await isTargetUserSuperAdmin(id))) {
      return { success: false, error: "Admins cannot modify Superadmin accounts." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    const hashedPassword = await hashPassword(password);

    const account = await prisma.account.findFirst({
      where: { userId: id, providerId: "credential" },
    });

    if (account) {
      await db.account.update({
        where: { id: account.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.account.create({
        data: {
          userId: id,
          accountId: id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Update password error:", error);
    return { success: false, error: error.message || "Failed to update password" };
  }
}

export async function deleteUser(id: string) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!access.isSuperAdmin && (await isTargetUserSuperAdmin(id))) {
      return { success: false, error: "Admins cannot delete Superadmin accounts." };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    await db.user.delete({
      where: { id },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete user" };
  }
}

// -------------------------------------------------------------
// DOMAIN ACTIONS
// -------------------------------------------------------------
export async function getDomains() {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    if (!(prisma as any).domain) {
      return { success: true, domains: [] };
    }

    const domains = await prisma.domain.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { code: "asc" },
    });

    return { success: true, domains };
  } catch (error: any) {
    console.error("Get domains error:", error);
    return { success: false, error: error.message || "Failed to fetch domains" };
  }
}

export async function createDomain(data: DomainInput) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const validated = domainSchema.parse(data);
    const code = validated.code.toUpperCase().trim();

    const existing = await prisma.domain.findUnique({
      where: { code },
    });

    if (existing) {
      return { success: false, error: `Domain with code '${code}' already exists.` };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    const domain = await db.domain.create({
      data: {
        code,
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
        type: validated.type,
        allowedEmailDomain: validated.allowedEmailDomain?.trim().toLowerCase() || null,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/users");
    return { success: true, domain };
  } catch (error: any) {
    console.error("Create domain error:", error);
    return { success: false, error: error.message || "Failed to create domain" };
  }
}

export async function updateDomain(
  id: string,
  data: Partial<DomainInput>
) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const session = access.session;
    const db = withAudit(session?.user?.id);

    const domain = await db.domain.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.type && { type: data.type }),
        ...(data.allowedEmailDomain !== undefined && {
          allowedEmailDomain: data.allowedEmailDomain?.trim().toLowerCase() || null,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/users");
    return { success: true, domain };
  } catch (error: any) {
    console.error("Update domain error:", error);
    return { success: false, error: error.message || "Failed to update domain" };
  }
}

export async function deleteDomain(id: string) {
  try {
    const access = await checkAdminAccess();
    if (!access.authorized) return { success: false, error: "Unauthorized" };

    const targetDomain = await prisma.domain.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!targetDomain) {
      return { success: false, error: "Domain not found." };
    }

    // Protect foundational workflow domains from accidental deletion
    const foundational = ["BPLO", "TRAFFIC", "SP", "TREASURY"];
    if (foundational.includes(targetDomain.code)) {
      return {
        success: false,
        error: `Domain '${targetDomain.code}' is a protected core workflow domain and cannot be deleted. You can mark it inactive instead.`,
      };
    }

    const session = access.session;
    const db = withAudit(session?.user?.id);

    // Unlink users first if any
    await prisma.userProfile.updateMany({
      where: { domainId: id },
      data: { domainId: null },
    });

    await db.domain.delete({
      where: { id },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete domain error:", error);
    return { success: false, error: error.message || "Failed to delete domain" };
  }
}
