"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Hash,
  User,
  Car,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserCheck,
  Edit2,
  Trash2,
  RotateCcw,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Power,
  Star,
  Users,
  UserPlus,
  Eye,
  ExternalLink,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toggleFranchiseStatus, deleteNewFranchise } from "../actions";
import { toast } from "sonner";

interface FranchiseListProps {
  franchises: any[];
  searchTerm: string;
  onAssign: (franchise: any) => void;
  onEdit: (franchise: any) => void;
  onUnassign: (franchise: any) => void;
  onRefresh: () => void;
  onManageDrivers?: (franchise: any) => void;
  onViewVehicle?: (vehicle: any, franchise: any) => void;
  onViewDriver?: (driver: any, franchise: any) => void;
  onViewOperator?: (operator: any, franchise: any) => void;
  onViewApplication?: (franchise: any) => void;
  onClearSearch?: () => void;
  onError?: (errorMessage: string) => void;
}

export function FranchiseList({
  franchises,
  searchTerm,
  onAssign,
  onEdit,
  onUnassign,
  onRefresh,
  onManageDrivers,
  onViewVehicle,
  onViewDriver,
  onViewOperator,
  onViewApplication,
  onClearSearch,
  onError,
}: FranchiseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, franchises.length]);

  const totalItems = franchises.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedFranchises = franchises.slice(startIndex, endIndex);

  const handleDelete = async (franchise: any) => {
    if (
      !confirm(
        `Are you sure you want to delete Franchise Body #${franchise.franchiseBodyNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(franchise.id);
    try {
      const res = await deleteNewFranchise(franchise.id);
      if (res.success) {
        toast.success(`Franchise Body #${franchise.franchiseBodyNumber} deleted.`);
        onRefresh();
      } else {
        const msg = res.error || "Failed to delete franchise.";
        toast.error(msg);
        onError?.(msg);
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred while deleting.";
      toast.error(msg);
      onError?.(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (franchise: any) => {
    try {
      const res = await toggleFranchiseStatus(franchise.id);
      if (res.success) {
        toast.success(
          `Franchise #${franchise.franchiseBodyNumber} marked as ${
            res.franchise?.isActive ? "ACTIVE" : "INACTIVE"
          }.`
        );
        onRefresh();
      } else {
        const msg = res.error || "Failed to update franchise status.";
        toast.error(msg);
        onError?.(msg);
      }
    } catch (err: any) {
      const msg = err.message || "An error occurred while updating status.";
      toast.error(msg);
      onError?.(msg);
    }
  };

  if (franchises.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center bg-card shadow-xs">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
            <Hash className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">No franchise records found</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchTerm
                ? `No franchises matching "${searchTerm}". Try a different body number, operator name, or zone.`
                : "Get started by registering a new franchise body number into the municipal pool."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-44">Franchise Slot</TableHead>
            <TableHead>Assigned Operator</TableHead>
            <TableHead>MTOP Tricycle Vehicle</TableHead>
            <TableHead>Assigned Drivers (Max 2)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignment Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedFranchises.map((fr) => {
            const isAssigned = fr.isAssigned && Boolean(fr.operator);
            const isActive = fr.isActive;
            const drivers = fr.drivers || [];
            const primaryDriver =
              drivers.find((d: any) => d.driverRole === "PRIMARY") ||
              (drivers.length > 0 && drivers.every((d: any) => d.driverRole !== "PRIMARY") ? drivers[0] : null);
            const secondaryDriver =
              drivers.find((d: any) => d.driverRole === "SECONDARY") ||
              (drivers.length > 1 && primaryDriver ? drivers.find((d: any) => d.id !== primaryDriver.id) : null);

            return (
              <TableRow key={fr.id} className="hover:bg-muted/30 transition-colors">
                {/* Body Number & Zone */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-10 w-12 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-base tracking-wider shrink-0 shadow-2xs">
                      #{fr.franchiseBodyNumber}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{fr.zone || "Tagbilaran City"}</span>
                      </div>
                      {fr.remarks && (
                        <div className="text-[10px] text-muted-foreground/80 truncate max-w-[140px]" title={fr.remarks}>
                          {fr.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Operator Details (Clickable Link View) */}
                <TableCell>
                  {fr.operator ? (
                    <button
                      type="button"
                      onClick={() => onViewOperator?.(fr.operator, fr)}
                      className="group flex items-center gap-3 text-left p-1.5 -m-1.5 rounded-lg hover:bg-muted/60 transition-all cursor-pointer w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      title={`View details for Operator ${fr.operator.name}`}
                    >
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/80 group-hover:border-primary/40 transition-colors shadow-2xs">
                        {fr.operator.profilePicture ? (
                          <img
                            src={fr.operator.profilePicture}
                            alt={fr.operator.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {fr.operator.name}
                          </span>
                          <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <div className="text-xs font-mono text-primary flex items-center gap-2">
                          <span>{fr.operator.operatorId}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground font-sans">{fr.operator.mobileNo}</span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium text-xs gap-1"
                      >
                        <Clock className="h-3 w-3" /> Unassigned
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAssign(fr)}
                        className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Assign Operator
                      </Button>
                    </div>
                  )}
                </TableCell>

                {/* MTOP Tricycle Vehicle (Clickable Link View) */}
                <TableCell>
                  {fr.mtopVehicle ? (
                    <button
                      type="button"
                      onClick={() => onViewVehicle?.(fr.mtopVehicle, fr)}
                      className="group flex flex-col items-start gap-1 p-2 -m-1 rounded-lg border border-border/70 hover:border-primary/50 bg-card hover:bg-primary/5 transition-all text-left cursor-pointer w-full max-w-[210px] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      title={`View specifications and documents for Plate #${fr.mtopVehicle.plateNumber}`}
                    >
                      <div className="flex items-center justify-between w-full gap-1.5">
                        <Badge
                          variant="outline"
                          className="font-mono font-bold text-xs bg-muted/60 border-primary/25 text-foreground group-hover:border-primary group-hover:text-primary tracking-wider transition-colors px-1.5 py-0 shadow-2xs"
                        >
                          <Car className="h-2.5 w-2.5 mr-1 text-primary shrink-0" />
                          {fr.mtopVehicle.plateNumber}
                        </Badge>
                        <span className="text-[10px] font-medium text-primary flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:underline transition-all shrink-0">
                          <Eye className="h-3 w-3" />
                          View
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">
                        {fr.mtopVehicle.make} {fr.mtopVehicle.model}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{fr.mtopVehicle.color}</span>
                        <span>•</span>
                        <span>{fr.mtopVehicle.year}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="border-dashed text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 font-normal gap-1"
                        >
                          <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          No Vehicle Linked
                        </Badge>
                      </div>
                      {fr.operator && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => onAssign(fr)}
                          className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1 font-medium -ml-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          Link Vehicle
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Assigned Drivers (Clickable Link View - Max 2) */}
                <TableCell>
                  <div className="space-y-1.5 min-w-[200px]">
                    {drivers.length > 0 ? (
                      <div className="space-y-1.5">
                        {primaryDriver && (
                          <button
                            type="button"
                            onClick={() => onViewDriver?.(primaryDriver, fr)}
                            className="group flex items-center justify-between w-full p-1.5 rounded-md border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/12 hover:border-amber-500/50 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-2xs"
                            title={`View driver credentials & records for Primary Driver ${primaryDriver.firstName} ${primaryDriver.lastName}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center text-[10px] font-bold shrink-0 border border-amber-500/30">
                                {primaryDriver.profilePicture ? (
                                  <img
                                    src={primaryDriver.profilePicture}
                                    alt={primaryDriver.firstName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  `${primaryDriver.firstName[0]}${primaryDriver.lastName[0]}`
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-none px-1 py-0 text-[9px] font-semibold tracking-wide uppercase shrink-0">
                                    <Star className="h-2 w-2 fill-amber-500 mr-0.5" />
                                    Primary
                                  </Badge>
                                  <span className="font-semibold text-xs text-foreground truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                    {primaryDriver.firstName} {primaryDriver.lastName}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground truncate">
                                  {primaryDriver.licenseNo || primaryDriver.driverId || "No License #"}
                                </div>
                              </div>
                            </div>
                            <Eye className="h-3 w-3 text-amber-600 dark:text-amber-400 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0 ml-1" />
                          </button>
                        )}

                        {secondaryDriver && (
                          <button
                            type="button"
                            onClick={() => onViewDriver?.(secondaryDriver, fr)}
                            className="group flex items-center justify-between w-full p-1.5 rounded-md border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/12 hover:border-blue-500/50 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 shadow-2xs"
                            title={`View driver credentials & records for Relief Driver ${secondaryDriver.firstName} ${secondaryDriver.lastName}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-blue-500/20 text-blue-800 dark:text-blue-200 flex items-center justify-center text-[10px] font-bold shrink-0 border border-blue-500/30">
                                {secondaryDriver.profilePicture ? (
                                  <img
                                    src={secondaryDriver.profilePicture}
                                    alt={secondaryDriver.firstName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  `${secondaryDriver.firstName[0]}${secondaryDriver.lastName[0]}`
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <Badge className="bg-blue-500/20 text-blue-800 dark:text-blue-300 border-none px-1 py-0 text-[9px] font-semibold tracking-wide uppercase shrink-0">
                                    <ShieldCheck className="h-2 w-2 mr-0.5 text-blue-500" />
                                    Relief
                                  </Badge>
                                  <span className="font-semibold text-xs text-foreground truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                    {secondaryDriver.firstName} {secondaryDriver.lastName}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground truncate">
                                  {secondaryDriver.licenseNo || secondaryDriver.driverId || "No License #"}
                                </div>
                              </div>
                            </div>
                            <Eye className="h-3 w-3 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0 ml-1" />
                          </button>
                        )}

                        <div className="pt-0.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onManageDrivers?.(fr)}
                            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Users className="h-3 w-3" />
                            Manage Drivers ({drivers.length}/2)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-dashed text-[10px] text-muted-foreground">
                          0/2 Drivers
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onManageDrivers?.(fr)}
                          className="h-6 px-2 text-[10px] gap-1 border-dashed hover:border-primary hover:text-primary cursor-pointer"
                        >
                          <UserPlus className="h-3 w-3" />
                          Assign
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <div className="flex flex-col gap-1.5 items-start">
                    {isActive ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-[11px] bg-muted text-muted-foreground">
                        <XCircle className="h-3 w-3" /> Inactive
                      </Badge>
                    )}

                    <span className="text-[10px] text-muted-foreground font-medium">
                      {isAssigned ? "Assigned Slot" : "Available Slot"}
                    </span>
                  </div>
                </TableCell>

                {/* Assignment Date */}
                <TableCell>
                  {fr.assignedDate ? (
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(fr.assignedDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(fr.assignedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">—</span>
                  )}
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!isAssigned ? (
                      <Button
                        size="sm"
                        onClick={() => onAssign(fr)}
                        className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Assign
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUnassign(fr)}
                        className="h-8 gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Release
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 text-xs">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Body #{fr.franchiseBodyNumber} Actions</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />

                        {/* View Links Section */}
                        {fr.mtopVehicle && (
                          <DropdownMenuItem
                            onClick={() => onViewVehicle?.(fr.mtopVehicle, fr)}
                            className="gap-2 cursor-pointer font-medium text-foreground"
                          >
                            <Car className="h-3.5 w-3.5 text-primary" />
                            <span>View Vehicle ({fr.mtopVehicle.plateNumber})</span>
                          </DropdownMenuItem>
                        )}

                        {primaryDriver && (
                          <DropdownMenuItem
                            onClick={() => onViewDriver?.(primaryDriver, fr)}
                            className="gap-2 cursor-pointer text-foreground"
                          >
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span>View Primary: {primaryDriver.firstName}</span>
                          </DropdownMenuItem>
                        )}

                        {secondaryDriver && (
                          <DropdownMenuItem
                            onClick={() => onViewDriver?.(secondaryDriver, fr)}
                            className="gap-2 cursor-pointer text-foreground"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                            <span>View Relief: {secondaryDriver.firstName}</span>
                          </DropdownMenuItem>
                        )}

                        {fr.operator && (
                          <DropdownMenuItem
                            onClick={() => onViewOperator?.(fr.operator, fr)}
                            className="gap-2 cursor-pointer text-foreground"
                          >
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>View Operator: {fr.operator.name}</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => onViewApplication?.(fr)}
                          className="gap-2 cursor-pointer text-primary font-medium"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Application Workflow & Tasks</span>
                        </DropdownMenuItem>

                        {(fr.mtopVehicle || primaryDriver || secondaryDriver || fr.operator) && (
                          <DropdownMenuSeparator />
                        )}

                        <DropdownMenuItem onClick={() => onEdit(fr)} className="gap-2 cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Edit Details
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleToggleStatus(fr)} className="gap-2 cursor-pointer">
                          <Power className="h-3.5 w-3.5 text-muted-foreground" />
                          {isActive ? "Mark Inactive" : "Mark Active"}
                        </DropdownMenuItem>

                        {!isAssigned ? (
                          <DropdownMenuItem onClick={() => onAssign(fr)} className="gap-2 cursor-pointer text-emerald-600">
                            <UserCheck className="h-3.5 w-3.5" />
                            Assign Operator
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onUnassign(fr)} className="gap-2 cursor-pointer text-amber-600">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Release / Unassign
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => onManageDrivers?.(fr)}
                          className="gap-2 cursor-pointer text-primary"
                        >
                          <Users className="h-3.5 w-3.5" />
                          Manage Drivers ({drivers.length}/2)
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDelete(fr)}
                          disabled={deletingId === fr.id}
                          className="gap-2 text-destructive cursor-pointer focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Franchise
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* PAGINATION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{totalItems > 0 ? startIndex + 1 : 0}</strong> to{" "}
            <strong className="text-foreground">{endIndex}</strong> of{" "}
            <strong className="text-foreground">{totalItems.toLocaleString()}</strong> slots
          </span>
          {totalItems > pageSize && (
            <span className="text-muted-foreground/60 hidden sm:inline font-mono">
              (Page {safeCurrentPage} of {totalPages})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Per page:</span>
            <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
              {[10, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    pageSize === size
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Quick Page Jump Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - safeCurrentPage) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && p - prevPage > 1;
                  return (
                    <div key={p} className="flex items-center">
                      {hasGap && <span className="px-1 text-muted-foreground">...</span>}
                      <Button
                        variant={safeCurrentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs cursor-pointer font-mono"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
