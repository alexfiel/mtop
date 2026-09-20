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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Star,
  ShieldCheck,
  UserPlus,
  Unlink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Phone,
  CreditCard,
  Calendar,
  X,
  UserCheck,
} from "lucide-react";
import { attachDriver, detachDriver, getStandaloneDrivers } from "@/app/driver/actions";
import { toast } from "sonner";

export interface UnitDriverInfo {
  id: string;
  driverId: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  licenseNo: string;
  contactNo: string;
  status: string;
  profilePicture?: string | null;
  driverRole?: string | null; // "PRIMARY" | "SECONDARY"
  assignedAt?: Date | string | null;
}

interface UnitDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "operator" | "franchise";
  targetId: string;
  targetTitle: string; // e.g. "Franchise Body #102" or "Operator: Juan Santos"
  targetSubtext?: string; // e.g. "Plate: 7102-TF • Honda TMX" or "ID: OP-154-2026-0001"
  drivers: UnitDriverInfo[];
  onSuccess: () => void;
}

export function UnitDriversModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetSubtext,
  drivers = [],
  onSuccess,
}: UnitDriversModalProps) {
  // Find current primary and secondary
  const primaryDriver = drivers.find((d) => d.driverRole === "PRIMARY") || null;
  const secondaryDriver = drivers.find((d) => d.driverRole === "SECONDARY") || null;

  // Picker state
  const [pickerSlot, setPickerSlot] = useState<"PRIMARY" | "SECONDARY" | null>(null);
  const [standaloneDrivers, setStandaloneDrivers] = useState<UnitDriverInfo[]>([]);
  const [isLoadingStandalone, setIsLoadingStandalone] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detachingDriverId, setDetachingDriverId] = useState<string | null>(null);

  // Load standalone drivers when picker opens
  useEffect(() => {
    if (pickerSlot) {
      setIsLoadingStandalone(true);
      getStandaloneDrivers()
        .then((res) => {
          if (res.success && res.drivers) {
            setStandaloneDrivers(res.drivers as UnitDriverInfo[]);
          }
        })
        .finally(() => setIsLoadingStandalone(false));
    }
  }, [pickerSlot]);

  // Handle assign from picker
  const handleAssignDriver = async (driver: UnitDriverInfo) => {
    if (!pickerSlot) return;

    setIsSubmitting(true);
    try {
      const payload = {
        operatorId: targetType === "operator" ? targetId : null,
        newFranchiseId: targetType === "franchise" ? targetId : null,
        driverRole: pickerSlot,
        replaceExisting: true,
      };

      const res = await attachDriver(driver.id, payload);
      if (!res.success) {
        toast.error(res.error || "Failed to assign driver");
      } else {
        toast.success(
          `${driver.firstName} ${driver.lastName} assigned as ${pickerSlot} driver.`
        );
        setPickerSlot(null);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle detach
  const handleDetachDriver = async (driverId: string, roleName: string) => {
    setDetachingDriverId(driverId);
    try {
      const res = await detachDriver(driverId);
      if (!res.success) {
        toast.error(res.error || "Failed to detach driver");
      } else {
        toast.success(`${roleName} driver detached and returned to Standalone Pool.`);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDetachingDriverId(null);
    }
  };

  // Filter available drivers in picker
  const filteredStandalone = standaloneDrivers.filter((d) => {
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return true;
    const name = `${d.firstName} ${d.middleName || ""} ${d.lastName}`.toLowerCase();
    return (
      name.includes(q) ||
      d.driverId?.toLowerCase().includes(q) ||
      d.licenseNo.toLowerCase().includes(q) ||
      d.contactNo.includes(q)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {targetTitle} - Assigned Drivers
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {targetSubtext || "Manage Primary and Secondary driver capacity (Max 2 drivers)"}
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-mono">
              {(primaryDriver ? 1 : 0) + (secondaryDriver ? 1 : 0)} / 2 Assigned
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* CAPACITY NOTICE BANNER */}
          <div className="p-3 rounded-xl border bg-card/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                Capacity: <strong>1 Primary Driver</strong> (Main) and{" "}
                <strong>1 Secondary Driver</strong> (Relief).
              </span>
            </div>
          </div>

          {/* MAIN VIEW: THE 2 SLOTS */}
          {!pickerSlot ? (
            <div className="space-y-3">
              {/* 1. PRIMARY DRIVER SLOT */}
              <div className="p-4 rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Slot 1: Primary Driver (Main)
                    </span>
                  </div>
                  {primaryDriver ? (
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                      ACTIVE PRIMARY
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
                      ● VACANT
                    </Badge>
                  )}
                </div>

                {primaryDriver ? (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      {primaryDriver.profilePicture ? (
                        <img
                          src={primaryDriver.profilePicture}
                          alt={primaryDriver.firstName}
                          className="h-11 w-11 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-500/20">
                          {primaryDriver.firstName[0]}
                          {primaryDriver.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {primaryDriver.firstName} {primaryDriver.middleName ? `${primaryDriver.middleName[0]}. ` : ""}
                          {primaryDriver.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                          <span>{primaryDriver.driverId || "No ID"}</span>
                          <span>•</span>
                          <span>{primaryDriver.licenseNo}</span>
                          <span>•</span>
                          <span>{primaryDriver.contactNo}</span>
                        </div>
                        {primaryDriver.assignedAt && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            Assigned on{" "}
                            {new Date(primaryDriver.assignedAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPickerSlot("PRIMARY")}
                        className="h-7 text-xs gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={detachingDriverId === primaryDriver.id}
                        onClick={() => handleDetachDriver(primaryDriver.id, "Primary")}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                      >
                        {detachingDriverId === primaryDriver.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlink className="h-3 w-3" />
                        )}
                        Detach
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-background/50">
                    <span className="text-xs text-muted-foreground">
                      No primary driver assigned. Unit has no full-time operator.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPickerSlot("PRIMARY")}
                      className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign Primary Driver
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. SECONDARY DRIVER SLOT */}
              <div className="p-4 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Slot 2: Secondary Driver (Relief)
                    </span>
                  </div>
                  {secondaryDriver ? (
                    <Badge variant="outline" className="text-[10px] font-bold border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10">
                      ACTIVE RELIEF
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
                      ● VACANT
                    </Badge>
                  )}
                </div>

                {secondaryDriver ? (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      {secondaryDriver.profilePicture ? (
                        <img
                          src={secondaryDriver.profilePicture}
                          alt={secondaryDriver.firstName}
                          className="h-11 w-11 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-500/20">
                          {secondaryDriver.firstName[0]}
                          {secondaryDriver.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {secondaryDriver.firstName} {secondaryDriver.middleName ? `${secondaryDriver.middleName[0]}. ` : ""}
                          {secondaryDriver.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                          <span>{secondaryDriver.driverId || "No ID"}</span>
                          <span>•</span>
                          <span>{secondaryDriver.licenseNo}</span>
                          <span>•</span>
                          <span>{secondaryDriver.contactNo}</span>
                        </div>
                        {secondaryDriver.assignedAt && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            Assigned on{" "}
                            {new Date(secondaryDriver.assignedAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPickerSlot("SECONDARY")}
                        className="h-7 text-xs gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={detachingDriverId === secondaryDriver.id}
                        onClick={() => handleDetachDriver(secondaryDriver.id, "Secondary")}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                      >
                        {detachingDriverId === secondaryDriver.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlink className="h-3 w-3" />
                        )}
                        Detach
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-background/50">
                    <span className="text-xs text-muted-foreground">
                      No secondary driver assigned. Available for relief shift driver.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPickerSlot("SECONDARY")}
                      className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign Secondary Driver
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* DRIVER PICKER DRAWER */
            <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {pickerSlot === "PRIMARY" ? (
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                    )}
                    Select {pickerSlot} Driver from Available Pool
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Listing qualified active drivers currently in the Standalone Pool.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPickerSlot(null)}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, driver ID, or license number..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="pl-8.5 h-8 text-xs bg-background"
                />
              </div>

              {/* Drivers List */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {isLoadingStandalone ? (
                  <div className="p-6 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading available drivers...</span>
                  </div>
                ) : filteredStandalone.length === 0 ? (
                  <div className="p-6 text-center border border-dashed rounded-lg text-xs text-muted-foreground">
                    {pickerSearch
                      ? "No matching available drivers found."
                      : "No drivers currently available in the Standalone Pool. Register a new driver or detach one first."}
                  </div>
                ) : (
                  filteredStandalone.map((driver) => (
                    <div
                      key={driver.id}
                      className="p-2.5 rounded-lg border bg-background flex items-center justify-between hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {driver.profilePicture ? (
                          <img
                            src={driver.profilePicture}
                            alt={driver.firstName}
                            className="h-9 w-9 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                            {driver.firstName[0]}
                            {driver.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {driver.lastName}, {driver.firstName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                            <span>{driver.driverId || "No ID"}</span>
                            <span>•</span>
                            <span>{driver.licenseNo}</span>
                            <span>•</span>
                            <span>{driver.contactNo}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleAssignDriver(driver)}
                        className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-medium"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        Assign
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
