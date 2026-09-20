"use client";

import { useState } from "react";
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
  X,
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
  onClearSearch,
  onError,
}: FranchiseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          {franchises.map((fr) => {
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

                {/* Operator Details */}
                <TableCell>
                  {fr.operator ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border">
                        {fr.operator.profilePicture ? (
                          <img
                            src={fr.operator.profilePicture}
                            alt={fr.operator.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{fr.operator.name}</div>
                        <div className="text-xs font-mono text-primary flex items-center gap-2">
                          <span>{fr.operator.operatorId}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground font-sans">{fr.operator.mobileNo}</span>
                        </div>
                      </div>
                    </div>
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
                        className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Assign Operator
                      </Button>
                    </div>
                  )}
                </TableCell>

                {/* Vehicle Details */}
                <TableCell>
                  {fr.mtopVehicle ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono font-bold text-xs bg-muted/40 tracking-wider">
                          {fr.mtopVehicle.plateNumber}
                        </Badge>
                        <span className="text-xs font-medium text-foreground truncate">
                          {fr.mtopVehicle.make} {fr.mtopVehicle.model}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {fr.mtopVehicle.color} • {fr.mtopVehicle.year}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No Vehicle Linked</span>
                  )}
                </TableCell>

                {/* Assigned Drivers (Max 2) */}
                <TableCell>
                  <div className="space-y-1.5 min-w-[170px]">
                    {drivers.length > 0 ? (
                      <div className="space-y-1">
                        {primaryDriver && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 gap-1 px-1.5 py-0 text-[10px] font-medium shrink-0">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              Primary
                            </Badge>
                            <span className="font-medium text-foreground truncate">
                              {primaryDriver.firstName} {primaryDriver.lastName}
                            </span>
                          </div>
                        )}
                        {secondaryDriver && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 gap-1 px-1.5 py-0 text-[10px] font-medium shrink-0">
                              <ShieldCheck className="h-2.5 w-2.5 text-blue-500" />
                              Relief
                            </Badge>
                            <span className="font-medium text-foreground truncate">
                              {secondaryDriver.firstName} {secondaryDriver.lastName}
                            </span>
                          </div>
                        )}
                        <div className="pt-0.5">
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
                          className="h-6 px-2 text-[10px] gap-1 border-dashed hover:border-primary hover:text-primary"
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
                        className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Assign
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUnassign(fr)}
                        className="h-8 gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Release
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Manage Body #{fr.franchiseBodyNumber}</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />

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
    </div>
  );
}
