"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  Hash,
  FileText,
  Printer,
  ExternalLink,
  Layers,
  AlertCircle,
  X,
  Users,
  Star,
  Unlink,
  UserPlus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { detachDriver } from "@/app/driver/actions";
import { UnitDriversModal } from "@/app/driver/component/unit-drivers-modal";

interface OperatorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator: any | null;
  onRefresh?: () => void;
}

export function OperatorDetailModal({
  open,
  onOpenChange,
  operator,
  onRefresh,
}: OperatorDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [unitDriversModalOpen, setUnitDriversModalOpen] = useState<boolean>(false);
  const [detachingDriverId, setDetachingDriverId] = useState<string | null>(null);

  if (!operator) return null;

  // Resolve vehicle (from operator.vehicle or operator.newFranchise?.mtopVehicle)
  const vehicle = operator.vehicle || operator.newFranchise?.mtopVehicle;
  const franchise = operator.newFranchise;

  // Resolve assigned drivers (max 2)
  const drivers: any[] = operator.drivers || [];
  const primaryDriver =
    drivers.find((d: any) => d.driverRole === "PRIMARY") ||
    (drivers.length > 0 && drivers.every((d: any) => d.driverRole !== "PRIMARY") ? drivers[0] : null);

  const secondaryDriver =
    drivers.find((d: any) => d.driverRole === "SECONDARY") ||
    (drivers.length > 1 && primaryDriver ? drivers.find((d: any) => d.id !== primaryDriver.id) : null);

  const handleDetachDriver = async (driverId: string, driverName: string) => {
    if (
      !confirm(
        `Are you sure you want to detach driver "${driverName}" from ${operator.name}? The driver will return to the standalone unassigned pool.`
      )
    ) {
      return;
    }
    setDetachingDriverId(driverId);
    try {
      const res = await detachDriver(driverId);
      if (res.success) {
        toast.success(`${driverName} detached and returned to Standalone Pool.`);
        router.refresh();
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to detach driver.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setDetachingDriverId(null);
    }
  };

  // Compute age
  const birthDate = operator.dateOfBirth ? new Date(operator.dateOfBirth) : null;
  const age = birthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (date: any) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          {/* HEADER BANNER */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b p-6 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Profile Photo */}
                <div
                  onClick={() =>
                    operator.profilePicture &&
                    setSelectedImage({
                      url: operator.profilePicture,
                      title: `Biometric Photo: ${operator.name}`,
                    })
                  }
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 border-primary/20 bg-background shadow-xs flex items-center justify-center shrink-0 ${
                    operator.profilePicture ? "cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" : ""
                  }`}
                >
                  {operator.profilePicture ? (
                    <img
                      src={operator.profilePicture}
                      alt={operator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>

                {/* Name & Identifiers */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      {operator.name}
                    </h2>
                    {operator.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[11px] px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Active Operator
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="h-3 w-3" /> {operator.status}
                      </Badge>
                    )}
                    {operator.isVerified && (
                      <Badge variant="outline" className="text-[11px] text-primary border-primary/30 font-medium">
                        <ShieldCheck className="h-3 w-3 mr-1 text-primary" /> Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-primary">
                      {operator.operatorId}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {operator.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Quick Badges */}
              <div className="flex sm:flex-col items-end gap-2 text-right">
                {franchise ? (
                  <Badge className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono text-xs px-2.5 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Body #{franchise.franchiseBodyNumber}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                    No Franchise Attached
                  </Badge>
                )}

                {vehicle ? (
                  <Badge className="bg-primary/10 hover:bg-primary/15 text-primary border border-primary/30 font-mono text-xs px-2.5 py-1">
                    <Car className="h-3.5 w-3.5 mr-1" />
                    Plate: {vehicle.plateNumber}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                    No Vehicle Attached
                  </Badge>
                )}

                <Badge
                  variant={drivers.length > 0 ? "secondary" : "outline"}
                  className={`text-xs px-2.5 py-1 ${
                    drivers.length === 2
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : drivers.length === 1
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                      : "text-muted-foreground border-dashed"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {drivers.length}/2 Drivers Assigned
                </Badge>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="mt-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full sm:w-[480px] bg-muted/60 p-1">
                  <TabsTrigger value="profile" className="text-xs font-semibold gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Profile & ID
                  </TabsTrigger>
                  <TabsTrigger value="vehicle" className="text-xs font-semibold gap-1.5">
                    <Car className="h-3.5 w-3.5" />
                    Vehicle {vehicle && "✓"}
                  </TabsTrigger>
                  <TabsTrigger value="franchise" className="text-xs font-semibold gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Franchise {franchise && "✓"}
                  </TabsTrigger>
                  <TabsTrigger value="drivers" className="text-xs font-semibold gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Drivers ({drivers.length}/2)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* TAB 1: OPERATOR PROFILE & CREDENTIALS */}
          {activeTab === "profile" && (
            <div className="p-6 space-y-6">
              {/* Personal Information Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information & Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">Full Legal Name</span>
                    <p className="text-sm font-semibold text-foreground">{operator.name}</p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">Date of Birth & Age</span>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(operator.dateOfBirth)} {age !== null ? `(${age} y/o)` : ""}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">Mobile Contact</span>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {operator.mobileNo}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">Email Address</span>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {operator.email}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1 sm:col-span-2">
                    <span className="text-[11px] text-muted-foreground">Registered Residence Address</span>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {operator.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Government Valid ID Credential */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Official Government Identification Credential
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">Valid ID Type</span>
                    <p className="text-sm font-semibold text-foreground">{operator.validIDType}</p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">ID / Serial Number</span>
                    <p className="text-sm font-mono font-semibold text-primary">{operator.validIDNumber}</p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                    <span className="text-[11px] text-muted-foreground">Expiry Date</span>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(operator.validIDExpiryDate)}
                    </p>
                  </div>
                </div>

                {/* ID Document Scans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-3 rounded-xl border bg-muted/10 space-y-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Valid ID Document (Front)
                    </span>
                    {operator.validIdFront ? (
                      <div
                        onClick={() =>
                          setSelectedImage({
                            url: operator.validIdFront,
                            title: `Valid ID Front: ${operator.validIDType}`,
                          })
                        }
                        className="h-40 rounded-lg overflow-hidden border bg-background flex items-center justify-center cursor-pointer group hover:ring-2 hover:ring-primary/40 transition-all"
                      >
                        <img
                          src={operator.validIdFront}
                          alt="ID Front"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-32 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                        <CreditCard className="h-6 w-6 text-muted-foreground/40" />
                        <span>No Front ID image uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl border bg-muted/10 space-y-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Valid ID Document (Back)
                    </span>
                    {operator.validIdBack ? (
                      <div
                        onClick={() =>
                          setSelectedImage({
                            url: operator.validIdBack,
                            title: `Valid ID Back: ${operator.validIDType}`,
                          })
                        }
                        className="h-40 rounded-lg overflow-hidden border bg-background flex items-center justify-center cursor-pointer group hover:ring-2 hover:ring-primary/40 transition-all"
                      >
                        <img
                          src={operator.validIdBack}
                          alt="ID Back"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-32 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                        <CreditCard className="h-6 w-6 text-muted-foreground/40" />
                        <span>No Back ID image uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Administrative Audit Info */}
              <div className="space-y-2.5 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  System Audit & Verification Trail
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg border bg-muted/10">
                    <span className="text-[10px] text-muted-foreground block">Encoded By</span>
                    <span className="font-semibold">{operator.encodedBy || "System Admin"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/10">
                    <span className="text-[10px] text-muted-foreground block">Encoded Date</span>
                    <span>{formatDateTime(operator.encodedDate || operator.createdAt)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/10">
                    <span className="text-[10px] text-muted-foreground block">Verified By</span>
                    <span>{operator.verifiedBy || "Pending Review"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/10">
                    <span className="text-[10px] text-muted-foreground block">Verification Date</span>
                    <span>{formatDateTime(operator.verifiedDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTACHED MTOP VEHICLE */}
          {activeTab === "vehicle" && (
            <div className="p-6 space-y-5">
              {vehicle ? (
                <div className="space-y-5">
                  {/* Vehicle Header Card */}
                  <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-3 rounded-xl bg-primary text-primary-foreground shadow-xs">
                        <Car className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-foreground">
                            {vehicle.make} {vehicle.model}
                          </h4>
                          <Badge variant="outline" className="font-mono text-xs font-bold bg-background text-primary border-primary/30">
                            {vehicle.plateNumber}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Year Model: {vehicle.year} • Color: {vehicle.color}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Attached to Operator
                      </Badge>
                    </div>
                  </div>

                  {/* Vehicle Specifications Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-primary" />
                      Vehicle Technical Specifications
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Make</span>
                        <p className="text-sm font-semibold text-foreground">{vehicle.make}</p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Model</span>
                        <p className="text-sm font-semibold text-foreground">{vehicle.model}</p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Year Model</span>
                        <p className="text-sm font-mono font-semibold text-foreground">{vehicle.year}</p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Color Scheme</span>
                        <p className="text-sm font-semibold text-foreground">{vehicle.color}</p>
                      </div>
                    </div>
                  </div>

                  {/* Official LTO Credentials */}
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      Official LTO Registration & Numbers
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Official Plate Number</span>
                        <p className="text-sm font-mono font-bold uppercase tracking-wider text-primary">
                          {vehicle.plateNumber}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">LTO CR / Registration Number</span>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {vehicle.registrationNumber}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Engine Serial Number</span>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {vehicle.engineNumber}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Chassis / Frame Number</span>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {vehicle.chassisNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registered Ownership Details */}
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      Vehicle Registered Ownership on File
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Registered Owner Name</span>
                        <p className="text-sm font-semibold text-foreground">{vehicle.registeredOwnerName}</p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Registered Address</span>
                        <p className="text-sm font-semibold text-foreground">{vehicle.registeredAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-4 rounded-xl border border-dashed text-center space-y-3">
                  <div className="p-3 rounded-full bg-muted/30 w-fit mx-auto text-muted-foreground">
                    <Car className="h-8 w-8" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-semibold text-foreground">No MTOP Vehicle Attached</h4>
                    <p className="text-xs text-muted-foreground">
                      This operator does not currently have a motorized tricycle registered under their profile.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/franchise">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-primary border-primary/30">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Enroll / Attach Vehicle in Franchise Portal
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTACHED FRANCHISE */}
          {activeTab === "franchise" && (
            <div className="p-6 space-y-5">
              {franchise ? (
                <div className="space-y-5">
                  {/* Franchise Card */}
                  <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-3 rounded-xl bg-amber-500 text-white shadow-xs">
                        <ShieldCheck className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-foreground">
                            Franchise Body #{franchise.franchiseBodyNumber}
                          </h4>
                          <Badge className="bg-amber-600 text-white text-xs font-mono">
                            Assigned Unit
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Zone: {franchise.zone || "Tagbilaran City"} • LGU Tagbilaran City MTOP Registry
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {franchise.isActive ? (
                        <Badge className="bg-emerald-600 text-white text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active Road Service
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inactive Status
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Franchise Details Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Franchise Registration & Assignment Record
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Franchise Body Number</span>
                        <p className="text-base font-mono font-bold text-primary">
                          #{franchise.franchiseBodyNumber}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Assigned Operational Zone</span>
                        <p className="text-sm font-semibold text-foreground">{franchise.zone || "Tagbilaran City"}</p>
                      </div>
                      <div className="p-3 rounded-xl border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground">Date of Assignment</span>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDateTime(franchise.assignedDate || franchise.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remarks & Notes */}
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      Administrative Assignment Remarks
                    </h4>
                    <div className="p-3 rounded-xl border bg-muted/10 text-xs text-muted-foreground font-mono leading-relaxed">
                      {franchise.remarks || "No specific administrative remarks recorded."}
                    </div>
                  </div>

                  {/* Shortcut to Franchise Module */}
                  <div className="pt-2 flex justify-end">
                    <Link href="/franchise">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Manage in Franchise Portal
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-4 rounded-xl border border-dashed text-center space-y-3">
                  <div className="p-3 rounded-full bg-muted/30 w-fit mx-auto text-muted-foreground">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-semibold text-foreground">No Franchise Body Number Assigned</h4>
                    <p className="text-xs text-muted-foreground">
                      This operator is currently unassigned and eligible to receive a franchise slot from the available body number pool.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/franchise">
                      <Button size="sm" className="gap-1.5 text-xs bg-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Go to Franchise Assignment
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASSIGNED DRIVERS (MAX 2) */}
          {activeTab === "drivers" && (
            <div className="p-6 space-y-6">
              {/* Header explanation & Action */}
              <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Assigned Motorized Tricycle Drivers
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {drivers.length}/2 Assigned
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per Tagbilaran City MTOP Ordinance, each operator can have a maximum of 2 assigned drivers: 1 Primary Driver and 1 Secondary / Relief Driver.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setUnitDriversModalOpen(true)}
                  className="gap-1.5 text-xs bg-primary hover:bg-primary/90 shrink-0"
                >
                  <Users className="h-3.5 w-3.5" />
                  Manage / Assign Drivers
                </Button>
              </div>

              {/* Two Slots Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SLOT 1: PRIMARY DRIVER */}
                <div className="rounded-xl border bg-card shadow-2xs overflow-hidden flex flex-col justify-between">
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      Slot 1: Primary Driver
                    </span>
                    {primaryDriver ? (
                      <Badge className="bg-amber-600 text-white text-[10px] px-2 py-0.5">
                        Occupied
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-dashed text-[10px] text-muted-foreground">
                        Vacant Slot
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-4 grow">
                    {primaryDriver ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div
                            onClick={() =>
                              primaryDriver.profilePicture &&
                              setSelectedImage({
                                url: primaryDriver.profilePicture,
                                title: `Primary Driver: ${primaryDriver.firstName} ${primaryDriver.lastName}`,
                              })
                            }
                            className={`w-14 h-14 rounded-xl overflow-hidden border bg-muted flex items-center justify-center shrink-0 ${
                              primaryDriver.profilePicture ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : ""
                            }`}
                          >
                            {primaryDriver.profilePicture ? (
                              <img
                                src={primaryDriver.profilePicture}
                                alt={primaryDriver.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-7 w-7 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {primaryDriver.firstName} {primaryDriver.middleName ? `${primaryDriver.middleName[0]}. ` : ""}{primaryDriver.lastName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                              {primaryDriver.driverId && (
                                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                                  {primaryDriver.driverId}
                                </Badge>
                              )}
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                {primaryDriver.status || "ACTIVE"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <Phone className="h-3 w-3" /> {primaryDriver.contactNo}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                          <div className="p-2 rounded-lg bg-muted/20 border">
                            <span className="text-[10px] text-muted-foreground block">License Number</span>
                            <span className="font-mono font-semibold text-foreground">{primaryDriver.licenseNo}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/20 border">
                            <span className="text-[10px] text-muted-foreground block">Assigned Since</span>
                            <span className="text-foreground">{formatDate(primaryDriver.assignedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">No Primary Driver Assigned</p>
                          <p className="text-[11px] text-muted-foreground max-w-[200px]">
                            Assign a primary driver to operate this unit as main registered driver.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-muted/10 border-t flex items-center justify-end gap-2">
                    {primaryDriver ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnitDriversModalOpen(true)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={detachingDriverId === primaryDriver.id}
                          onClick={() => handleDetachDriver(primaryDriver.id, `${primaryDriver.firstName} ${primaryDriver.lastName}`)}
                          className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          {detachingDriverId === primaryDriver.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Unlink className="h-3.5 w-3.5" />
                          )}
                          Detach
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setUnitDriversModalOpen(true)}
                        className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white w-full"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Primary Driver
                      </Button>
                    )}
                  </div>
                </div>

                {/* SLOT 2: SECONDARY / RELIEF DRIVER */}
                <div className="rounded-xl border bg-card shadow-2xs overflow-hidden flex flex-col justify-between">
                  <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-blue-800 dark:text-blue-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      Slot 2: Secondary / Relief Driver
                    </span>
                    {secondaryDriver ? (
                      <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5">
                        Occupied
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-dashed text-[10px] text-muted-foreground">
                        Vacant Slot
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-4 grow">
                    {secondaryDriver ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div
                            onClick={() =>
                              secondaryDriver.profilePicture &&
                              setSelectedImage({
                                url: secondaryDriver.profilePicture,
                                title: `Secondary Driver: ${secondaryDriver.firstName} ${secondaryDriver.lastName}`,
                              })
                            }
                            className={`w-14 h-14 rounded-xl overflow-hidden border bg-muted flex items-center justify-center shrink-0 ${
                              secondaryDriver.profilePicture ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : ""
                            }`}
                          >
                            {secondaryDriver.profilePicture ? (
                              <img
                                src={secondaryDriver.profilePicture}
                                alt={secondaryDriver.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-7 w-7 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {secondaryDriver.firstName} {secondaryDriver.middleName ? `${secondaryDriver.middleName[0]}. ` : ""}{secondaryDriver.lastName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                              {secondaryDriver.driverId && (
                                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                                  {secondaryDriver.driverId}
                                </Badge>
                              )}
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                {secondaryDriver.status || "ACTIVE"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <Phone className="h-3 w-3" /> {secondaryDriver.contactNo}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                          <div className="p-2 rounded-lg bg-muted/20 border">
                            <span className="text-[10px] text-muted-foreground block">License Number</span>
                            <span className="font-mono font-semibold text-foreground">{secondaryDriver.licenseNo}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/20 border">
                            <span className="text-[10px] text-muted-foreground block">Assigned Since</span>
                            <span className="text-foreground">{formatDate(secondaryDriver.assignedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">No Secondary Driver Assigned</p>
                          <p className="text-[11px] text-muted-foreground max-w-[200px]">
                            Assign an authorized relief driver to operate when primary driver is off-duty.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-muted/10 border-t flex items-center justify-end gap-2">
                    {secondaryDriver ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnitDriversModalOpen(true)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={detachingDriverId === secondaryDriver.id}
                          onClick={() => handleDetachDriver(secondaryDriver.id, `${secondaryDriver.firstName} ${secondaryDriver.lastName}`)}
                          className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          {detachingDriverId === secondaryDriver.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Unlink className="h-3.5 w-3.5" />
                          )}
                          Detach
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setUnitDriversModalOpen(true)}
                        className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white w-full"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Secondary Driver
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Guidelines Note */}
              <div className="p-3 rounded-xl border bg-muted/10 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-primary" />
                  Tagbilaran City MTOP Driver Assignment Policy:
                </p>
                <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                  <li>Detaching a driver immediately returns them to the standalone unassigned driver pool.</li>
                  <li>Replaced drivers are preserved in the municipal driver registry and attachment history log.</li>
                  <li>Both primary and secondary drivers must carry valid LTO credentials and MTOP city authorization.</li>
                </ul>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Profile
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              size="sm"
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANAGE DRIVERS MODAL */}
      <UnitDriversModal
        isOpen={unitDriversModalOpen}
        onClose={() => setUnitDriversModalOpen(false)}
        targetType="operator"
        targetId={operator.id}
        targetTitle={`Operator: ${operator.name}`}
        targetSubtext={`Operator ID: ${operator.operatorId} • ${operator.mobileNo}`}
        drivers={operator.drivers || []}
        onSuccess={() => {
          setUnitDriversModalOpen(false);
          router.refresh();
          onRefresh?.();
        }}
      />

      {/* LIGHTBOX FOR ID & PHOTO PREVIEWS */}
      {selectedImage && (
        <Dialog open={Boolean(selectedImage)} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-2xl p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm font-semibold">{selectedImage.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
