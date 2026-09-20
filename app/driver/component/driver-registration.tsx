"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Hash,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { DriverMediaUploader } from "./driver-media-uploader";
import { registerDriver, getNextDriverId } from "../actions";
import type {
  DriverRegistrationInput,
  OperatorOptionForDriver,
  FranchiseOptionForDriver,
} from "../types";

interface DriverRegistrationProps {
  operators: OperatorOptionForDriver[];
  franchises: FranchiseOptionForDriver[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DriverRegistration({
  operators,
  franchises,
  onSuccess,
  onCancel,
}: DriverRegistrationProps) {
  const [driverId, setDriverId] = useState<string>("");
  const [isLoadingId, setIsLoadingId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DriverRegistrationInput>({
    firstName: "",
    lastName: "",
    middleName: "",
    licenseNo: "",
    licenseExpiryDate: "",
    address: "",
    contactNo: "",
    email: "",
    dateOfBirth: "",
    status: "ACTIVE",
    profilePicture: "",
    licenseFrontImage: "",
    licenseBackImage: "",
    operatorId: null,
    newFranchiseId: null,
    driverRole: "PRIMARY",
  });

  // Fetch next Driver ID on load
  const loadNextId = async () => {
    setIsLoadingId(true);
    try {
      const nextId = await getNextDriverId();
      setDriverId(nextId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingId(false);
    }
  };

  useEffect(() => {
    loadNextId();
  }, []);

  const handleChange = (field: keyof DriverRegistrationInput, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If operator changed, auto-suggest or check franchise
      if (field === "operatorId") {
        if (!value) {
          updated.newFranchiseId = null;
        } else {
          const matchedOp = operators.find((op) => op.id === value);
          if (matchedOp?.newFranchise?.id) {
            updated.newFranchiseId = matchedOp.newFranchise.id;
          }
        }
      }

      return updated;
    });
    setFormError(null);
  };

  // Filter franchises based on selected operator if any
  const availableFranchises = formData.operatorId
    ? franchises.filter((f) => f.operatorId === formData.operatorId)
    : franchises;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError("First Name and Last Name are required.");
      return;
    }
    if (!formData.licenseNo.trim()) {
      setFormError("Driver's License Number is required.");
      return;
    }
    if (!formData.contactNo.trim()) {
      setFormError("Contact mobile number is required.");
      return;
    }
    if (!formData.address.trim()) {
      setFormError("Residential address is required.");
      return;
    }
    if (!formData.dateOfBirth) {
      setFormError("Date of Birth is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DriverRegistrationInput = {
        ...formData,
        driverId: driverId || undefined,
        licenseNo: formData.licenseNo.trim().toUpperCase(),
        email: formData.email?.trim() || undefined,
      };

      const res = await registerDriver(payload);
      if (!res.success) {
        setFormError(res.error || "Failed to register driver");
        toast.error(res.error || "Failed to register driver");
      } else {
        toast.success(res.message || "Driver registered successfully!");
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          middleName: "",
          licenseNo: "",
          licenseExpiryDate: "",
          address: "",
          contactNo: "",
          email: "",
          dateOfBirth: "",
          status: "ACTIVE",
          profilePicture: "",
          licenseFrontImage: "",
          licenseBackImage: "",
          operatorId: null,
          newFranchiseId: null,
        });
        loadNextId();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "An unexpected error occurred");
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              New Driver Registration
            </h2>
            <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
              Biometric & MTOP Pool
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register a qualified tricycle operator driver with LTO credentials and optional franchise link.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border">
            <span className="text-xs font-semibold text-muted-foreground">Driver ID:</span>
            <span className="text-sm font-mono font-bold text-foreground">
              {isLoadingId ? "Generating..." : driverId || "DRV-AUTO"}
            </span>
            <button
              type="button"
              onClick={loadNextId}
              disabled={isLoadingId}
              className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
              title="Refresh ID"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingId ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-destructive text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: PERSONAL INFORMATION */}
      <Card className="border-border/60 shadow-2xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">1. Personal & Contact Information</CardTitle>
              <CardDescription className="text-xs">
                Civil details and residential contact information of the applicant
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs font-semibold">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="e.g. Juan"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="middleName" className="text-xs font-semibold">
                Middle Name
              </Label>
              <Input
                id="middleName"
                value={formData.middleName || ""}
                onChange={(e) => handleChange("middleName", e.target.value)}
                placeholder="e.g. Santos"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs font-semibold">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="e.g. Dela Cruz"
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                Date of Birth *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactNo" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                Contact Mobile Number *
              </Label>
              <Input
                id="contactNo"
                value={formData.contactNo}
                onChange={(e) => handleChange("contactNo", e.target.value)}
                placeholder="e.g. 0917-123-4567"
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                Email Address
                <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g. juan@example.com"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address" className="text-xs font-semibold flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              Complete Residential Address *
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="e.g. Purok 4, Poblacion II, Tagbilaran City, Bohol"
              className="h-9 text-xs"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: LTO DRIVER'S LICENSE & BIOMETRICS */}
      <Card className="border-border/60 shadow-2xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">2. LTO Driver&apos;s License & Biometrics</CardTitle>
              <CardDescription className="text-xs">
                Official regulatory credentials and biometric facial verification photo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="licenseNo" className="text-xs font-semibold">
                LTO Driver&apos;s License Number *
              </Label>
              <Input
                id="licenseNo"
                value={formData.licenseNo}
                onChange={(e) => handleChange("licenseNo", e.target.value.toUpperCase())}
                placeholder="e.g. G01-12-345678"
                className="h-9 text-xs font-mono uppercase font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="licenseExpiryDate" className="text-xs font-semibold">
                License Expiry Date
              </Label>
              <Input
                id="licenseExpiryDate"
                type="date"
                value={formData.licenseExpiryDate || ""}
                onChange={(e) => handleChange("licenseExpiryDate", e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Operating Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleChange("status", val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs text-emerald-600">
                    ACTIVE (Qualified)
                  </SelectItem>
                  <SelectItem value="SUSPENDED" className="text-xs text-amber-600">
                    SUSPENDED (Temporary Hold)
                  </SelectItem>
                  <SelectItem value="REVOKED" className="text-xs text-destructive">
                    REVOKED (Disqualified)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. Portrait Photo */}
            <DriverMediaUploader
              label="Driver Biometric Portrait"
              description="Front-facing facial photo (webcam snapshot or upload)"
              value={formData.profilePicture}
              onChange={(url) => handleChange("profilePicture", url)}
              mode="portrait"
            />

            {/* 2. License Front */}
            <DriverMediaUploader
              label="LTO License Card (Front)"
              description="Clear scan or photo of the front side of driver's license"
              value={formData.licenseFrontImage}
              onChange={(url) => handleChange("licenseFrontImage", url)}
              mode="card"
            />

            {/* 3. License Back */}
            <DriverMediaUploader
              label="LTO License Card (Back)"
              description="Official restrictions, blood type, and bar code on back"
              value={formData.licenseBackImage}
              onChange={(url) => handleChange("licenseBackImage", url)}
              mode="card"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: ATTACHMENT TO OPERATOR & FRANCHISE (STANDALONE OR ATTACHED) */}
      <Card className="border-border/60 shadow-2xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  3. Franchise & Operator Assignment (Optional)
                </CardTitle>
                <CardDescription className="text-xs">
                  Attach driver to a registered MTOP Operator or Franchise Body Number, or leave as Standalone Pool.
                </CardDescription>
              </div>
            </div>

            <Badge
              variant={formData.operatorId || formData.newFranchiseId ? "default" : "secondary"}
              className="text-[11px]"
            >
              {formData.operatorId || formData.newFranchiseId ? "Attached Driver" : "Standalone Driver Pool"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Operator Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="operatorId" className="text-xs font-semibold">
                  Assigned MTOP Operator
                </Label>
                {formData.operatorId && (
                  <button
                    type="button"
                    onClick={() => handleChange("operatorId", null)}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Clear Operator
                  </button>
                )}
              </div>
              <Select
                value={formData.operatorId || "none"}
                onValueChange={(val) => handleChange("operatorId", val === "none" ? null : val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Registered Operator (Optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none" className="text-xs text-muted-foreground font-medium">
                    None (Standalone Driver Pool)
                  </SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{op.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">({op.operatorId})</span>
                        {op.newFranchise && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Body #{op.newFranchise.franchiseBodyNumber}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Associates this driver directly under the designated operator account.
              </p>
            </div>

            {/* Franchise Body Number Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="newFranchiseId" className="text-xs font-semibold">
                  Assigned Franchise Body Number
                </Label>
                {formData.newFranchiseId && (
                  <button
                    type="button"
                    onClick={() => handleChange("newFranchiseId", null)}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Clear Franchise
                  </button>
                )}
              </div>
              <Select
                value={formData.newFranchiseId || "none"}
                onValueChange={(val) => handleChange("newFranchiseId", val === "none" ? null : val)}
              >
                <SelectTrigger className="h-9 text-xs font-mono">
                  <SelectValue placeholder="Select Franchise Body Number (Optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none" className="text-xs text-muted-foreground font-sans">
                    None (No Body Assigned)
                  </SelectItem>
                  {availableFranchises.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Body #{f.franchiseBodyNumber}</span>
                        {f.operatorName && (
                          <span className="text-[11px] text-muted-foreground font-sans">
                            - {f.operatorName}
                          </span>
                        )}
                        {f.vehiclePlate && (
                          <span className="text-[10px] bg-muted px-1 rounded font-mono">
                            {f.vehiclePlate}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Specifies the motorized tricycle body number that the driver will be authorized to pilot.
              </p>
            </div>
          </div>

          {/* ROLE DESIGNATION (PRIMARY VS SECONDARY) */}
          {(formData.operatorId || formData.newFranchiseId) && (
            <div className="pt-3 border-t space-y-2">
              <Label className="text-xs font-semibold">
                Driver Role Designation (Max 2 Drivers Allowed per Unit)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("driverRole", "PRIMARY")}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.driverRole === "PRIMARY"
                      ? "border-amber-500 bg-amber-500/10 shadow-xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                    ★ Primary Driver
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Main authorized operator responsible for regular routes.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("driverRole", "SECONDARY")}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.driverRole === "SECONDARY"
                      ? "border-blue-500 bg-blue-500/10 shadow-xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                    🛡 Secondary Driver (Relief)
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Alternate / relief operator authorized when primary driver is off-duty.
                  </span>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 text-xs px-6 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registering Driver...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Complete Driver Registration
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
