"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Hash,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  Users,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { FranchiseList } from "./franchise-list";
import { FranchiseFormModal } from "./franchise-form-modal";
import { FranchiseAssignModal } from "./franchise-assign-modal";
import { FranchiseUnassignDialog } from "./franchise-unassign-dialog";
import { EnrollVehicleModal } from "./enroll-vehicle-modal";

interface FranchiseClientProps {
  initialFranchises: any[];
  availableOperators: any[];
  availableVehicles: any[];
  nextSuggestedNumber: number;
  operatorsWithoutVehicle?: any[];
}

export function FranchiseClient({
  initialFranchises,
  availableOperators,
  availableVehicles,
  nextSuggestedNumber,
  operatorsWithoutVehicle = [],
}: FranchiseClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingFranchise, setEditingFranchise] = useState<any | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [assigningFranchise, setAssigningFranchise] = useState<any | null>(null);

  const [enrollVehicleModalOpen, setEnrollVehicleModalOpen] = useState<boolean>(false);

  const [unassignDialogOpen, setUnassignDialogOpen] = useState<boolean>(false);
  const [unassigningFranchise, setUnassigningFranchise] = useState<any | null>(null);

  // Refresh handler
  const handleRefresh = () => {
    router.refresh();
  };

  // Open Create
  const handleCreateNew = () => {
    setEditingFranchise(null);
    setFormModalOpen(true);
  };

  // Open Edit
  const handleEdit = (franchise: any) => {
    setEditingFranchise(franchise);
    setFormModalOpen(true);
  };

  // Open Assign
  const handleAssign = (franchise: any) => {
    setAssigningFranchise(franchise);
    setAssignModalOpen(true);
  };

  // Open Unassign
  const handleUnassign = (franchise: any) => {
    setUnassigningFranchise(franchise);
    setUnassignDialogOpen(true);
  };

  // Derived KPI metrics
  const totalCount = initialFranchises.length;
  const assignedCount = initialFranchises.filter((f) => f.isAssigned && f.operator).length;
  const unassignedCount = initialFranchises.filter((f) => !f.isAssigned || !f.operator).length;
  const activeCount = initialFranchises.filter((f) => f.isActive).length;
  const assignedRate = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  // Filtered list
  const filteredFranchises = useMemo(() => {
    return initialFranchises.filter((fr) => {
      // Tab filter
      if (activeTab === "unassigned" && (fr.isAssigned && fr.operator)) return false;
      if (activeTab === "assigned" && (!fr.isAssigned || !fr.operator)) return false;
      if (activeTab === "active" && !fr.isActive) return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const bodyMatch = fr.franchiseBodyNumber.toString().includes(term);
      const zoneMatch = fr.zone?.toLowerCase().includes(term);
      const operatorMatch =
        fr.operator?.name?.toLowerCase().includes(term) ||
        fr.operator?.operatorId?.toLowerCase().includes(term) ||
        fr.operator?.mobileNo?.includes(term);
      const vehicleMatch =
        fr.mtopVehicle?.plateNumber?.toLowerCase().includes(term) ||
        fr.mtopVehicle?.make?.toLowerCase().includes(term) ||
        fr.mtopVehicle?.model?.toLowerCase().includes(term);
      const remarksMatch = fr.remarks?.toLowerCase().includes(term);

      return bodyMatch || zoneMatch || operatorMatch || vehicleMatch || remarksMatch;
    });
  }, [initialFranchises, activeTab, searchTerm]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </span>
            Franchise & Body Number Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            LGU Tagbilaran City MTOP Franchise Registry, Operator Assignment & Vehicle Pairing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEnrollVehicleModalOpen(true)}
            className="gap-2 font-semibold shadow-2xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Car className="h-4 w-4" />
            Enroll Vehicle
          </Button>
          <Button
            onClick={handleCreateNew}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Register Body Number
          </Button>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Slots */}
        <Card
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer transition-all hover:border-primary/50 shadow-2xs ${
            activeTab === "all" ? "ring-2 ring-primary/20 border-primary" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Franchises</span>
              <Hash className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground font-mono mt-1">
              {totalCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            Registered body number slots in database
          </CardContent>
        </Card>

        {/* Unassigned Pool */}
        <Card
          onClick={() => setActiveTab("unassigned")}
          className={`cursor-pointer transition-all hover:border-amber-500/50 shadow-2xs ${
            activeTab === "unassigned" ? "ring-2 ring-amber-500/20 border-amber-500" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Pool</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
              {unassignedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            Ready for operator & vehicle assignment
          </CardContent>
        </Card>

        {/* Assigned */}
        <Card
          onClick={() => setActiveTab("assigned")}
          className={`cursor-pointer transition-all hover:border-emerald-500/50 shadow-2xs ${
            activeTab === "assigned" ? "ring-2 ring-emerald-500/20 border-emerald-500" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Assigned Franchises</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 flex items-baseline gap-2">
              {assignedCount}
              <span className="text-xs font-sans font-normal text-muted-foreground">
                ({assignedRate}%)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            Paired with active tricycle operators
          </CardContent>
        </Card>

        {/* Active Service */}
        <Card
          onClick={() => setActiveTab("active")}
          className={`cursor-pointer transition-all hover:border-blue-500/50 shadow-2xs ${
            activeTab === "active" ? "ring-2 ring-blue-500/20 border-blue-500" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Road Units</span>
              <Car className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1">
              {activeCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            Currently authorized for street operation
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Body #, Operator Name, OP-ID, Plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Tabs Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="grid grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs font-semibold px-3">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="text-xs font-semibold px-3 text-amber-700 dark:text-amber-400">
              Unassigned ({unassignedCount})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs font-semibold px-3 text-emerald-700 dark:text-emerald-400">
              Assigned ({assignedCount})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs font-semibold px-3">
              Active ({activeCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* FRANCHISE LIST TABLE */}
      <FranchiseList
        franchises={filteredFranchises}
        searchTerm={searchTerm}
        onAssign={handleAssign}
        onEdit={handleEdit}
        onUnassign={handleUnassign}
        onRefresh={handleRefresh}
      />

      {/* FORM MODAL (Create/Edit) */}
      <FranchiseFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        franchise={editingFranchise}
        suggestedBodyNumber={nextSuggestedNumber}
        onSuccess={handleRefresh}
      />

      {/* ASSIGN MODAL */}
      <FranchiseAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        franchise={assigningFranchise}
        availableOperators={availableOperators}
        availableVehicles={availableVehicles}
        onSuccess={handleRefresh}
      />

      {/* ENROLL VEHICLE MODAL (STANDALONE) */}
      <EnrollVehicleModal
        open={enrollVehicleModalOpen}
        onOpenChange={setEnrollVehicleModalOpen}
        operators={operatorsWithoutVehicle}
        onSuccess={handleRefresh}
      />

      {/* UNASSIGN CONFIRMATION DIALOG */}
      <FranchiseUnassignDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
        franchise={unassigningFranchise}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
