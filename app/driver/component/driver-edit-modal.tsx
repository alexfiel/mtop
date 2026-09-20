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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DriverMediaUploader } from "./driver-media-uploader";
import { updateDriver } from "../actions";
import { AlertCircle, Loader2, CheckCircle2, UserPen } from "lucide-react";
import { toast } from "sonner";
import type { DriverItem, DriverUpdateInput } from "../types";

interface DriverEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverItem | null;
  onSuccess: () => void;
}

export function DriverEditModal({
  isOpen,
  onClose,
  driver,
  onSuccess,
}: DriverEditModalProps) {
  const [formData, setFormData] = useState<DriverUpdateInput>({
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (driver) {
      setFormData({
        firstName: driver.firstName || "",
        lastName: driver.lastName || "",
        middleName: driver.middleName || "",
        licenseNo: driver.licenseNo || "",
        licenseExpiryDate: driver.licenseExpiryDate
          ? new Date(driver.licenseExpiryDate).toISOString().split("T")[0]
          : "",
        address: driver.address || "",
        contactNo: driver.contactNo || "",
        email: driver.email || "",
        dateOfBirth: driver.dateOfBirth
          ? new Date(driver.dateOfBirth).toISOString().split("T")[0]
          : "",
        status: driver.status || "ACTIVE",
        profilePicture: driver.profilePicture || "",
        licenseFrontImage: driver.licenseFrontImage || "",
        licenseBackImage: driver.licenseBackImage || "",
      });
      setErrorMsg(null);
    }
  }, [driver]);

  if (!driver) return null;

  const handleChange = (field: keyof DriverUpdateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg("First Name and Last Name are required.");
      return;
    }
    if (!formData.licenseNo.trim()) {
      setErrorMsg("Driver's License Number is required.");
      return;
    }
    if (!formData.address.trim() || !formData.contactNo.trim()) {
      setErrorMsg("Address and Contact Number are required.");
      return;
    }
    if (!formData.dateOfBirth) {
      setErrorMsg("Date of Birth is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateDriver(driver.id, {
        ...formData,
        licenseNo: formData.licenseNo.trim().toUpperCase(),
        email: formData.email?.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update driver");
        toast.error(res.error || "Failed to update driver");
      } else {
        toast.success(res.message || "Driver profile updated successfully");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      toast.error(err.message || "Error updating driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Edit Driver Profile: {driver.firstName} {driver.lastName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update credentials, contact information, and license status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* NAME FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="h-8.5 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Middle Name</Label>
              <Input
                value={formData.middleName || ""}
                onChange={(e) => handleChange("middleName", e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="h-8.5 text-xs"
                required
              />
            </div>
          </div>

          {/* DATES & CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date of Birth *</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                className="h-8.5 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contact Mobile *</Label>
              <Input
                value={formData.contactNo}
                onChange={(e) => handleChange("contactNo", e.target.value)}
                className="h-8.5 text-xs font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Residential Address *</Label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="h-8.5 text-xs"
              required
            />
          </div>

          {/* LICENSE & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">License Number *</Label>
              <Input
                value={formData.licenseNo}
                onChange={(e) => handleChange("licenseNo", e.target.value.toUpperCase())}
                className="h-8.5 text-xs font-mono font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">License Expiry Date</Label>
              <Input
                type="date"
                value={formData.licenseExpiryDate || ""}
                onChange={(e) => handleChange("licenseExpiryDate", e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Operating Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleChange("status", val)}
              >
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs text-emerald-600">
                    ACTIVE
                  </SelectItem>
                  <SelectItem value="SUSPENDED" className="text-xs text-amber-600">
                    SUSPENDED
                  </SelectItem>
                  <SelectItem value="REVOKED" className="text-xs text-destructive">
                    REVOKED
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* MEDIA UPLOADS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
            <DriverMediaUploader
              label="Portrait Photo"
              value={formData.profilePicture}
              onChange={(url) => handleChange("profilePicture", url)}
              mode="portrait"
            />
            <DriverMediaUploader
              label="License (Front)"
              value={formData.licenseFrontImage}
              onChange={(url) => handleChange("licenseFrontImage", url)}
              mode="card"
            />
            <DriverMediaUploader
              label="License (Back)"
              value={formData.licenseBackImage}
              onChange={(url) => handleChange("licenseBackImage", url)}
              mode="card"
            />
          </div>

          <DialogFooter className="pt-4 border-t flex sm:items-center justify-end gap-2">
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
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
