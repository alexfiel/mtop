import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Auto-invalidate stale cached Prisma instance if schema was updated during development
if (
  globalForPrisma.prisma &&
  (!(globalForPrisma.prisma as any).domain ||
    !(globalForPrisma.prisma as any)._runtimeDataModel?.models?.User?.fields?.some(
      (f: any) => f.name === "isActive"
    ))
) {
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Enterprise Audit Logger Extension
export const withAudit = (userId?: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          if (model !== "AuditLog" && model !== "Session" && model !== "Account") {
            await prisma.auditLog.create({
              data: {
                entity: model,
                entityId: (result as any).id || "UNKNOWN",
                action: "CREATE",
                changes: JSON.stringify(args.data || {}),
                userId: userId || null,
              },
            });
          }
          return result;
        },
        async update({ model, args, query }) {
          const result = await query(args);
          if (model !== "AuditLog" && model !== "Session" && model !== "Account") {
            await prisma.auditLog.create({
              data: {
                entity: model,
                entityId: (result as any).id || "UNKNOWN",
                action: "UPDATE",
                changes: JSON.stringify(args.data || {}),
                userId: userId || null,
              },
            });
          }
          return result;
        },
        async delete({ model, args, query }) {
          const result = await query(args);
          if (model !== "AuditLog" && model !== "Session" && model !== "Account") {
            await prisma.auditLog.create({
              data: {
                entity: model,
                entityId: (result as any).id || "UNKNOWN",
                action: "DELETE",
                // For delete, we store what was used to find it
                changes: JSON.stringify(args.where || {}),
                userId: userId || null,
              },
            });
          }
          return result;
        },
      },
    },
  });
};
