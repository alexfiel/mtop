"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  User,
  ShieldCheck,
  Hash,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  Eye,
} from "lucide-react";
import { VehicleItem } from "../types";

interface VehicleDetailModalProps {
  vehicle: VehicleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (vehicle: VehicleItem) => void;
}

export function VehicleDetailModal({
  vehicle,
  open,
  onOpenChange,
  onEdit,
}: VehicleDetailModalProps) {
  if (!vehicle) return null;

  const assignedFranchise = vehicle.newFranchise || vehicle.operator?.newFranchise;
  const isFranchiseActive = assignedFranchise?.isActive;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* HEADER */}
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Car className="h-6 w-6" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>{vehicle.make} {vehicle.model}</span>
                  <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                    {vehicle.year}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Official Motorized Tricycle Registry Record • LGU Tagbilaran City
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6">
          {/* TOP HIGHLIGHT CARDS: LICENSE PLATE & FRANCHISE BADGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PHILIPPINE TRICYCLE LICENSE PLATE BADGE */}
            <div className="relative rounded-xl border-2 border-border bg-gradient-to-b from-card to-muted/40 p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-between w-full px-2 mb-1">
                <div className="h-2 w-2 rounded-full border border-muted-foreground/50 bg-background" />
                <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground font-mono">
                  TAGBILARAN CITY MTOP
                </span>
                <div className="h-2 w-2 rounded-full border border-muted-foreground/50 bg-background" />
              </div>
              <div className="my-1">
                <span className="font-mono text-3xl font-black tracking-widest text-foreground select-all">
                  {vehicle.plateNumber}
                </span>
              </div>
              <div className="flex items-center justify-between w-full px-2 mt-1">
                <span className="text-[8px] font-mono uppercase text-muted-foreground">NCR/R7</span>
                <span className="text-[9px] font-semibold tracking-wider uppercase text-primary">
                  MOTORIZED TRICYCLE
                </span>
                <span className="text-[8px] font-mono text-muted-foreground">{vehicle.year}</span>
              </div>
            </div>

            {/* FRANCHISE BODY STATUS CARD */}
            <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  Franchise Assignment
                </span>
                {assignedFranchise ? (
                  <Badge
                    variant={isFranchiseActive ? "default" : "secondary"}
                    className={`text-[10px] font-mono ${
                      isFranchiseActive
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                        : "bg-amber-500 hover:bg-amber-500 text-white"
                    }`}
                  >
                    {isFranchiseActive ? "ACTIVE FRANCHISE" : "INACTIVE"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                    UNASSIGNED
                  </Badge>
                )}
              </div>

              <div className="my-2">
                {assignedFranchise ? (
                  <div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      Body #{assignedFranchise.franchiseBodyNumber}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Zone / Route: {assignedFranchise.zone || "Tagbilaran City Wide"}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      No Franchise Body Assigned
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Eligible for assignment in Franchise Management
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground border-t pt-2 flex items-center justify-between">
                <span>Registration Status:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Enrolled
                </span>
              </div>
            </div>
          </div>

          {/* SPECIFICATIONS SECTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Official LTO Vehicle Credentials & Serial Numbers
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 border rounded-xl p-3.5">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Make</span>
                <div className="text-xs font-bold text-foreground mt-0.5">{vehicle.make}</div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Model</span>
                <div className="text-xs font-bold text-foreground mt-0.5">{vehicle.model}</div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Year Model</span>
                <div className="text-xs font-mono font-bold text-foreground mt-0.5">{vehicle.year}</div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Color Scheme</span>
                <div className="text-xs font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-border bg-primary/60 inline-block" />
                  {vehicle.color}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20 border rounded-xl p-3.5">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">LTO CR / Reg Number</span>
                <div className="text-xs font-mono font-bold text-foreground mt-0.5 select-all">
                  {vehicle.registrationNumber}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Engine Serial Number</span>
                <div className="text-xs font-mono font-bold text-foreground mt-0.5 select-all">
                  {vehicle.engineNumber}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Chassis / Frame Number</span>
                <div className="text-xs font-mono font-bold text-foreground mt-0.5 select-all">
                  {vehicle.chassisNumber}
                </div>
              </div>
            </div>
          </div>

          {/* OWNERSHIP & OPERATOR LINKAGE SECTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" />
              Ownership & Linked Operator Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Registered Ownership Details */}
              <div className="border rounded-xl p-3.5 bg-card space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  1. Registered Certificate Owner
                </span>
                <div>
                  <div className="text-sm font-bold text-foreground">{vehicle.registeredOwnerName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{vehicle.registeredAddress}</span>
                  </div>
                </div>
              </div>

              {/* Linked Operator Account */}
              <div className="border rounded-xl p-3.5 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    2. Official MTOP Operator
                  </span>
                  {vehicle.operator && (
                    <Badge variant="outline" className="text-[9px] font-mono text-primary border-primary/30">
                      {vehicle.operator.operatorId}
                    </Badge>
                  )}
                </div>

                {vehicle.operator ? (
                  <div>
                    <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      {vehicle.operator.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      {vehicle.operator.mobileNo && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {vehicle.operator.mobileNo}
                        </span>
                      )}
                      <span>•</span>
                      <span className="truncate max-w-[180px]">{vehicle.operator.address}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No operator linked to this unit.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VEHICLE PHOTOGRAPH & LTO REGULATORY DOCUMENTS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-primary" />
              Vehicle Photograph & Official LTO Documents
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Vehicle Photo */}
              <div className="border rounded-xl p-3 bg-card flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <Car className="h-3 w-3 text-primary" />
                      Vehicle Unit Photo
                    </span>
                    {vehicle.vehicleImage ? (
                      <Badge variant="outline" className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                        None
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Physical tricycle inspection snapshot</p>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border flex items-center justify-center">
                  {vehicle.vehicleImage ? (
                    <img
                      src={vehicle.vehicleImage}
                      alt={`${vehicle.plateNumber} unit`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(vehicle.vehicleImage!, "_blank")}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-2 text-center">
                      <Car className="h-6 w-6" />
                      <span className="text-[10px] mt-1">No photo captured</span>
                    </div>
                  )}
                </div>

                {vehicle.vehicleImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-6.5 text-[10px] gap-1"
                    onClick={() => window.open(vehicle.vehicleImage!, "_blank")}
                  >
                    <Eye className="h-3 w-3" />
                    Open Photo
                  </Button>
                )}
              </div>

              {/* LTO Certificate of Registration (CR) */}
              <div className="border rounded-xl p-3 bg-card flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3 text-primary" />
                      LTO CR Document
                    </span>
                    {vehicle.ltoCrDocument ? (
                      <Badge variant="outline" className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Attached
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Certificate of Registration</p>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border flex items-center justify-center">
                  {vehicle.ltoCrDocument ? (
                    vehicle.ltoCrDocument.toLowerCase().endsWith(".pdf") ? (
                      <div className="flex flex-col items-center justify-center text-primary p-2">
                        <FileText className="h-7 w-7" />
                        <span className="text-[10px] font-mono mt-1 text-muted-foreground">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={vehicle.ltoCrDocument}
                        alt="LTO CR"
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(vehicle.ltoCrDocument!, "_blank")}
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-2 text-center">
                      <FileText className="h-6 w-6" />
                      <span className="text-[10px] mt-1">No CR scan</span>
                    </div>
                  )}
                </div>

                {vehicle.ltoCrDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-6.5 text-[10px] gap-1"
                    onClick={() => window.open(vehicle.ltoCrDocument!, "_blank")}
                  >
                    <Eye className="h-3 w-3" />
                    View CR Scan
                  </Button>
                )}
              </div>

              {/* LTO Official Receipt (OR) */}
              <div className="border rounded-xl p-3 bg-card flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3 text-primary" />
                      LTO OR Document
                    </span>
                    {vehicle.ltoOrDocument ? (
                      <Badge variant="outline" className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Attached
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Latest Official Receipt</p>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border flex items-center justify-center">
                  {vehicle.ltoOrDocument ? (
                    vehicle.ltoOrDocument.toLowerCase().endsWith(".pdf") ? (
                      <div className="flex flex-col items-center justify-center text-primary p-2">
                        <FileText className="h-7 w-7" />
                        <span className="text-[10px] font-mono mt-1 text-muted-foreground">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={vehicle.ltoOrDocument}
                        alt="LTO OR"
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(vehicle.ltoOrDocument!, "_blank")}
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-2 text-center">
                      <FileText className="h-6 w-6" />
                      <span className="text-[10px] mt-1">No OR scan</span>
                    </div>
                  )}
                </div>

                {vehicle.ltoOrDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-6.5 text-[10px] gap-1"
                    onClick={() => window.open(vehicle.ltoOrDocument!, "_blank")}
                  >
                    <Eye className="h-3 w-3" />
                    View OR Scan
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* AUDIT TIMESTAMPS */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Enrolled: {new Date(vehicle.createdAt).toLocaleDateString()} at{" "}
              {new Date(vehicle.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="font-mono text-[10px]">
              ID: {vehicle.id}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Record
          </Button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(vehicle);
                }}
                className="text-xs"
              >
                Edit Specs
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
