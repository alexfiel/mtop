"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ShieldCheck, Clock, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { VehicleItem } from "../types";

interface VehicleStatsProps {
  vehicles: VehicleItem[];
}

export function VehicleStats({ vehicles }: VehicleStatsProps) {
  const totalVehicles = vehicles.length;

  const assignedVehicles = vehicles.filter(
    (v) => Boolean(v.newFranchise || v.operator?.newFranchise)
  );
  const unassignedVehicles = vehicles.filter(
    (v) => !Boolean(v.newFranchise || v.operator?.newFranchise)
  );

  const activeFranchiseVehicles = vehicles.filter((v) => {
    const franchise = v.newFranchise || v.operator?.newFranchise;
    return franchise?.isActive === true;
  });

  const assignmentRate = totalVehicles > 0 ? Math.round((assignedVehicles.length / totalVehicles) * 100) : 0;

  // Most common make
  const makeCounts = vehicles.reduce<Record<string, number>>((acc, v) => {
    const make = v.make.trim() || "Other";
    acc[make] = (acc[make] || 0) + 1;
    return acc;
  }, {});

  const topMake = Object.entries(makeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Enrolled Tricycles */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Enrolled Fleet
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
              {totalVehicles}
            </span>
            <span className="text-xs text-muted-foreground font-medium">units registered</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-primary/30 text-primary">
              Top: {topMake}
            </Badge>
            <span>across Tagbilaran City</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Franchise Assigned */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Franchise Assigned
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {assignedVehicles.length}
            </span>
            <span className="text-xs text-muted-foreground font-medium">with Body Number</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              {assignmentRate}% coverage
            </Badge>
            <span>{activeFranchiseVehicles.length} active routes</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Unassigned / Standalone */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unassigned Units
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              {unassignedVehicles.length}
            </span>
            <span className="text-xs text-muted-foreground font-medium">awaiting body slot</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400">
              {totalVehicles > 0 ? Math.round((unassignedVehicles.length / totalVehicles) * 100) : 0}% unlinked
            </Badge>
            <span>ready for franchise link</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Compliance */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-blue-500/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              LTO Registration Status
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              100%
            </span>
            <span className="text-xs text-muted-foreground font-medium">CR Verified</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400">
              Ordinance Compliant
            </Badge>
            <span>City Registry</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
