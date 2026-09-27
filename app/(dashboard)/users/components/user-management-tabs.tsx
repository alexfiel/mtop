"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserList, UserType } from "./user-list";
import { DomainList } from "./domain-list";
import { DomainItem } from "./domain-dialog";
import { Users, Building2, ShieldCheck, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RoleType = { id: string; name: string };

interface UserManagementTabsProps {
  users: UserType[];
  roles: RoleType[];
  domains: DomainItem[];
}

export function UserManagementTabs({ users, roles, domains }: UserManagementTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "domains" ? "domains" : "users";
  const [activeTab, setActiveTab] = useState<"users" | "domains">(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "domains" || tabParam === "users") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab: "users" | "domains") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/users?${params.toString()}`);
  };

  // Metrics
  const totalUsers = users.length;
  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const disabledUsersCount = users.filter((u) => u.isActive === false).length;
  const totalDomains = domains.length;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold tracking-tight">{totalUsers}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Users</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600">{activeUsersCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Access Revoked</p>
              <p className={`text-2xl font-bold tracking-tight ${disabledUsersCount > 0 ? "text-destructive" : ""}`}>
                {disabledUsersCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Domains & Offices</p>
              <p className="text-2xl font-bold tracking-tight">{totalDomains}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => switchTab("users")}
          className="flex items-center gap-2 font-medium"
        >
          <Users className="h-4 w-4" />
          <span>System Users</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "users"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {totalUsers}
          </span>
        </Button>

        <Button
          variant={activeTab === "domains" ? "default" : "outline"}
          onClick={() => switchTab("domains")}
          className="flex items-center gap-2 font-medium"
        >
          <Building2 className="h-4 w-4" />
          <span>Domains & Offices</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "domains"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {totalDomains}
          </span>
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "users" ? (
        <UserList users={users} roles={roles} domains={domains} />
      ) : (
        <DomainList domains={domains} />
      )}
    </div>
  );
}
