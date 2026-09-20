"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Unlink,
  Building2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Star,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { attachDriver } from "../actions";
import type {
  DriverItem,
  OperatorOptionForDriver,
  FranchiseOptionForDriver,
} from "../types";

interface DriverAttachModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverItem | null;
  operators: OperatorOptionForDriver[];
  franchises: FranchiseOptionForDriver[];
  onSuccess: () => void;
}

export function DriverAttachModal({
  isOpen,
  onClose,
  driver,
  operators,
  franchises,
  onSuccess,
}: DriverAttachModalProps) {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"PRIMARY" | "SECONDARY">("PRIMARY");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (driver) {
      setSelectedOperatorId(driver.operatorId || null);
      setSelectedFranchiseId(driver.newFranchiseId || null);
      setSelectedRole(driver.driverRole || "PRIMARY");
      setReplaceExisting(false);
      setErrorMsg(null);
    }
  }, [driver]);

  if (!driver) return null;

  const handleOperatorChange = (opId: string | null) => {
    setSelectedOperatorId(opId);
    setReplaceExisting(false);
    if (!opId) {
      setSelectedFranchiseId(null);
    } else {
      const op = operators.find((o) => o.id === opId);
      if (op?.newFranchise?.id) {
        setSelectedFranchiseId(op.newFranchise.id);
      }
    }
  };

  const handleFranchiseChange = (frId: string | null) => {
    setSelectedFranchiseId(frId);
    setReplaceExisting(false);
  };

  // Find currently selected franchise or operator to inspect slot occupancy
  const currentFranchise = franchises.find((f) => f.id === selectedFranchiseId);
  const currentOperator = operators.find((o) => o.id === selectedOperatorId);

  // Active slots for chosen target
  const activeTargetSlots = currentFranchise
    ? {
        primary: currentFranchise.primaryDriver,
        secondary: currentFranchise.secondaryDriver,
        label: `Franchise Body #${currentFranchise.franchiseBodyNumber}`,
      }
    : currentOperator
    ? {
        primary: currentOperator.primaryDriver,
        secondary: currentOperator.secondaryDriver,
        label: `Operator: ${currentOperator.name}`,
      }
    : null;

  // Check if chosen slot is occupied by someone else
  const incumbentInSelectedSlot =
    activeTargetSlots &&
    (selectedRole === "PRIMARY"
      ? activeTargetSlots.primary
      : activeTargetSlots.secondary);

  const isSlotOccupiedByOther = Boolean(
    incumbentInSelectedSlot && incumbentInSelectedSlot.id !== driver.id
  );

  const handleSaveAttachment = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await attachDriver(driver.id, {
        operatorId: selectedOperatorId,
        newFranchiseId: selectedFranchiseId,
        driverRole: selectedRole,
        replaceExisting,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update driver attachment.");
        toast.error(res.error || "Failed to update attachment.");
      } else {
        toast.success(res.message || "Driver attachment updated successfully.");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      toast.error(err.message || "Error updating attachment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetachAll = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await attachDriver(driver.id, {
        operatorId: null,
        newFranchiseId: null,
        driverRole: null,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to detach driver.");
        toast.error(res.error || "Failed to detach driver.");
      } else {
        toast.success("Driver detached and moved to Standalone Pool.");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      toast.error(err.message || "Error detaching driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableFranchises = selectedOperatorId
    ? franchises.filter((f) => f.operatorId === selectedOperatorId)
    : franchises;

  const isCurrentlyAttached = Boolean(driver.operatorId || driver.newFranchiseId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Assign Driver to Operator & Franchise Body
              </DialogTitle>
              <DialogDescription className="text-xs">
                Each franchise/operator allows maximum 2 assigned drivers: 1 Primary and 1 Secondary (Relief).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* DRIVER SUMMARY BANNER */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
            <div className="flex items-center gap-3">
              {driver.profilePicture ? (
                <img
                  src={driver.profilePicture}
                  alt={driver.firstName}
                  className="h-10 w-10 rounded-full object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {driver.firstName[0]}
                  {driver.lastName[0]}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">
                  {driver.firstName} {driver.middleName ? `${driver.middleName[0]}. ` : ""}
                  {driver.lastName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                  <span>{driver.driverId || "No ID"}</span>
                  <span>•</span>
                  <span>{driver.licenseNo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {driver.driverRole && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    driver.driverRole === "PRIMARY"
                      ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      : "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                  }`}
                >
                  {driver.driverRole === "PRIMARY" ? "★ PRIMARY" : "🛡 SECONDARY"}
                </Badge>
              )}
              <Badge
                variant={isCurrentlyAttached ? "default" : "secondary"}
                className="text-[10px]"
              >
                {isCurrentlyAttached ? "Attached" : "Standalone"}
              </Badge>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* OPERATOR SELECTION */}
          <div className="space-y-1.5">
            <Label htmlFor="attach-operator" className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Assigned MTOP Operator
            </Label>
            <Select
              value={selectedOperatorId || "none"}
              onValueChange={(val) => handleOperatorChange(val === "none" ? null : val)}
            >
              <SelectTrigger id="attach-operator" className="h-9 text-xs">
                <SelectValue placeholder="Select Registered Operator" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="none" className="text-xs text-muted-foreground font-medium">
                  None (Unattached / Standalone Pool)
                </SelectItem>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{op.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        ({op.operatorId})
                      </span>
                      {op.driverCount > 0 && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                          {op.driverCount}/2 drivers
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FRANCHISE BODY NUMBER SELECTION */}
          <div className="space-y-1.5">
            <Label htmlFor="attach-franchise" className="text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Authorized Franchise Body Number
            </Label>
            <Select
              value={selectedFranchiseId || "none"}
              onValueChange={(val) => handleFranchiseChange(val === "none" ? null : val)}
            >
              <SelectTrigger id="attach-franchise" className="h-9 text-xs font-mono">
                <SelectValue placeholder="Select Franchise Body Number" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="none" className="text-xs text-muted-foreground font-sans">
                  None (No Specific Body Assigned)
                </SelectItem>
                {availableFranchises.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        Body #{f.franchiseBodyNumber}
                      </span>
                      {f.operatorName && (
                        <span className="text-[11px] text-muted-foreground font-sans">
                          - {f.operatorName}
                        </span>
                      )}
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                        {f.driverCount}/2 drivers
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DRIVER CAPACITY & ROLE SELECTION (PRIMARY VS SECONDARY) */}
          {(selectedOperatorId || selectedFranchiseId) && (
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Designate Driver Slot & Role (Max 2 Allowed)
                </Label>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {activeTargetSlots?.label || "Unit Slots"}
                </Badge>
              </div>

              {/* Slot Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* SLOT 1: PRIMARY */}
                <div
                  onClick={() => setSelectedRole("PRIMARY")}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole === "PRIMARY"
                      ? "border-amber-500 bg-amber-500/5 shadow-xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      Primary Driver
                    </span>
                    {selectedRole === "PRIMARY" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Main authorized operator
                  </p>

                  <div className="mt-2 pt-2 border-t text-[11px]">
                    {activeTargetSlots?.primary ? (
                      <div className="flex items-center gap-1 text-foreground font-medium truncate">
                        <UserCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {activeTargetSlots.primary.id === driver.id
                            ? "(Current Driver)"
                            : activeTargetSlots.primary.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium text-[10px]">
                        ● Vacant (Available)
                      </span>
                    )}
                  </div>
                </div>

                {/* SLOT 2: SECONDARY */}
                <div
                  onClick={() => setSelectedRole("SECONDARY")}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole === "SECONDARY"
                      ? "border-blue-500 bg-blue-500/5 shadow-xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      Secondary Driver
                    </span>
                    {selectedRole === "SECONDARY" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Alternate / Relief operator
                  </p>

                  <div className="mt-2 pt-2 border-t text-[11px]">
                    {activeTargetSlots?.secondary ? (
                      <div className="flex items-center gap-1 text-foreground font-medium truncate">
                        <UserCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {activeTargetSlots.secondary.id === driver.id
                            ? "(Current Driver)"
                            : activeTargetSlots.secondary.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium text-[10px]">
                        ● Vacant (Available)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SLOT OCCUPIED WARNING & REPLACE TOGGLE */}
              {isSlotOccupiedByOther && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span>
                        The <strong>{selectedRole}</strong> slot is currently held by{" "}
                        <strong>{incumbentInSelectedSlot?.name}</strong> (
                        {incumbentInSelectedSlot?.licenseNo}).
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-foreground font-semibold">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded border-input h-4 w-4 text-primary"
                    />
                    <span>
                      Replace {incumbentInSelectedSlot?.name} and move them to Standalone Pool
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex sm:items-center justify-between gap-2">
          {isCurrentlyAttached ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDetachAll}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
            >
              <Unlink className="h-3.5 w-3.5" />
              Detach to Standalone
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={Boolean(isSubmitting || (isSlotOccupiedByOther && !replaceExisting))}
              onClick={handleSaveAttachment}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Save Assignment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
