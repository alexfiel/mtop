import { getUsers, getRoles, getDomains } from "./actions";
import { UserManagementTabs } from "./components/user-management-tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Users & Domains Management | MTOP",
  description: "Manage system users, municipal workflow domains, and administrative roles.",
};

export default async function UsersPage() {
  const [usersResult, rolesResult, domainsResult] = await Promise.all([
    getUsers(),
    getRoles(),
    getDomains(),
  ]);

  if (!usersResult.success || !usersResult.users) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-8rem)]">
        <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5 shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold mb-2">Access Denied</AlertTitle>
            <AlertDescription className="text-sm">
              {usersResult.error || "Failed to load users. Super Admin or Admin role required."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const users = usersResult.users as any;
  const roles = (rolesResult.roles || []) as any;
  const domains = (domainsResult.domains || []) as any;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Management Console...</div>}>
        <UserManagementTabs users={users} roles={roles} domains={domains} />
      </Suspense>
    </div>
  );
}
