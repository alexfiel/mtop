import { getUsers } from "./actions";
import { UserList } from "./components/user-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Users Management | MTOP",
  description: "Manage system users and roles.",
};

export default async function UsersPage() {
  const result = await getUsers();

  if (!result.success || !result.users) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to load users. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <UserList users={result.users} />
    </div>
  );
}
