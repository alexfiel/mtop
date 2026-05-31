import { prisma } from "@/lib/prisma";
import { AuditLogList } from "./components/audit-log-list";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <AuditLogList initialLogs={logs} />
    </div>
  );
}
