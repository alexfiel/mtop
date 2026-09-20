"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Car, Loader2, ShieldCheck, User, Search, PlusCircle } from "lucide-react";
import { enrollMTOPVehicle } from "../actions";
import type { MTOPVehicleInput, OperatorOption } from "../types";
import { EnrollVehicleForm } from "./enroll-vehicle-form";

export type { OperatorOption };

export interface EnrollVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operators?: OperatorOption[] | any[];
  preselectedOperatorId?: string;
  onSuccess?: () => void;
}

export function EnrollVehicleModal({
  open,
  onOpenChange,
  operators = [],
  preselectedOperatorId,
  onSuccess,
}: EnrollVehicleModalProps) {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(preselectedOperatorId || "");
  const [operatorSearch, setOperatorSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Form State strictly adhering to Prisma model MTOPVehicle
  const [vehicleData, setVehicleData] = useState<MTOPVehicleInput>({
    registeredOwnerName: "",
    registeredAddress: "",
    make: "Honda",
    model: "TMX 125",
    year: new Date().getFullYear(),
    plateNumber: "",
    engineNumber: "",
    chassisNumber: "",
    color: "White/Blue",
    registrationNumber: "",
    vehicleImage: "",
    ltoCrDocument: "",
    ltoOrDocument: "",
  });

  const selectedOperator = operators.find((op) => op.id === selectedOperatorId);

  // Filter operators by search
  const filteredOperators = operators.filter((op) => {
    if (!operatorSearch.trim()) return true;
    const term = operatorSearch.toLowerCase();
    return (
      op.name?.toLowerCase().includes(term) ||
      op.operatorId?.toLowerCase().includes(term) ||
      op.mobileNo?.includes(term)
    );
  });

  // When selected operator changes, auto-populate registered owner and address
  useEffect(() => {
    if (selectedOperator) {
      setVehicleData((prev) => ({
        ...prev,
        operatorId: selectedOperator.id,
        registeredOwnerName: prev.registeredOwnerName || selectedOperator.name,
        registeredAddress: prev.registeredAddress || selectedOperator.address || "",
      }));
    }
  }, [selectedOperatorId, selectedOperator]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setSelectedOperatorId(preselectedOperatorId || "");
      setOperatorSearch("");
      setVehicleData({
        registeredOwnerName: "",
        registeredAddress: "",
        make: "Honda",
        model: "TMX 125",
        year: new Date().getFullYear(),
        plateNumber: "",
        engineNumber: "",
        chassisNumber: "",
        color: "White/Blue",
        registrationNumber: "",
        vehicleImage: "",
        ltoCrDocument: "",
        ltoOrDocument: "",
      });
    }
  }, [open, preselectedOperatorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOperatorId) {
      toast.error("Please select an operator to associate with this vehicle.");
      return;
    }

    if (!vehicleData.registeredOwnerName?.trim() || !vehicleData.registeredAddress?.trim()) {
      toast.error("Registered Owner Name and Address are required.");
      return;
    }

    if (!vehicleData.plateNumber?.trim()) {
      toast.error("Plate Number is required.");
      return;
    }

    if (!vehicleData.registrationNumber?.trim()) {
      toast.error("Registration / CR Number is required.");
      return;
    }

    if (!vehicleData.engineNumber?.trim() || !vehicleData.chassisNumber?.trim()) {
      toast.error("Engine Number and Chassis Number are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await enrollMTOPVehicle({
        ...vehicleData,
        operatorId: selectedOperatorId,
      });

      if (res.success) {
        toast.success(
          `Vehicle ${vehicleData.plateNumber.toUpperCase()} successfully enrolled for ${selectedOperator?.name}!`
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.error || "Failed to enroll vehicle.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <form onSubmit={handleSubmit}>
          {/* MODAL HEADER */}
          <DialogHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Enroll New MTOP Vehicle
                  <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                    Prisma MTOPVehicle
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Register a motorized tricycle unit into the official MTOP registry linked to an operator
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* MODAL BODY */}
          <div className="p-5 space-y-5">
            {/* OPERATOR SELECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Select Registered Operator *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {operators.length} eligible operators without vehicle
                </span>
              </div>

              {/* Operator Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  placeholder="Search operator by name or OP-ID..."
                  className="pl-8.5 h-8.5 text-xs bg-background"
                />
              </div>

              {/* Operator Dropdown */}
              {filteredOperators.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto border rounded-xl p-2 bg-muted/10 divide-y divide-border/50">
                  {filteredOperators.map((op) => {
                    const isSelected = op.id === selectedOperatorId;
                    return (
                      <div
                        key={op.id}
                        onClick={() => setSelectedOperatorId(op.id)}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors text-xs ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30 text-primary font-medium"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{op.name}</span>
                          <span className="text-[11px] font-mono text-muted-foreground">({op.operatorId})</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate max-w-xs">{op.address}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  {operators.length === 0
                    ? "All registered operators already have an enrolled vehicle."
                    : "No operators match your search query."}
                </div>
              )}

              {selectedOperator && (
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>
                      Selected: <strong>{selectedOperator.name}</strong> ({selectedOperator.operatorId})
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                    Ready for Enrollment
                  </Badge>
                </div>
              )}
            </div>

            {/* EMBEDDED MTOP VEHICLE FORM */}
            <div className="pt-2 border-t">
              <EnrollVehicleForm
                data={vehicleData}
                onChange={(updated) =>
                  setVehicleData((prev) => ({
                    ...prev,
                    ...updated,
                  }))
                }
                operatorName={selectedOperator?.name}
                operatorAddress={selectedOperator?.address}
              />
            </div>
          </div>

          {/* MODAL FOOTER */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedOperatorId}
              className="gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enrolling Vehicle...
                </>
              ) : (
                <>
                  <PlusCircle className="h-3.5 w-3.5" />
                  Enroll MTOP Vehicle
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
