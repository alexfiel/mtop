import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TricyclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tricycles & Permits</h2>
          <p className="text-muted-foreground mt-2">
            Manage registered tricycles and MTOP permits.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Tricycle
        </Button>
      </div>
      
      {/* Table Placeholder */}
      <div className="border rounded-md p-8 text-center text-muted-foreground bg-card">
        Tricycles table will be implemented here.
      </div>
    </div>
  );
}
