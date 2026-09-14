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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShieldCheck,
  User,
  Car,
  CheckCircle2,
  PlusCircle,
  Loader2,
  Search,
  ChevronRight,
} from "lucide-react";
import { assignOperatorAndVehicle, MTOPVehicleInput } from "../actions";
import { EnrollVehicleForm } from "./enroll-vehicle-form";

interface FranchiseAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchise: any | null;
  availableOperators: any[];
  availableVehicles: any[];
  onSuccess: () => void;
}

export function FranchiseAssignModal({
  open,
  onOpenChange,
  franchise,
  availableOperators,
  availableVehicles,
  onSuccess,
}: FranchiseAssignModalProps) {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
  const [operatorSearch, setOperatorSearch] = useState<string>("");

  // Vehicle mode: "operator_existing" (if operator has one), "pool", or "new" (Prisma MTOPVehicle)
  const [vehicleMode, setVehicleMode] = useState<"operator_existing" | "pool" | "new">("new");
  const [selectedPoolVehicleId, setSelectedPoolVehicleId] = useState<string>("");

  // Prisma model MTOPVehicle state
  const [newVehicleData, setNewVehicleData] = useState<MTOPVehicleInput>({
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
  });

  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Selected operator object
  const selectedOperator = availableOperators.find((op) => op.id === selectedOperatorId);

  // Auto-detect if operator already has a vehicle & sync registered owner name/address
  useEffect(() => {
    if (selectedOperator) {
      setNewVehicleData((prev) => ({
        ...prev,
        registeredOwnerName: prev.registeredOwnerName || selectedOperator.name,
        registeredAddress: prev.registeredAddress || selectedOperator.address,
      }));

      if (selectedOperator.vehicle) {
        setVehicleMode("operator_existing");
      } else if (availableVehicles.length > 0) {
        setVehicleMode("pool");
        setSelectedPoolVehicleId(availableVehicles[0].id);
      } else {
        setVehicleMode("new");
      }
    }
  }, [selectedOperatorId, selectedOperator, availableVehicles]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setSelectedOperatorId("");
      setOperatorSearch("");
      setRemarks("");
      setNewVehicleData({
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
      });
    }
  }, [open]);

  // Filtered operators
  const filteredOperators = availableOperators.filter((op) => {
    const term = operatorSearch.toLowerCase();
    return (
      op.name.toLowerCase().includes(term) ||
      op.operatorId.toLowerCase().includes(term) ||
      op.mobileNo.includes(term) ||
      op.email.toLowerCase().includes(term)
    );
  });

  const handleAssign = async () => {
    if (!franchise) return;
    if (!selectedOperatorId) {
      toast.error("Please select an operator to assign to this franchise.");
      return;
    }

    let payload: any = {
      franchiseId: franchise.id,
      operatorId: selectedOperatorId,
      remarks: remarks.trim() || undefined,
    };

    if (vehicleMode === "operator_existing" && selectedOperator?.vehicle) {
      payload.mtopVehicleId = selectedOperator.vehicle.id;
    } else if (vehicleMode === "pool" && selectedPoolVehicleId) {
      payload.mtopVehicleId = selectedPoolVehicleId;
    } else if (vehicleMode === "new") {
      // Validate MTOPVehicle model fields
      if (!newVehicleData.registeredOwnerName?.trim() || !newVehicleData.registeredAddress?.trim()) {
        toast.error("Please provide Registered Owner Name and Address (MTOPVehicle).");
        return;
      }
      if (!newVehicleData.plateNumber?.trim()) {
        toast.error("Please provide the vehicle Plate Number.");
        return;
      }
      if (!newVehicleData.registrationNumber?.trim()) {
        toast.error("Please provide the LTO Registration / CR Number.");
        return;
      }
      if (!newVehicleData.engineNumber?.trim() || !newVehicleData.chassisNumber?.trim()) {
        toast.error("Please provide Engine and Chassis Numbers.");
        return;
      }

      payload.newVehicle = {
        ...newVehicleData,
        operatorId: selectedOperatorId,
      };
    }

    setLoading(true);
    try {
      const res = await assignOperatorAndVehicle(payload);
      if (res.success) {
        toast.success(
          `Franchise Body #${franchise.franchiseBodyNumber} successfully assigned to ${selectedOperator?.name}!`
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to complete assignment.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl">
                Assign Operator & Vehicle
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pair unassigned Franchise{" "}
                <strong className="text-foreground font-mono font-bold">
                  Body #{franchise?.franchiseBodyNumber}
                </strong>{" "}
                ({franchise?.zone || "Tagbilaran City"}) with an authorized operator and MTOP tricycle.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* STEP 1: SELECT OPERATOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[10px] text-white font-mono">
                  1
                </span>
                Select Municipal Operator *
              </Label>
              <span className="text-xs text-muted-foreground">
                {availableOperators.length} unassigned operator(s) available
              </span>
            </div>

            {/* Operator Search / Picker */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter operators by name, OP-ID, or phone..."
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {availableOperators.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center bg-muted/20">
                  <User className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No available operators found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All registered operators currently have an assigned franchise, or no operators are enrolled yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-xl bg-card">
                  {filteredOperators.map((op) => {
                    const isSelected = op.id === selectedOperatorId;
                    return (
                      <div
                        key={op.id}
                        onClick={() => setSelectedOperatorId(op.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border">
                          {op.profilePicture ? (
                            <img src={op.profilePicture} alt={op.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate text-foreground flex items-center gap-1">
                            {op.name}
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                          </div>
                          <div className="text-[10px] font-mono text-primary font-medium">{op.operatorId}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{op.mobileNo}</div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredOperators.length === 0 && (
                    <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                      No operators matching "{operatorSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: VEHICLE ATTACHMENT */}
          {selectedOperator && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[10px] text-white font-mono">
                    2
                  </span>
                  MTOP Tricycle Vehicle Assignment *
                </Label>
              </div>

              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2">
                {selectedOperator.vehicle && (
                  <Button
                    type="button"
                    size="sm"
                    variant={vehicleMode === "operator_existing" ? "default" : "outline"}
                    onClick={() => setVehicleMode("operator_existing")}
                    className="text-xs gap-1.5 h-8"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Operator's Registered Vehicle
                  </Button>
                )}
                {availableVehicles.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant={vehicleMode === "pool" ? "default" : "outline"}
                    onClick={() => setVehicleMode("pool")}
                    className="text-xs gap-1.5 h-8"
                  >
                    <Car className="h-3.5 w-3.5" />
                    Select from Pool ({availableVehicles.length})
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant={vehicleMode === "new" ? "default" : "outline"}
                  onClick={() => setVehicleMode("new")}
                  className="text-xs gap-1.5 h-8"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Enroll New Vehicle (MTOPVehicle)
                </Button>
              </div>

              {/* Option 1: Operator Existing Vehicle Preview */}
              {vehicleMode === "operator_existing" && selectedOperator.vehicle && (
                <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs font-bold bg-white text-emerald-700 border-emerald-300">
                        {selectedOperator.vehicle.plateNumber}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground">
                        {selectedOperator.vehicle.make} {selectedOperator.vehicle.model} ({selectedOperator.vehicle.year})
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                      <span>Owner: {selectedOperator.vehicle.registeredOwnerName || selectedOperator.name}</span>
                      <span>Color: {selectedOperator.vehicle.color}</span>
                      <span>CR: {selectedOperator.vehicle.registrationNumber}</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Verified Attached</Badge>
                </div>
              )}

              {/* Option 2: Pool Vehicle Selector */}
              {vehicleMode === "pool" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Choose an unassigned vehicle:</Label>
                  <select
                    className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary"
                    value={selectedPoolVehicleId}
                    onChange={(e) => setSelectedPoolVehicleId(e.target.value)}
                  >
                    {availableVehicles.map((veh) => (
                      <option key={veh.id} value={veh.id}>
                        Plate: {veh.plateNumber} — {veh.make} {veh.model} ({veh.year}) | Owner: {veh.registeredOwnerName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Option 3: Refactored Enroll New Vehicle (Prisma MTOPVehicle) */}
              {vehicleMode === "new" && (
                <EnrollVehicleForm
                  data={newVehicleData}
                  onChange={(updated) =>
                    setNewVehicleData((prev) => ({
                      ...prev,
                      ...updated,
                    }))
                  }
                  operatorName={selectedOperator.name}
                  operatorAddress={selectedOperator.address}
                />
              )}
            </div>
          )}

          {/* STEP 3: REMARKS */}
          <div className="space-y-1.5 pt-2 border-t">
            <Label htmlFor="assignRemarks" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assignment Remarks (Optional)
            </Label>
            <Textarea
              id="assignRemarks"
              rows={2}
              placeholder="e.g. Assigned upon completion of inspection and Sanggunian clearance."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* VISUAL PAIRING SUMMARY */}
          {selectedOperator && (
            <div className="rounded-xl border bg-card p-3 shadow-xs flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono font-bold bg-primary/5 text-primary text-xs">
                  Body #{franchise?.franchiseBodyNumber}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{selectedOperator.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {vehicleMode === "operator_existing"
                    ? selectedOperator.vehicle?.plateNumber
                    : vehicleMode === "new"
                    ? newVehicleData.plateNumber || "New MTOPVehicle"
                    : "Pool Vehicle"}
                </span>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px]">Ready to Assign</Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
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
            onClick={handleAssign}
            disabled={loading || !selectedOperatorId}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm & Complete Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
