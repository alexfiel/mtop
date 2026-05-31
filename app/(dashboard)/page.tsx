import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const [
    totalDrivers,
    activeFranchises,
    pendingRenewals,
    unpaidViolations,
  ] = await Promise.all([
    prisma.driver.count(),
    prisma.franchise.count({ where: { status: "ACTIVE" } }),
    prisma.franchise.count({ where: { isRenewal: true, status: "PENDING" } }),
    prisma.violation.count({ where: { status: "UNPAID" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Overview of the MTOP System and statistics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrivers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time registered drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Franchises</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFranchises.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently active MTOP franchises</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Renewals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{pendingRenewals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires immediate review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{unpaidViolations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting settlement</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center justify-center h-48 border rounded-md border-dashed">
              Activity chart module pending integration.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-sm text-muted-foreground flex flex-col items-center justify-center h-48 border rounded-md border-dashed p-6 text-center space-y-2">
                <p><strong>MTOP Management System</strong></p>
                <p>All core modules (Drivers, Franchises, Tricycles, Users) are active and auditing transactions.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
