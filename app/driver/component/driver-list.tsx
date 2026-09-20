"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Link2,
  UserPen,
  Trash2,
  Users,
  ShieldCheck,
  UserMinus,
  Star,
  AlertCircle,
  UserPlus,
  Loader2,
} from "lucide-react";
import { DriverDetailModal } from "./driver-detail-modal";
import { DriverAttachModal } from "./driver-attach-modal";
import { DriverEditModal } from "./driver-edit-modal";
import { deleteDriver } from "../actions";
import { toast } from "sonner";
import type {
  DriverItem,
  OperatorOptionForDriver,
  FranchiseOptionForDriver,
} from "../types";

interface DriverListProps {
  drivers: DriverItem[];
  operators: OperatorOptionForDriver[];
  franchises: FranchiseOptionForDriver[];
  onRefresh: () => void;
  onRegisterClick?: () => void;
}

export function DriverList({
  drivers,
  operators,
  franchises,
  onRefresh,
  onRegisterClick,
}: DriverListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "primary" | "secondary" | "standalone" | "active">("all");

  // Selected driver for modals
  const [detailDriver, setDetailDriver] = useState<DriverItem | null>(null);
  const [attachDriverTarget, setAttachDriverTarget] = useState<DriverItem | null>(null);
  const [editDriverTarget, setEditDriverTarget] = useState<DriverItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // Search matching
      const query = searchQuery.toLowerCase().trim();
      const fullName = `${driver.firstName} ${driver.middleName || ""} ${driver.lastName}`.toLowerCase();
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        driver.driverId?.toLowerCase().includes(query) ||
        driver.licenseNo.toLowerCase().includes(query) ||
        driver.contactNo.includes(query) ||
        driver.operator?.name.toLowerCase().includes(query) ||
        (driver.newFranchise && String(driver.newFranchise.franchiseBodyNumber).includes(query));

      if (!matchesSearch) return false;

      // Status / Role filtering
      if (statusFilter === "primary") {
        return driver.driverRole === "PRIMARY";
      }
      if (statusFilter === "secondary") {
        return driver.driverRole === "SECONDARY";
      }
      if (statusFilter === "standalone") {
        return !Boolean(driver.operatorId || driver.newFranchiseId);
      }
      if (statusFilter === "active") {
        return driver.status === "ACTIVE";
      }

      return true;
    });
  }, [drivers, searchQuery, statusFilter]);

  // Counts for pills
  const totalCount = drivers.length;
  const primaryCount = drivers.filter((d) => d.driverRole === "PRIMARY").length;
  const secondaryCount = drivers.filter((d) => d.driverRole === "SECONDARY").length;
  const standaloneCount = drivers.filter((d) => !Boolean(d.operatorId || d.newFranchiseId)).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteDriver(deleteTarget.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete driver");
      } else {
        toast.success(res.message || "Driver record removed successfully");
        setDeleteTarget(null);
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting driver");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    if (filteredDrivers.length === 0) {
      toast.error("No driver records to export.");
      return;
    }

    const headers = [
      "Driver ID",
      "Full Name",
      "Role (Primary/Secondary)",
      "License Number",
      "License Expiry",
      "Status",
      "Mobile No",
      "Email",
      "Address",
      "Operator Name",
      "Operator ID",
      "Franchise Body",
      "Assigned Date",
      "Registration Date",
    ];

    const rows = filteredDrivers.map((d) => [
      `"${d.driverId || ""}"`,
      `"${d.lastName}, ${d.firstName} ${d.middleName || ""}"`,
      `"${d.driverRole || "STANDALONE"}"`,
      `"${d.licenseNo}"`,
      `"${d.licenseExpiryDate ? new Date(d.licenseExpiryDate).toISOString().split("T")[0] : ""}"`,
      `"${d.status}"`,
      `"${d.contactNo}"`,
      `"${d.email || ""}"`,
      `"${d.address.replace(/"/g, '""')}"`,
      `"${d.operator?.name || "Standalone"}"`,
      `"${d.operator?.operatorId || ""}"`,
      `"${d.newFranchise ? d.newFranchise.franchiseBodyNumber : "None"}"`,
      `"${d.assignedAt ? new Date(d.assignedAt).toISOString().split("T")[0] : ""}"`,
      `"${new Date(d.createdAt).toISOString().split("T")[0]}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mtop-drivers-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredDrivers.length} driver records to CSV.`);
  };

  return (
    <div className="space-y-4">
      {/* ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border/60 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name, Driver ID, License No, Operator, Body #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/40"
          />
        </div>

        {/* Filter Pills & Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs font-semibold"
          >
            All Drivers ({totalCount})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "primary" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("primary")}
            className="h-8 text-xs font-semibold gap-1"
          >
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            Primary ({primaryCount})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "secondary" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("secondary")}
            className="h-8 text-xs font-semibold gap-1"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            Secondary ({secondaryCount})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "standalone" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("standalone")}
            className="h-8 text-xs font-semibold gap-1"
          >
            <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
            Standalone Pool ({standaloneCount})
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-8 text-xs font-medium gap-1.5"
            title="Export driver directory to CSV"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            Export CSV
          </Button>

          {onRegisterClick && (
            <Button
              type="button"
              size="sm"
              onClick={onRegisterClick}
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register Driver
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
              <TableHead className="text-xs font-bold">Driver Information</TableHead>
              <TableHead className="text-xs font-bold">LTO Credentials</TableHead>
              <TableHead className="text-xs font-bold">Assigned Operator</TableHead>
              <TableHead className="text-xs font-bold">Franchise & Role (Max 2)</TableHead>
              <TableHead className="text-xs font-bold">Status</TableHead>
              <TableHead className="w-16 text-right text-xs font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60" />
                    <p className="text-sm font-medium">No drivers found</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">
                      {searchQuery
                        ? "Try clearing or modifying your search keywords."
                        : "Click 'Register Driver' to enroll your first MTOP driver."}
                    </p>
                    {onRegisterClick && !searchQuery && (
                      <Button
                        size="sm"
                        onClick={onRegisterClick}
                        className="mt-3 text-xs gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Register New Driver
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map((driver, idx) => {
                const isAttached = Boolean(driver.operatorId || driver.newFranchiseId);

                return (
                  <TableRow
                    key={driver.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Index */}
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>

                    {/* Driver Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {driver.profilePicture ? (
                          <img
                            src={driver.profilePicture}
                            alt={driver.firstName}
                            className="h-10 w-10 rounded-lg object-cover border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                            {driver.firstName[0]}
                            {driver.lastName[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDetailDriver(driver)}
                            className="text-xs font-bold text-foreground hover:text-primary hover:underline transition-colors block text-left truncate"
                          >
                            {driver.lastName}, {driver.firstName} {driver.middleName ? `${driver.middleName[0]}.` : ""}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span className="font-mono">{driver.driverId || "No ID"}</span>
                            <span>•</span>
                            <span className="font-mono">{driver.contactNo}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* License Credentials */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {driver.licenseNo}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Exp:{" "}
                          {driver.licenseExpiryDate
                            ? new Date(driver.licenseExpiryDate).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </TableCell>

                    {/* Operator */}
                    <TableCell>
                      {driver.operator ? (
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground block truncate max-w-[150px]">
                            {driver.operator.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {driver.operator.operatorId}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Standalone
                        </Badge>
                      )}
                    </TableCell>

                    {/* Franchise Body & Assigned Role */}
                    <TableCell>
                      {isAttached ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {driver.newFranchise ? (
                              <Badge variant="secondary" className="font-mono text-xs font-bold text-primary">
                                Body #{driver.newFranchise.franchiseBodyNumber}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Operator Only
                              </Badge>
                            )}

                            {/* Driver Role Badge */}
                            {driver.driverRole === "PRIMARY" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-0.5"
                              >
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                Primary
                              </Badge>
                            ) : driver.driverRole === "SECONDARY" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 gap-0.5"
                              >
                                <ShieldCheck className="h-2.5 w-2.5 text-blue-500" />
                                Secondary
                              </Badge>
                            ) : null}
                          </div>

                          {driver.newFranchise?.mtopVehicle && (
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              Plate: {driver.newFranchise.mtopVehicle.plateNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Standalone Pool
                        </Badge>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          driver.status === "ACTIVE"
                            ? "default"
                            : driver.status === "SUSPENDED"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px] font-semibold"
                      >
                        {driver.status}
                      </Badge>
                    </TableCell>

                    {/* Actions Dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs">Driver Actions</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDetailDriver(driver)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-primary" />
                            View Certificate & History
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setAttachDriverTarget(driver)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <Link2 className="h-3.5 w-3.5 text-blue-500" />
                            Assign / Change Slot
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setEditDriverTarget(driver)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <UserPen className="h-3.5 w-3.5 text-amber-500" />
                            Edit Profile
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(driver)}
                            className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove Driver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL 1: DRIVER DETAIL & CERTIFICATE WITH HISTORY */}
      <DriverDetailModal
        driver={detailDriver}
        isOpen={Boolean(detailDriver)}
        onClose={() => setDetailDriver(null)}
        onEdit={(d) => {
          setDetailDriver(null);
          setEditDriverTarget(d);
        }}
      />

      {/* MODAL 2: ATTACH / DETACH FACILITY WITH SLOTS */}
      <DriverAttachModal
        isOpen={Boolean(attachDriverTarget)}
        onClose={() => setAttachDriverTarget(null)}
        driver={attachDriverTarget}
        operators={operators}
        franchises={franchises}
        onSuccess={onRefresh}
      />

      {/* MODAL 3: EDIT DRIVER PROFILE */}
      <DriverEditModal
        isOpen={Boolean(editDriverTarget)}
        onClose={() => setEditDriverTarget(null)}
        driver={editDriverTarget}
        onSuccess={onRefresh}
      />

      {/* MODAL 4: DELETE CONFIRMATION */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirm Driver Record Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {deleteTarget?.firstName} {deleteTarget?.lastName} (
                {deleteTarget?.driverId || deleteTarget?.licenseNo})
              </strong>{" "}
              from the MTOP system? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs gap-1.5"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Yes, Delete Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
