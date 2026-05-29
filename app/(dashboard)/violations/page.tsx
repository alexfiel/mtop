import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ViolationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Violations</h2>
          <p className="text-muted-foreground mt-2">
            Log and track driver/tricycle violations.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Issue Ticket
        </Button>
      </div>
      
      {/* Table Placeholder */}
      <div className="border rounded-md p-8 text-center text-muted-foreground bg-card">
        Violations table will be implemented here.
      </div>
    </div>
  );
}
