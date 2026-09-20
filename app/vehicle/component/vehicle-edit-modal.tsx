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
import { Car, Loader2, Save, X, Camera } from "lucide-react";
import { updateVehicle } from "../actions";
import { VehicleItem, VehicleUpdateInput } from "../types";
import { VehicleMediaUploader } from "./vehicle-media-uploader";

interface VehicleEditModalProps {
  vehicle: VehicleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VehicleEditModal({
  vehicle,
  open,
  onOpenChange,
  onSuccess,
}: VehicleEditModalProps) {
  const [formData, setFormData] = useState<VehicleUpdateInput>({
    registeredOwnerName: "",
    registeredAddress: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    plateNumber: "",
    engineNumber: "",
    chassisNumber: "",
    color: "",
    registrationNumber: "",
    vehicleImage: "",
    ltoCrDocument: "",
    ltoOrDocument: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registeredOwnerName: vehicle.registeredOwnerName || "",
        registeredAddress: vehicle.registeredAddress || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        plateNumber: vehicle.plateNumber || "",
        engineNumber: vehicle.engineNumber || "",
        chassisNumber: vehicle.chassisNumber || "",
        color: vehicle.color || "",
        registrationNumber: vehicle.registrationNumber || "",
        vehicleImage: vehicle.vehicleImage || "",
        ltoCrDocument: vehicle.ltoCrDocument || "",
        ltoOrDocument: vehicle.ltoOrDocument || "",
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    if (!formData.plateNumber?.trim()) {
      toast.error("Plate Number is required.");
      return;
    }
    if (!formData.registrationNumber?.trim()) {
      toast.error("Registration / CR Number is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateVehicle(vehicle.id, formData);
      if (res.success) {
        toast.success(`Vehicle ${formData.plateNumber?.toUpperCase()} updated successfully.`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to update vehicle.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <DialogHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Edit Vehicle Specifications
                  <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                    {vehicle?.plateNumber}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Update official motorized tricycle credentials in the Tagbilaran MTOP registry
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* FORM BODY */}
          <div className="p-5 space-y-4">
            {/* OWNERSHIP CREDENTIALS */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                1. Registered Ownership Credentials
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-owner" className="text-xs font-semibold">
                    Registered Owner Name *
                  </Label>
                  <Input
                    id="edit-owner"
                    value={formData.registeredOwnerName}
                    onChange={(e) => setFormData({ ...formData, registeredOwnerName: e.target.value })}
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-address" className="text-xs font-semibold">
                    Registered Address *
                  </Label>
                  <Input
                    id="edit-address"
                    value={formData.registeredAddress}
                    onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* VEHICLE SPECIFICATIONS */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                2. Vehicle Specifications
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-make" className="text-xs font-semibold">
                    Make *
                  </Label>
                  <Input
                    id="edit-make"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-model" className="text-xs font-semibold">
                    Model *
                  </Label>
                  <Input
                    id="edit-model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-year" className="text-xs font-semibold">
                    Year *
                  </Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || 2024 })}
                    className="h-8.5 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-color" className="text-xs font-semibold">
                    Color *
                  </Label>
                  <Input
                    id="edit-color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* LTO IDENTIFICATION */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                3. Official LTO Registration & Numbers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-plate" className="text-xs font-semibold">
                    Plate Number *
                  </Label>
                  <Input
                    id="edit-plate"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    className="h-8.5 text-xs font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-cr" className="text-xs font-semibold">
                    LTO CR / Reg Number *
                  </Label>
                  <Input
                    id="edit-cr"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                    className="h-8.5 text-xs font-mono uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-engine" className="text-xs font-semibold">
                    Engine Number *
                  </Label>
                  <Input
                    id="edit-engine"
                    value={formData.engineNumber}
                    onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value.toUpperCase() })}
                    className="h-8.5 text-xs font-mono uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-chassis" className="text-xs font-semibold">
                    Chassis Number *
                  </Label>
                  <Input
                    id="edit-chassis"
                    value={formData.chassisNumber}
                    onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value.toUpperCase() })}
                    className="h-8.5 text-xs font-mono uppercase"
                    required
                  />
                </div>
              </div>
            </div>

            {/* VEHICLE PHOTO & LTO REGULATORY DOCUMENTS */}
            <div className="space-y-3 pt-2 border-t">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-primary" />
                4. Vehicle Photograph & LTO Official Documents
              </span>

              <div className="space-y-3">
                <VehicleMediaUploader
                  label="Motorized Tricycle Photograph"
                  description="Clear snapshot or photo showing the front and side view of the tricycle unit"
                  value={formData.vehicleImage}
                  onChange={(url) => setFormData({ ...formData, vehicleImage: url })}
                  aspectMode="landscape"
                  iconType="car"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <VehicleMediaUploader
                    label="LTO Certificate of Registration (CR)"
                    description="Official CR document issued by LTO"
                    value={formData.ltoCrDocument}
                    onChange={(url) => setFormData({ ...formData, ltoCrDocument: url })}
                    aspectMode="document"
                    iconType="document"
                  />

                  <VehicleMediaUploader
                    label="LTO Official Receipt (OR)"
                    description="Valid official receipt for registration dues"
                    value={formData.ltoOrDocument}
                    onChange={(url) => setFormData({ ...formData, ltoOrDocument: url })}
                    aspectMode="document"
                    iconType="document"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
