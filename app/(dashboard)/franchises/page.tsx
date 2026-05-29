import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FranchisesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Franchises</h2>
          <p className="text-muted-foreground mt-2">
            Manage MTOP Franchises.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Issue Franchise
        </Button>
      </div>
      
      {/* Table Placeholder */}
      <div className="border rounded-md p-8 text-center text-muted-foreground bg-card">
        Franchises table will be implemented here.
      </div>
    </div>
  );
}
