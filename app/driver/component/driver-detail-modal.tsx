"use client";

import { useState } from "react";
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
  User,
  CreditCard,
  Building2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Printer,
  ShieldCheck,
  Star,
  ExternalLink,
  History,
  Clock,
  CheckCircle2,
  Unlink,
  RefreshCw,
} from "lucide-react";
import type { DriverItem } from "../types";

interface DriverDetailModalProps {
  driver: DriverItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (driver: DriverItem) => void;
}

export function DriverDetailModal({
  driver,
  isOpen,
  onClose,
  onEdit,
}: DriverDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"credentials" | "history">("credentials");

  if (!driver) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDob = driver.dateOfBirth
    ? new Date(driver.dateOfBirth).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const formattedExpiry = driver.licenseExpiryDate
    ? new Date(driver.licenseExpiryDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not indicated";

  const formattedAssignedDate = driver.assignedAt
    ? new Date(driver.assignedAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const isAttached = Boolean(driver.operatorId || driver.newFranchiseId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border shadow-2xl">
        {/* HEADER */}
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {driver.profilePicture ? (
                <img
                  src={driver.profilePicture}
                  alt={driver.firstName}
                  className="h-16 w-16 rounded-xl object-cover border-2 border-primary/30 shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xl border border-primary/20 shadow-xs">
                  {driver.firstName[0]}
                  {driver.lastName[0]}
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>
                    {driver.firstName} {driver.middleName ? `${driver.middleName} ` : ""}
                    {driver.lastName}
                  </span>
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30 bg-primary/5">
                    {driver.driverId || "ID PENDING"}
                  </Badge>

                  {/* Primary / Secondary Role Badge */}
                  {driver.driverRole === "PRIMARY" ? (
                    <Badge
                      variant="outline"
                      className="text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1"
                    >
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      PRIMARY DRIVER
                    </Badge>
                  ) : driver.driverRole === "SECONDARY" ? (
                    <Badge
                      variant="outline"
                      className="text-xs font-bold border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 gap-1"
                    >
                      <ShieldCheck className="h-3 w-3 text-blue-500" />
                      SECONDARY DRIVER
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      STANDALONE POOL
                    </Badge>
                  )}

                  <Badge
                    variant={
                      driver.status === "ACTIVE"
                        ? "default"
                        : driver.status === "SUSPENDED"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-[11px]"
                  >
                    {driver.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Official Motorized Tricycle Driver Credential & Certification
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("credentials")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeTab === "credentials"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Credentials & Unit Assignment
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Assignment History
              {driver.attachmentHistory && driver.attachmentHistory.length > 0 && (
                <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.2 rounded-full font-mono">
                  {driver.attachmentHistory.length}
                </span>
              )}
            </button>
          </div>
        </DialogHeader>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6">
          {activeTab === "credentials" ? (
            <>
              {/* 1. CREDENTIAL SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">License No.</span>
                  <p className="text-xs font-mono font-bold text-foreground mt-0.5">{driver.licenseNo}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">License Expiry</span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{formattedExpiry}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">Assigned Role</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {driver.driverRole || "Standalone"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">Franchise Body</span>
                  <p className="text-xs font-mono font-bold text-primary mt-0.5">
                    {driver.newFranchise ? `Body #${driver.newFranchise.franchiseBodyNumber}` : "None"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* 2. PERSONAL DETAILS */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Personal & Contact Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Date of Birth</span>
                      <span className="font-semibold text-foreground">{formattedDob}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Mobile Number</span>
                      <span className="font-mono font-semibold text-foreground">{driver.contactNo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Email Address</span>
                      <span className="font-semibold text-foreground">{driver.email || "No email provided"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Residential Address</span>
                      <span className="font-semibold text-foreground">{driver.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 3. OPERATOR & FRANCHISE ATTACHMENT */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Operator & Franchise Deployment (Max 2 per Unit)
                </span>
                {isAttached ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border bg-muted/20 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground">Employing Operator:</span>
                      <p className="font-bold text-foreground mt-0.5">{driver.operator?.name || "Unassigned"}</p>
                      {driver.operator && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          ID: {driver.operator.operatorId} • {driver.operator.mobileNo}
                        </p>
                      )}
                      {formattedAssignedDate && (
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          Assigned on {formattedAssignedDate}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Assigned Tricycle Body:</span>
                      <p className="font-mono font-bold text-primary mt-0.5">
                        {driver.newFranchise
                          ? `Body #${driver.newFranchise.franchiseBodyNumber} (${driver.newFranchise.zone || "Tagbilaran"})`
                          : "No Specific Body"}
                      </p>
                      {driver.newFranchise?.mtopVehicle && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          Plate: {driver.newFranchise.mtopVehicle.plateNumber} (
                          {driver.newFranchise.mtopVehicle.make} {driver.newFranchise.mtopVehicle.model})
                        </p>
                      )}
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-primary/30 text-primary"
                        >
                          Role: {driver.driverRole || "Primary"} Driver
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground text-center bg-muted/10">
                    Driver is currently unattached in the Standalone Pool. Can be deployed to any operator.
                  </div>
                )}
              </div>

              <Separator />

              {/* 4. DRIVER LICENSING & REGULATORY MEDIA */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  LTO License Scans & Media
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front */}
                  <div className="p-3 rounded-xl border bg-card/60">
                    <span className="text-xs font-semibold block mb-2">Driver&apos;s License (Front)</span>
                    {driver.licenseFrontImage ? (
                      <div className="relative aspect-[1.58/1] rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={driver.licenseFrontImage}
                          alt="License Front"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={driver.licenseFrontImage}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
                          title="Open Full Image"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-[1.58/1] rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground bg-muted/10">
                        No front license image uploaded
                      </div>
                    )}
                  </div>

                  {/* Back */}
                  <div className="p-3 rounded-xl border bg-card/60">
                    <span className="text-xs font-semibold block mb-2">Driver&apos;s License (Back)</span>
                    {driver.licenseBackImage ? (
                      <div className="relative aspect-[1.58/1] rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={driver.licenseBackImage}
                          alt="License Back"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={driver.licenseBackImage}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
                          title="Open Full Image"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-[1.58/1] rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground bg-muted/10">
                        No back license image uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ATTACHMENT HISTORY TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-primary" />
                    Assignment & Attachment Timeline
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Chronological audit log of all operators and franchise body numbers this driver was attached to.
                  </p>
                </div>
              </div>

              {!driver.attachmentHistory || driver.attachmentHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-xs bg-muted/10">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="font-semibold">No assignment history recorded yet</p>
                  <p className="text-[11px] mt-0.5">
                    Attachment, detachment, and slot replacement events will be permanently logged here.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {driver.attachmentHistory.map((hist) => {
                    const actionIcon =
                      hist.action === "ATTACHED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : hist.action === "REPLACED" ? (
                        <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5 text-muted-foreground" />
                      );

                    const actionBadge =
                      hist.action === "ATTACHED" ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40 bg-emerald-500/10 font-bold">
                          ATTACHED
                        </Badge>
                      ) : hist.action === "REPLACED" ? (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40 bg-amber-500/10 font-bold">
                          REPLACED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-bold">
                          DETACHED
                        </Badge>
                      );

                    return (
                      <div key={hist.id} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary shadow-xs" />

                        <div className="p-3.5 rounded-xl border bg-card/70 space-y-1.5 shadow-2xs hover:border-primary/40 transition-colors">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {actionIcon}
                              {actionBadge}
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono ${
                                  hist.driverRole === "PRIMARY"
                                    ? "text-amber-600 border-amber-500/30"
                                    : "text-blue-600 border-blue-500/30"
                                }`}
                              >
                                {hist.driverRole} DRIVER
                              </Badge>
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {new Date(hist.attachedAt).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="text-xs text-foreground font-medium pt-0.5">
                            {hist.franchiseBodyNumber && (
                              <span className="font-bold text-primary">
                                Body #{hist.franchiseBodyNumber}{" "}
                              </span>
                            )}
                            {hist.operatorName && (
                              <span className="text-muted-foreground">
                                • Operator: {hist.operatorName}
                              </span>
                            )}
                          </div>

                          {hist.remarks && (
                            <p className="text-[11px] text-muted-foreground italic">
                              &ldquo;{hist.remarks}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex sm:items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Driver ID / Certificate
          </Button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(driver);
                }}
                className="text-xs"
              >
                Edit Details
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
