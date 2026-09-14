"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { unassignFranchise } from "../actions";

interface FranchiseUnassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchise: any | null;
  onSuccess: () => void;
}

export function FranchiseUnassignDialog({
  open,
  onOpenChange,
  franchise,
  onSuccess,
}: FranchiseUnassignDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleUnassign = async () => {
    if (!franchise) return;
    setLoading(true);
    try {
      const res = await unassignFranchise(franchise.id, reason.trim() || undefined);
      if (res.success) {
        toast.success(`Franchise Body #${franchise.franchiseBodyNumber} unassigned and returned to available pool.`);
        onOpenChange(false);
        setReason("");
        onSuccess();
      } else {
        toast.error(res.error || "Failed to unassign franchise.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl">Release / Unassign Franchise</DialogTitle>
              <DialogDescription className="text-xs">
                This action detaches the operator and vehicle from this franchise body number.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Franchise Slot:</span>
              <Badge variant="outline" className="font-mono font-bold">
                Body #{franchise?.franchiseBodyNumber}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Operator:</span>
              <span className="font-semibold text-foreground">{franchise?.operator?.name || "None"}</span>
            </div>
            {franchise?.mtopVehicle && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Attached Vehicle:</span>
                <span className="font-mono font-medium">{franchise.mtopVehicle.plateNumber}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unassignReason" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reason for Release / Unassignment (Optional)
            </Label>
            <Textarea
              id="unassignReason"
              rows={3}
              placeholder="e.g. Operator retired, dropped, or vehicle change requested."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Body #{franchise?.franchiseBodyNumber} will remain in the system as an available unassigned slot.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleUnassign}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Release
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
