import { getUsers, getRoles } from "./actions";
import { UserList } from "./components/user-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Users Management | MTOP",
  description: "Manage system users and roles.",
};

export default async function UsersPage() {
  const result = await getUsers();
  const rolesResult = await getRoles();

  if (!result.success || !result.users) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-8rem)]">
        <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5 shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold mb-2">Access Denied</AlertTitle>
            <AlertDescription className="text-sm">
              {result.error || "Failed to load users. Please try again."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <UserList users={result.users as any} roles={rolesResult.roles || []} />
    </div>
  );
}
