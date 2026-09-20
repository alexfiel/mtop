"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, ShieldCheck, UserMinus } from "lucide-react";
import type { DriverItem } from "../types";

interface DriverStatsProps {
  drivers: DriverItem[];
}

export function DriverStats({ drivers }: DriverStatsProps) {
  const total = drivers.length;
  const primaryCount = drivers.filter((d) => d.driverRole === "PRIMARY").length;
  const secondaryCount = drivers.filter((d) => d.driverRole === "SECONDARY").length;
  const standalone = drivers.filter((d) => !Boolean(d.operatorId || d.newFranchiseId)).length;

  const primaryPercent = total > 0 ? Math.round((primaryCount / total) * 100) : 0;
  const secondaryPercent = total > 0 ? Math.round((secondaryCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Registered Drivers */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Fleet Drivers
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
              {total}
            </span>
            <span className="text-xs text-muted-foreground font-medium">registered</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-primary/30 text-primary">
              City Registry
            </Badge>
            <span>Tagbilaran MTOP Drivers</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Primary Drivers */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Drivers
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="h-4 w-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              {primaryCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">main operators</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400">
              {primaryPercent}% fleet
            </Badge>
            <span>Full-time unit pilots</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Secondary Drivers */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-blue-500/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Secondary Drivers
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              {secondaryCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">relief operators</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400">
              {secondaryPercent}% fleet
            </Badge>
            <span>Alternate shift drivers</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Standalone Pool */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-slate-500/5 shadow-xs hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Standalone Pool
            </span>
            <div className="p-2 rounded-xl bg-muted text-muted-foreground border">
              <UserMinus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
              {standalone}
            </span>
            <span className="text-xs text-muted-foreground font-medium">unassigned</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-muted-foreground">
              Available
            </Badge>
            <span>Ready for attachment</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
