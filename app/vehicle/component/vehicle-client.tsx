"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
  Award,
} from "lucide-react";
import { VehicleStats } from "./vehicle-stats";
import { VehicleList } from "./vehicle-list";
import { VehicleDetailModal } from "./vehicle-detail-modal";
import { VehicleEditModal } from "./vehicle-edit-modal";
import { EnrollVehicleModal } from "./enroll-vehicle-modal";
import { VehicleItem, OperatorOption } from "../types";

interface VehicleClientProps {
  initialVehicles: VehicleItem[];
  operatorsWithoutVehicle: OperatorOption[];
}

export function VehicleClient({
  initialVehicles,
  operatorsWithoutVehicle,
}: VehicleClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<VehicleItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<VehicleItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleViewDetails = (vehicle: VehicleItem) => {
    setSelectedVehicleForDetail(vehicle);
    setDetailModalOpen(true);
  };

  const handleEdit = (vehicle: VehicleItem) => {
    setSelectedVehicleForEdit(vehicle);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Car className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                MTOP Vehicle Registry & Fleet Dashboard
                <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 hidden md:inline-flex">
                  Model: MTOPVehicle
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official motorized tricycle unit registry, LTO certification, operator linkage, and franchise assignment status
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8.5 text-xs gap-1.5"
            title="Refresh registry data"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setEnrollModalOpen(true)}
            className="h-8.5 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Enroll New Vehicle</span>
          </Button>
        </div>
      </div>

      {/* METRICS & FLEET STATISTICS */}
      <VehicleStats vehicles={initialVehicles} />

      {/* VEHICLES DIRECTORY & LIST */}
      <VehicleList
        vehicles={initialVehicles}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onEnrollNew={() => setEnrollModalOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* ENROLL VEHICLE MODAL */}
      <EnrollVehicleModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        operators={operatorsWithoutVehicle}
        onSuccess={handleRefresh}
      />

      {/* DETAIL MODAL */}
      <VehicleDetailModal
        vehicle={selectedVehicleForDetail}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleEdit}
      />

      {/* EDIT MODAL */}
      <VehicleEditModal
        vehicle={selectedVehicleForEdit}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
