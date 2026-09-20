"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Car,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  FileSpreadsheet,
  PlusCircle,
  Hash,
  ShieldCheck,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { deleteVehicle } from "../actions";
import { VehicleItem } from "../types";

interface VehicleListProps {
  vehicles: VehicleItem[];
  onViewDetails: (vehicle: VehicleItem) => void;
  onEdit: (vehicle: VehicleItem) => void;
  onEnrollNew: () => void;
  onRefresh: () => void;
}

export function VehicleList({
  vehicles,
  onViewDetails,
  onEdit,
  onEnrollNew,
  onRefresh,
}: VehicleListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [selectedMake, setSelectedMake] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique makes for filtering
  const availableMakes = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => {
      if (v.make?.trim()) set.add(v.make.trim());
    });
    return Array.from(set).sort();
  }, [vehicles]);

  // Filter logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      const franchise = v.newFranchise || v.operator?.newFranchise;
      const bodyNo = franchise?.franchiseBodyNumber ? String(franchise.franchiseBodyNumber) : "";

      const matchesSearch =
        !term ||
        v.plateNumber?.toLowerCase().includes(term) ||
        v.registrationNumber?.toLowerCase().includes(term) ||
        v.engineNumber?.toLowerCase().includes(term) ||
        v.chassisNumber?.toLowerCase().includes(term) ||
        v.make?.toLowerCase().includes(term) ||
        v.model?.toLowerCase().includes(term) ||
        v.registeredOwnerName?.toLowerCase().includes(term) ||
        v.operator?.name?.toLowerCase().includes(term) ||
        v.operator?.operatorId?.toLowerCase().includes(term) ||
        bodyNo.includes(term);

      if (!matchesSearch) return false;

      // 2. Status filter
      const isAssigned = Boolean(franchise);
      if (statusFilter === "assigned" && !isAssigned) return false;
      if (statusFilter === "unassigned" && isAssigned) return false;

      // 3. Make filter
      if (selectedMake !== "all" && v.make.trim().toLowerCase() !== selectedMake.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [vehicles, searchTerm, statusFilter, selectedMake]);

  // Counts for tabs
  const assignedCount = vehicles.filter((v) => Boolean(v.newFranchise || v.operator?.newFranchise)).length;
  const unassignedCount = vehicles.length - assignedCount;

  // Handle Delete
  const handleDelete = async (vehicle: VehicleItem) => {
    if (
      !confirm(
        `Are you sure you want to delete vehicle with Plate '${vehicle.plateNumber}'? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(vehicle.id);
    try {
      const res = await deleteVehicle(vehicle.id);
      if (res.success) {
        toast.success(`Vehicle ${vehicle.plateNumber} deleted.`);
        onRefresh();
      } else {
        toast.error(res.error || "Failed to delete vehicle.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredVehicles.length === 0) {
      toast.error("No vehicles to export.");
      return;
    }

    const headers = [
      "Plate Number",
      "CR Number",
      "Make",
      "Model",
      "Year",
      "Color",
      "Engine Number",
      "Chassis Number",
      "Registered Owner",
      "Operator Name",
      "Operator ID",
      "Franchise Body No",
      "Franchise Status",
      "Date Enrolled",
    ];

    const rows = filteredVehicles.map((v) => {
      const franchise = v.newFranchise || v.operator?.newFranchise;
      return [
        `"${v.plateNumber}"`,
        `"${v.registrationNumber}"`,
        `"${v.make}"`,
        `"${v.model}"`,
        v.year,
        `"${v.color}"`,
        `"${v.engineNumber}"`,
        `"${v.chassisNumber}"`,
        `"${v.registeredOwnerName}"`,
        `"${v.operator?.name || ""}"`,
        `"${v.operator?.operatorId || ""}"`,
        `"${franchise?.franchiseBodyNumber || "Unassigned"}"`,
        `"${franchise ? (franchise.isActive ? "ACTIVE" : "INACTIVE") : "UNASSIGNED"}"`,
        `"${new Date(v.createdAt).toLocaleDateString()}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mtop_vehicles_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vehicle registry exported to CSV.");
  };

  return (
    <div className="space-y-4">
      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card border rounded-xl p-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by plate, CR #, engine, chassis, operator, body #..."
            className="pl-8.5 h-8.5 text-xs bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Button
            type="button"
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs font-semibold"
          >
            All ({vehicles.length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "assigned" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("assigned")}
            className="h-8 text-xs font-semibold gap-1"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Assigned ({assignedCount})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "unassigned" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("unassigned")}
            className="h-8 text-xs font-semibold gap-1"
          >
            <Clock className="h-3 w-3 text-amber-500" />
            Unassigned ({unassignedCount})
          </Button>

          {/* Make Filter Dropdown */}
          {availableMakes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium text-foreground cursor-pointer outline-none transition-colors">
                <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                <span>{selectedMake === "all" ? "Make" : selectedMake}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">Filter by Make</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSelectedMake("all")}
                  className={`text-xs ${selectedMake === "all" ? "font-bold text-primary" : ""}`}
                >
                  All Makes
                </DropdownMenuItem>
                {availableMakes.map((make) => (
                  <DropdownMenuItem
                    key={make}
                    onClick={() => setSelectedMake(make)}
                    className={`text-xs ${selectedMake === make ? "font-bold text-primary" : ""}`}
                  >
                    {make}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            title="Export to CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Enroll Vehicle Button */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onEnrollNew}
            className="h-8 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Enroll Vehicle</span>
          </Button>
        </div>
      </div>

      {/* VEHICLES DATA TABLE */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] text-[11px] font-bold uppercase tracking-wider">
                  Vehicle Specs
                </TableHead>
                <TableHead className="w-[160px] text-[11px] font-bold uppercase tracking-wider">
                  LTO Identification
                </TableHead>
                <TableHead className="w-[180px] text-[11px] font-bold uppercase tracking-wider">
                  Engine & Chassis
                </TableHead>
                <TableHead className="w-[220px] text-[11px] font-bold uppercase tracking-wider">
                  Registered Operator
                </TableHead>
                <TableHead className="w-[160px] text-[11px] font-bold uppercase tracking-wider">
                  Franchise Status
                </TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold uppercase tracking-wider">
                  Enrolled
                </TableHead>
                <TableHead className="w-[70px] text-right text-[11px] font-bold uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => {
                  const franchise = vehicle.newFranchise || vehicle.operator?.newFranchise;
                  const isFranchiseActive = franchise?.isActive;

                  return (
                    <TableRow key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                      {/* VEHICLE SPECS */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2.5">
                          {vehicle.vehicleImage ? (
                            <img
                              src={vehicle.vehicleImage}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              className="h-10 w-12 rounded-lg object-cover border border-primary/30 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => onViewDetails(vehicle)}
                            />
                          ) : (
                            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                              <Car className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              <span>{vehicle.make} {vehicle.model}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{vehicle.year}</span>
                              <span>•</span>
                              <span className="truncate max-w-[100px]">{vehicle.color}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* LTO IDENTIFICATION */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          {/* Mini Plate Box */}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/30 font-mono text-xs font-bold tracking-wider text-foreground">
                            {vehicle.plateNumber}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            CR: {vehicle.registrationNumber}
                          </div>
                          <div className="flex items-center gap-1 pt-0.5">
                            {vehicle.ltoCrDocument ? (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20" title="CR Document Attached">
                                CR ✓
                              </span>
                            ) : (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono" title="No CR Document">
                                CR –
                              </span>
                            )}
                            {vehicle.ltoOrDocument ? (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20" title="OR Document Attached">
                                OR ✓
                              </span>
                            ) : (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono" title="No OR Document">
                                OR –
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* SERIAL NUMBERS */}
                      <TableCell className="align-middle">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="text-foreground">
                            <span className="text-muted-foreground text-[10px]">ENG: </span>
                            {vehicle.engineNumber}
                          </div>
                          <div className="text-muted-foreground">
                            <span className="text-muted-foreground text-[10px]">CHA: </span>
                            {vehicle.chassisNumber}
                          </div>
                        </div>
                      </TableCell>

                      {/* REGISTERED OPERATOR */}
                      <TableCell className="align-middle">
                        {vehicle.operator ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                              <span>{vehicle.operator.name}</span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-primary/30 text-primary">
                                {vehicle.operator.operatorId}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {vehicle.operator.address}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Operator</span>
                        )}
                      </TableCell>

                      {/* FRANCHISE STATUS */}
                      <TableCell className="align-middle">
                        {franchise ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={isFranchiseActive ? "default" : "secondary"}
                                className={`text-[10px] font-mono font-bold ${
                                  isFranchiseActive
                                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                    : "bg-amber-500 hover:bg-amber-500 text-white"
                                }`}
                              >
                                BODY #{franchise.franchiseBodyNumber}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {isFranchiseActive ? "Active Permit" : "Inactive Franchise"}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>

                      {/* DATE ENROLLED */}
                      <TableCell className="align-middle text-xs text-muted-foreground font-mono">
                        {new Date(vehicle.createdAt).toLocaleDateString()}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none transition-colors">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs">Vehicle Actions</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onViewDetails(vehicle)}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              View Certificate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEdit(vehicle)}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                              Edit Specifications
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(vehicle)}
                              disabled={deletingId === vehicle.id || Boolean(franchise)}
                              className="text-xs gap-2 text-destructive cursor-pointer focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {franchise ? "Unassign Body First" : "Delete Vehicle"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <div className="p-3 rounded-full bg-muted">
                        <Car className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No Registered Vehicles Found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchTerm || statusFilter !== "all" || selectedMake !== "all"
                          ? "No vehicles match your active search or filter criteria. Try resetting filters."
                          : "No motorized tricycle units have been enrolled yet. Click 'Enroll Vehicle' to register the first unit."}
                      </p>
                      {(searchTerm || statusFilter !== "all" || selectedMake !== "all") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                            setSelectedMake("all");
                          }}
                          className="text-xs mt-2"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* TABLE FOOTER SUMMARY */}
        <div className="p-3 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground gap-2">
          <span>
            Showing <strong>{filteredVehicles.length}</strong> of <strong>{vehicles.length}</strong> total registered vehicles
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Assigned: {assignedCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              Unassigned: {unassignedCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
