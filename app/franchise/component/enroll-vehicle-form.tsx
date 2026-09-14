"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, ShieldCheck, FileText, UserCheck, Hash } from "lucide-react";
import { MTOPVehicleInput } from "../actions";

interface EnrollVehicleFormProps {
  data: MTOPVehicleInput;
  onChange: (updated: Partial<MTOPVehicleInput>) => void;
  operatorName?: string;
  operatorAddress?: string;
}

/**
 * Reusable vehicle enrollment form strictly aligned with Prisma model MTOPVehicle
 */
export function EnrollVehicleForm({
  data,
  onChange,
  operatorName,
  operatorAddress,
}: EnrollVehicleFormProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-2xs">
      <div className="flex items-center justify-between border-b pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Car className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Enroll New MTOP Vehicle (Model: MTOPVehicle)
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Official motorized tricycle registration compliant with Tagbilaran City ordinance
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
          Prisma MTOPVehicle
        </Badge>
      </div>

      {/* SECTION 1: REGISTERED OWNERSHIP CREDENTIALS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            1. Registered Ownership Credentials
          </span>
          {operatorName && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  registeredOwnerName: operatorName,
                  registeredAddress: operatorAddress || data.registeredAddress,
                })
              }
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Use Operator Name & Address
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="registeredOwnerName" className="text-[11px] font-semibold text-foreground">
              Registered Owner Name *
            </Label>
            <Input
              id="registeredOwnerName"
              value={data.registeredOwnerName}
              onChange={(e) => onChange({ registeredOwnerName: e.target.value })}
              placeholder="Full name as indicated on LTO Certificate of Registration"
              className="h-8.5 text-xs font-medium bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="registeredAddress" className="text-[11px] font-semibold text-foreground">
              Registered Address *
            </Label>
            <Input
              id="registeredAddress"
              value={data.registeredAddress}
              onChange={(e) => onChange({ registeredAddress: e.target.value })}
              placeholder="Complete address (Barangay, City/Municipality)"
              className="h-8.5 text-xs bg-background"
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: VEHICLE SPECIFICATIONS */}
      <div className="space-y-2.5 pt-2 border-t">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-primary" />
          2. Vehicle Specifications
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label htmlFor="make" className="text-[11px] font-semibold text-foreground">
              Make *
            </Label>
            <Input
              id="make"
              value={data.make}
              onChange={(e) => onChange({ make: e.target.value })}
              placeholder="e.g. Honda, Kawasaki"
              className="h-8.5 text-xs font-medium bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="model" className="text-[11px] font-semibold text-foreground">
              Model *
            </Label>
            <Input
              id="model"
              value={data.model}
              onChange={(e) => onChange({ model: e.target.value })}
              placeholder="e.g. TMX 125, Barako"
              className="h-8.5 text-xs font-medium bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="year" className="text-[11px] font-semibold text-foreground">
              Year Model *
            </Label>
            <Input
              id="year"
              type="number"
              min={1990}
              max={new Date().getFullYear() + 1}
              value={data.year}
              onChange={(e) => onChange({ year: Number(e.target.value) || new Date().getFullYear() })}
              className="h-8.5 text-xs font-mono font-medium bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="color" className="text-[11px] font-semibold text-foreground">
              Color Scheme *
            </Label>
            <Input
              id="color"
              value={data.color}
              onChange={(e) => onChange({ color: e.target.value })}
              placeholder="e.g. White / Blue"
              className="h-8.5 text-xs bg-background"
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: LTO IDENTIFICATION & CERTIFICATE CREDENTIALS */}
      <div className="space-y-2.5 pt-2 border-t">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          3. Official LTO Registration & Numbers
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="plateNumber" className="text-[11px] font-semibold text-foreground">
                Plate Number *
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">Unique Key</span>
            </div>
            <Input
              id="plateNumber"
              value={data.plateNumber}
              onChange={(e) => onChange({ plateNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. 7102-TF / MV File No."
              className="h-8.5 text-xs font-mono font-bold uppercase tracking-wider bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="registrationNumber" className="text-[11px] font-semibold text-foreground">
                LTO CR / Registration Number *
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">Unique Key</span>
            </div>
            <Input
              id="registrationNumber"
              value={data.registrationNumber}
              onChange={(e) => onChange({ registrationNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. CR-8940-2026-01"
              className="h-8.5 text-xs font-mono uppercase bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="engineNumber" className="text-[11px] font-semibold text-foreground">
              Engine Serial Number *
            </Label>
            <Input
              id="engineNumber"
              value={data.engineNumber}
              onChange={(e) => onChange({ engineNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. KC05E-991244"
              className="h-8.5 text-xs font-mono uppercase bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="chassisNumber" className="text-[11px] font-semibold text-foreground">
              Chassis / Frame Number *
            </Label>
            <Input
              id="chassisNumber"
              value={data.chassisNumber}
              onChange={(e) => onChange({ chassisNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. KC05-992144"
              className="h-8.5 text-xs font-mono uppercase bg-background"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
