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
import { EnrollVehicleModal } from "@/app/vehicle/component/enroll-vehicle-modal";
import { UnitDriversModal } from "@/app/driver/component/unit-drivers-modal";
import { VehicleDetailModal } from "@/app/vehicle/component/vehicle-detail-modal";
import { DriverDetailModal } from "@/app/driver/component/driver-detail-modal";
import { OperatorDetailModal } from "@/app/operator/component/operator-detail-modal";
import { FranchiseApplicationModal } from "./franchise-application-modal";
import type { VehicleItem } from "@/app/vehicle/types";
import type { DriverItem } from "@/app/driver/types";

import { getVehicleById } from "@/app/vehicle/actions";
import { getDriverById } from "@/app/driver/actions";
import { getOperatorById } from "@/app/operator/actions";

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

  const [manageDriversFranchise, setManageDriversFranchise] = useState<any | null>(null);

  // Application Workflow Modal state
  const [applicationModalOpen, setApplicationModalOpen] = useState<boolean>(false);
  const [selectedApplicationFranchise, setSelectedApplicationFranchise] = useState<any | null>(null);

  // Link View detail modals state
  const [viewingVehicle, setViewingVehicle] = useState<VehicleItem | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState<boolean>(false);

  const [viewingDriver, setViewingDriver] = useState<DriverItem | null>(null);
  const [driverModalOpen, setDriverModalOpen] = useState<boolean>(false);

  const [viewingOperator, setViewingOperator] = useState<any | null>(null);
  const [operatorModalOpen, setOperatorModalOpen] = useState<boolean>(false);

  const currentManageDriversFranchise =
    initialFranchises.find((f) => f.id === manageDriversFranchise?.id) || manageDriversFranchise;

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

  // Link View Handlers (Zero-latency immediate modal open + on-demand hydration)
  const handleViewVehicle = (vehicle: any, franchise: any) => {
    if (!vehicle) return;
    const initialVehicle: VehicleItem = {
      ...vehicle,
      operator: vehicle.operator || franchise?.operator || null,
      newFranchise: franchise
        ? {
            id: franchise.id,
            franchiseBodyNumber: franchise.franchiseBodyNumber,
            zone: franchise.zone,
            isActive: franchise.isActive,
            remarks: franchise.remarks,
          }
        : null,
    };
    setViewingVehicle(initialVehicle);
    setVehicleModalOpen(true);

    // Hydrate complete specs, engine, chassis, and docs in background
    if (vehicle.id) {
      getVehicleById(vehicle.id).then((res) => {
        if (res?.success && res.vehicle) {
          setViewingVehicle((prev) => {
            if (prev && prev.id === vehicle.id) {
              return {
                ...prev,
                ...res.vehicle,
                operator: res.vehicle.operator || prev.operator,
                newFranchise: res.vehicle.newFranchise || prev.newFranchise,
              };
            }
            return prev;
          });
        }
      });
    }
  };

  const handleViewDriver = (driver: any, franchise: any) => {
    if (!driver) return;
    const initialDriver: DriverItem = {
      ...driver,
      operator: driver.operator || franchise?.operator || null,
      newFranchise: franchise
        ? {
            id: franchise.id,
            franchiseBodyNumber: franchise.franchiseBodyNumber,
            zone: franchise.zone,
            mtopVehicle: franchise.mtopVehicle
              ? {
                  id: franchise.mtopVehicle.id,
                  plateNumber: franchise.mtopVehicle.plateNumber,
                  make: franchise.mtopVehicle.make,
                  model: franchise.mtopVehicle.model,
                }
              : null,
          }
        : null,
      attachmentHistory: driver.attachmentHistory || [],
    };
    setViewingDriver(initialDriver);
    setDriverModalOpen(true);

    // Hydrate complete credentials and assignment history in background
    if (driver.id) {
      getDriverById(driver.id).then((res) => {
        if (res?.success && res.driver) {
          setViewingDriver((prev) => {
            if (prev && prev.id === driver.id) {
              return {
                ...prev,
                ...res.driver,
                driverRole: (res.driver.driverRole as "PRIMARY" | "SECONDARY" | null) ?? prev.driverRole,
                operator: res.driver.operator || prev.operator,
                newFranchise: res.driver.newFranchise || prev.newFranchise,
                attachmentHistory: (res.driver.attachmentHistory as any) || prev.attachmentHistory,
              };
            }
            return prev;
          });
        }
      });
    }
  };

  const handleViewOperator = (operator: any, franchise: any) => {
    if (!operator) return;
    const initialOperator = {
      ...operator,
      newFranchise: franchise || operator.newFranchise || null,
      vehicle: franchise?.mtopVehicle || operator.vehicle || null,
      drivers: franchise?.drivers || operator.drivers || [],
    };
    setViewingOperator(initialOperator);
    setOperatorModalOpen(true);

    // Hydrate complete operator record in background
    if (operator.id) {
      getOperatorById(operator.id).then((fullOp) => {
        if (fullOp) {
          setViewingOperator((prev: any) => {
            if (prev && prev.id === operator.id) {
              return {
                ...prev,
                ...fullOp,
                newFranchise: fullOp.newFranchise || prev.newFranchise,
                vehicle: fullOp.vehicle || prev.vehicle,
                drivers: fullOp.drivers || prev.drivers,
              };
            }
            return prev;
          });
        }
      });
    }
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
      const driverMatch =
        fr.drivers &&
        fr.drivers.some(
          (d: any) =>
            `${d.firstName} ${d.lastName}`.toLowerCase().includes(term) ||
            d.driverId?.toLowerCase().includes(term) ||
            d.licenseNo?.toLowerCase().includes(term)
        );
      const remarksMatch = fr.remarks?.toLowerCase().includes(term);

      return bodyMatch || zoneMatch || operatorMatch || vehicleMatch || driverMatch || remarksMatch;
    });
  }, [initialFranchises, activeTab, searchTerm]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
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
            className="gap-2 font-semibold shadow-2xs border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Car className="h-4 w-4" />
            Enroll Vehicle
          </Button>
          <Button
            onClick={handleCreateNew}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer"
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
            placeholder="Search by Body #, Operator Name, OP-ID, Plate, Driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Tabs Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="grid grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs font-semibold px-3 cursor-pointer">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="text-xs font-semibold px-3 text-amber-700 dark:text-amber-400 cursor-pointer">
              Unassigned ({unassignedCount})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs font-semibold px-3 text-emerald-700 dark:text-emerald-400 cursor-pointer">
              Assigned ({assignedCount})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs font-semibold px-3 cursor-pointer">
              Active ({activeCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* FRANCHISE LIST TABLE WITH LINK VIEWS */}
      <FranchiseList
        franchises={filteredFranchises}
        searchTerm={searchTerm}
        onAssign={handleAssign}
        onEdit={handleEdit}
        onUnassign={handleUnassign}
        onRefresh={handleRefresh}
        onManageDrivers={setManageDriversFranchise}
        onViewVehicle={handleViewVehicle}
        onViewDriver={handleViewDriver}
        onViewOperator={handleViewOperator}
        onViewApplication={(franchise) => {
          setSelectedApplicationFranchise(franchise);
          setApplicationModalOpen(true);
        }}
      />

      {/* VEHICLE DETAIL MODAL (LINK VIEW) */}
      <VehicleDetailModal
        vehicle={viewingVehicle}
        open={vehicleModalOpen}
        onOpenChange={(open) => {
          setVehicleModalOpen(open);
          if (!open) setViewingVehicle(null);
        }}
        onEdit={(vehicle) => {
          setVehicleModalOpen(false);
          router.push(`/vehicle?search=${vehicle.plateNumber}`);
        }}
      />

      {/* DRIVER DETAIL MODAL (LINK VIEW) */}
      <DriverDetailModal
        driver={viewingDriver}
        isOpen={driverModalOpen}
        onClose={() => {
          setDriverModalOpen(false);
          setViewingDriver(null);
        }}
        onEdit={(driver) => {
          setDriverModalOpen(false);
          router.push(`/driver?search=${driver.licenseNo}`);
        }}
      />

      {/* OPERATOR DETAIL MODAL (LINK VIEW) */}
      <OperatorDetailModal
        operator={viewingOperator}
        open={operatorModalOpen}
        onOpenChange={(open) => {
          setOperatorModalOpen(open);
          if (!open) setViewingOperator(null);
        }}
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

      {/* MANAGE FRANCHISE DRIVERS MODAL */}
      <UnitDriversModal
        isOpen={Boolean(currentManageDriversFranchise)}
        onClose={() => setManageDriversFranchise(null)}
        targetType="franchise"
        targetId={currentManageDriversFranchise?.id || ""}
        targetTitle={`Franchise Body #${currentManageDriversFranchise?.franchiseBodyNumber}`}
        targetSubtext={`Zone: ${currentManageDriversFranchise?.zone || "Tagbilaran City"}${
          currentManageDriversFranchise?.operator ? ` • Operator: ${currentManageDriversFranchise.operator.name}` : ""
        }`}
        drivers={currentManageDriversFranchise?.drivers || []}
        onSuccess={() => {
          setManageDriversFranchise(null);
          handleRefresh();
        }}
      />

      {/* FRANCHISE APPLICATION WORKFLOW ENGINE MODAL */}
      <FranchiseApplicationModal
        open={applicationModalOpen}
        onOpenChange={(open) => {
          setApplicationModalOpen(open);
          if (!open) setSelectedApplicationFranchise(null);
        }}
        franchise={selectedApplicationFranchise}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
