"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  RotateCcw,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import { DriverStats } from "./driver-stats";
import { DriverList } from "./driver-list";
import { DriverRegistration } from "./driver-registration";
import { getDrivers } from "../actions";
import { toast } from "sonner";
import type {
  DriverItem,
  OperatorOptionForDriver,
  FranchiseOptionForDriver,
} from "../types";

interface DriverClientProps {
  initialDrivers: DriverItem[];
  operators: OperatorOptionForDriver[];
  franchises: FranchiseOptionForDriver[];
}

export function DriverClient({
  initialDrivers,
  operators,
  franchises,
}: DriverClientProps) {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverItem[]>(initialDrivers);
  const [activeTab, setActiveTab] = useState<"list" | "register">("list");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getDrivers();
      if (res.success && res.drivers) {
        setDrivers(res.drivers as unknown as DriverItem[]);
        toast.success("Driver records refreshed.");
      } else {
        router.refresh();
      }
    } catch (err) {
      router.refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRegistrationSuccess = async () => {
    await handleRefresh();
    setActiveTab("list");
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Driver Management
            </h1>
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              City Registry & Pool
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tricycle drivers, biometric records, LTO licenses, and attachments to operators & franchise body numbers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 h-9"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {activeTab === "list" ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveTab("register")}
              className="text-xs gap-1.5 h-9 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Register New Driver
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("list")}
              className="text-xs gap-1.5 h-9"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Driver Directory
            </Button>
          )}
        </div>
      </div>

      {/* KPI STATS */}
      <DriverStats drivers={drivers} />

      {/* TAB VIEWS */}
      {activeTab === "list" ? (
        <DriverList
          drivers={drivers}
          operators={operators}
          franchises={franchises}
          onRefresh={handleRefresh}
          onRegisterClick={() => setActiveTab("register")}
        />
      ) : (
        <DriverRegistration
          operators={operators}
          franchises={franchises}
          onSuccess={handleRegistrationSuccess}
          onCancel={() => setActiveTab("list")}
        />
      )}
    </div>
  );
}
