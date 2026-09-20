"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Search,
  PlusCircle,
  FileText,
  User,
  Car,
  Filter,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Send,
  Layers,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  FranchiseApplication,
  DomainType,
  UserRoleType,
} from "@/app/franchise/component/franchise-application";

interface OperatorData {
  id: string;
  name: string;
  email?: string | null;
  mobileNo?: string | null;
}

interface VehicleData {
  id: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
}

interface FranchiseItem {
  id: string;
  franchiseBodyNumber: number;
  zone?: string | null;
  status?: string;
  isActive?: boolean;
  isAssigned?: boolean;
  operator?: OperatorData | null;
  mtopVehicle?: VehicleData | null;
  drivers?: any[];
}

interface FranchiseApplicationClientProps {
  initialFranchises: FranchiseItem[];
  availableOperators?: any[];
  availableVehicles?: any[];
  unassignedBodyNumbers?: any[];
}

// Pre-defined demo user personas to allow seamless domain switching & testing
const USER_PERSONAS = [
  {
    id: "ctmo-officer-1",
    name: "Engr. Roberto Santos (CTMO)",
    domain: "TRAFFIC" as DomainType,
    role: "STAFF" as UserRoleType,
    title: "CTMO Vehicle Inspector",
  },
  {
    id: "bplo-officer-1",
    name: "Elena Vasquez (BPLO)",
    domain: "BPLO" as DomainType,
    role: "STAFF" as UserRoleType,
    title: "BPLO Receiving & Delinquency Officer",
  },
  {
    id: "sp-member-1",
    name: "Hon. Gabriel Lim (SP Council)",
    domain: "SP" as DomainType,
    role: "SUPERVISOR" as UserRoleType,
    title: "SP Committee Chairman",
  },
  {
    id: "treasury-officer-1",
    name: "Marcus Tan (Treasury)",
    domain: "TREASURY" as DomainType,
    role: "STAFF" as UserRoleType,
    title: "eTRACS Treasury Officer",
  },
  {
    id: "mayor-admin-1",
    name: "Atty. Clara Gomez (Mayor/Admin)",
    domain: "BPLO" as DomainType,
    role: "ADMIN" as UserRoleType,
    title: "Executive Permit Administrator",
  },
];

interface ApplicationListItem {
  id: string;
  franchiseId: string;
  applicationNumber: string;
  bodyNumber: number;
  applicantName: string;
  currentDomain: DomainType;
  taskName: string;
  taskStatus: "PENDING" | "ASSIGNED" | "COMPLETED";
  assignedUserId: string | null;
  assignedUserName: string | null;
  plateNumber: string;
  makeModel: string;
  updatedAt: string;
  createdAt: string;
}

export function FranchiseApplicationClient({
  initialFranchises,
}: FranchiseApplicationClientProps) {
  // Current active persona
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const currentUser = USER_PERSONAS[currentPersonaIndex];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainTab, setSelectedDomainTab] = useState<string>("ALL");
  const [claimFilter, setClaimFilter] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected franchise for workflow modal
  const [selectedFranchiseForWorkflow, setSelectedFranchiseForWorkflow] = useState<any | null>(null);
  const [selectedAppForWorkflow, setSelectedAppForWorkflow] = useState<any | null>(null);
  const [selectedTaskForWorkflow, setSelectedTaskForWorkflow] = useState<any | null>(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  // New application capture modal
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [selectedBodyNumberForIntake, setSelectedBodyNumberForIntake] = useState<string>("");
  const [intakeApplicantName, setIntakeApplicantName] = useState<string>("");

  // Simulated applications state initialized from real franchises in pool
  const [applications, setApplications] = useState<ApplicationListItem[]>(() => {
    // Generate initial realistic sample distribution across domains from the franchises
    const sampleFranchises = initialFranchises.slice(0, 30);
    const domainDistribution: DomainType[] = ["TRAFFIC", "BPLO", "SP", "TREASURY"];
    const taskNames: Record<DomainType, string> = {
      TRAFFIC: "Vehicle Inspection & Clearance",
      BPLO: "Statutory Check & Delinquency",
      SP: "Legislative Assessment & Resolution",
      TREASURY: "Payment & OR Reconciliation",
    };

    return sampleFranchises.map((f, idx) => {
      const domain = domainDistribution[idx % domainDistribution.length];
      const isAssigned = idx % 2 === 0;
      const appNum = `MTOP-2026-${String(f.franchiseBodyNumber).padStart(4, "0")}`;
      const applicantName = f.operator?.name || `Operator for #${f.franchiseBodyNumber}`;
      const plate = f.mtopVehicle?.plateNumber || `TAG-${1000 + f.franchiseBodyNumber}`;
      const makeModel = f.mtopVehicle?.make ? `${f.mtopVehicle.make} ${f.mtopVehicle.model || ""}` : "Kawasaki Barako II";

      return {
        id: `app-record-${f.id}`,
        franchiseId: f.id,
        applicationNumber: appNum,
        bodyNumber: f.franchiseBodyNumber,
        applicantName,
        currentDomain: domain,
        taskName: taskNames[domain],
        taskStatus: isAssigned ? "ASSIGNED" : "PENDING",
        assignedUserId: isAssigned ? `user-${domain.toLowerCase()}` : null,
        assignedUserName: isAssigned ? `Officer ${domain} Lead` : null,
        plateNumber: plate,
        makeModel,
        updatedAt: new Date(Date.now() - idx * 3600000).toISOString(),
        createdAt: new Date(Date.now() - (idx + 2) * 86400000).toISOString(),
      };
    });
  });

  // Calculate domain metrics
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: applications.length,
      TRAFFIC: 0,
      BPLO: 0,
      SP: 0,
      TREASURY: 0,
      ZONING: 0,
      MAYOR: 0,
    };
    applications.forEach((app) => {
      const key = app.currentDomain as string;
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    });
    return counts;
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Domain filter
      if (selectedDomainTab !== "ALL" && app.currentDomain !== selectedDomainTab) {
        return false;
      }

      // Claim filter
      if (claimFilter === "UNASSIGNED" && app.taskStatus !== "PENDING") return false;
      if (claimFilter === "MY_TASKS" && app.assignedUserId !== currentUser.id) return false;
      if (claimFilter === "ASSIGNED" && app.taskStatus !== "ASSIGNED") return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBody = String(app.bodyNumber).includes(q);
        const matchesName = app.applicantName.toLowerCase().includes(q);
        const matchesAppNum = app.applicationNumber.toLowerCase().includes(q);
        const matchesPlate = app.plateNumber.toLowerCase().includes(q);
        return matchesBody || matchesName || matchesAppNum || matchesPlate;
      }

      return true;
    });
  }, [applications, selectedDomainTab, claimFilter, searchQuery, currentUser.id]);

  // Paginated items
  const totalPages = Math.ceil(filteredApplications.length / pageSize) || 1;
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // Quick Claim ("Assign to Me") with Domain Check
  const handleQuickClaim = (app: ApplicationListItem, e: React.MouseEvent) => {
    e.stopPropagation();

    // Domain validation
    if (currentUser.domain !== app.currentDomain && currentUser.role !== "ADMIN") {
      toast.error(
        `Domain Isolation: You are logged in as ${currentUser.domain}, but this task is queued under ${app.currentDomain}.`
      );
      return;
    }

    // Mutate state atomically
    setApplications((prev) =>
      prev.map((item) => {
        if (item.id === app.id) {
          return {
            ...item,
            taskStatus: "ASSIGNED",
            assignedUserId: currentUser.id,
            assignedUserName: currentUser.name,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    toast.success(`Task claimed: Application ${app.applicationNumber} assigned to ${currentUser.name}`);
  };

  // Open full workflow modal
  const handleOpenWorkflow = (app: ApplicationListItem) => {
    const matched = initialFranchises.find((f) => f.id === app.franchiseId);
    const franchise = {
      id: app.franchiseId,
      bodyNumber: app.bodyNumber,
      franchiseBodyNumber: app.bodyNumber,
      status: matched?.status || "UNDER_REVIEW",
      operator: matched?.operator || {
        id: "op-demo",
        name: app.applicantName,
      },
      vehicle: matched?.mtopVehicle || {
        id: "veh-demo",
        plateNumber: app.plateNumber,
        make: app.makeModel,
      },
      mtopVehicle: matched?.mtopVehicle,
    };

    const appRecord = {
      id: app.id,
      franchiseId: app.franchiseId,
      applicationNumber: app.applicationNumber,
      applicantName: app.applicantName,
      bodyNumber: app.bodyNumber,
      currentDomain: app.currentDomain,
      status: "UNDER_REVIEW" as const,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };

    const taskRecord = {
      id: `task-${app.id}`,
      applicationId: app.id,
      domain: app.currentDomain,
      taskName: app.taskName,
      requiredRole: "STAFF" as const,
      status: app.taskStatus,
      assignedUserId: app.assignedUserId,
      assignedUserName: app.assignedUserName,
      startedAt: app.taskStatus === "ASSIGNED" ? app.updatedAt : null,
      completedAt: null,
      remarks: app.assignedUserName ? `Assigned to ${app.assignedUserName}` : "Pending claim in domain queue.",
    };

    setSelectedFranchiseForWorkflow(franchise);
    setSelectedAppForWorkflow(appRecord);
    setSelectedTaskForWorkflow(taskRecord);
    setWorkflowModalOpen(true);
  };

  // Capture New Application
  const handleIntakeSubmit = () => {
    if (!selectedBodyNumberForIntake) {
      toast.error("Please select a Body Number for intake.");
      return;
    }

    const bodyNum = parseInt(selectedBodyNumberForIntake, 10);
    const matchedFranchise = initialFranchises.find((f) => f.franchiseBodyNumber === bodyNum);

    const newAppNum = `MTOP-2026-${String(bodyNum).padStart(4, "0")}`;
    const newAppItem: ApplicationListItem = {
      id: `app-new-${Date.now()}`,
      franchiseId: matchedFranchise?.id || `franchise-${bodyNum}`,
      applicationNumber: newAppNum,
      bodyNumber: bodyNum,
      applicantName: intakeApplicantName.trim() || matchedFranchise?.operator?.name || "New Applicant",
      currentDomain: "BPLO",
      taskName: "Receiving & Verification",
      taskStatus: "PENDING",
      assignedUserId: null,
      assignedUserName: null,
      plateNumber: matchedFranchise?.mtopVehicle?.plateNumber || `TAG-${1000 + bodyNum}`,
      makeModel: matchedFranchise?.mtopVehicle?.make || "Kawasaki Barako II",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setApplications((prev) => [newAppItem, ...prev]);
    setCaptureModalOpen(false);
    setSelectedBodyNumberForIntake("");
    setIntakeApplicantName("");
    toast.success(`Application ${newAppNum} captured and queued into BPLO Intake.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Persona Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs font-mono px-2.5 py-0.5">
              Multi-Domain Pipeline Engine
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs font-mono px-2.5 py-0.5">
              Tagbilaran City MTOP
            </Badge>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Franchise Applications & Domain Workflow
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            State-machine intake and routing pipeline. Enforces strict domain isolation (BPLO, Treasury, Zoning, SP, Mayor) with atomic task claiming and inter-departmental handoffs.
          </p>
        </div>

        {/* Dynamic Persona & Domain Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-300" />
              Active Officer Context
            </div>
            <div className="text-xs text-slate-200 font-medium">
              Domain: <span className="font-bold text-amber-300">{currentUser.domain}</span> • Role: <span className="font-mono text-indigo-300">{currentUser.role}</span>
            </div>
          </div>

          <Select
            value={String(currentPersonaIndex)}
            onValueChange={(val) => {
              if (val) {
                const idx = parseInt(val, 10);
                setCurrentPersonaIndex(idx);
                toast.info(`Switched context to ${USER_PERSONAS[idx].name}`);
              }
            }}
          >
            <SelectTrigger className="w-[210px] bg-slate-900/80 border-slate-700 text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_PERSONAS.map((p, idx) => (
                <SelectItem key={p.id} value={String(idx)} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Domain Pipeline Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: "ALL", label: "All Queues", count: domainCounts.ALL, color: "text-slate-800 dark:text-slate-200", border: "border-slate-300 dark:border-slate-800" },
          { key: "BPLO", label: "1. BPLO Intake", count: domainCounts.BPLO, color: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-300 dark:border-indigo-900" },
          { key: "TREASURY", label: "2. Treasury Billing", count: domainCounts.TREASURY, color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-300 dark:border-emerald-900" },
          { key: "ZONING", label: "3. Zoning Inspection", count: domainCounts.ZONING, color: "text-amber-600 dark:text-amber-400", border: "border-amber-300 dark:border-amber-900" },
          { key: "SP", label: "4. SP Resolution", count: domainCounts.SP, color: "text-purple-600 dark:text-purple-400", border: "border-purple-300 dark:border-purple-900" },
          { key: "MAYOR", label: "5. Mayor's Permit", count: domainCounts.MAYOR, color: "text-rose-600 dark:text-rose-400", border: "border-rose-300 dark:border-rose-900" },
        ].map((card) => {
          const isSelected = selectedDomainTab === card.key;
          return (
            <button
              key={card.key}
              onClick={() => {
                setSelectedDomainTab(card.key);
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-sm ${card.border} ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-2 ring-indigo-500/30"
                  : "bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500"}`}>
                {card.label}
              </div>
              <div className={`text-2xl font-bold mt-1 ${isSelected ? "text-white dark:text-slate-900" : card.color}`}>
                {card.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Bar: Search, Filters & Intake CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Body #, Operator, Plate, or App No..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 text-xs h-9"
            />
          </div>

          <Select
            value={claimFilter}
            onValueChange={(val) => {
              if (val) {
                setClaimFilter(val);
                setCurrentPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[180px] text-xs h-9">
              <SelectValue placeholder="Claim Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Task Statuses</SelectItem>
              <SelectItem value="UNASSIGNED" className="text-xs">Unclaimed (In Queue)</SelectItem>
              <SelectItem value="MY_TASKS" className="text-xs">My Assigned Tasks</SelectItem>
              <SelectItem value="ASSIGNED" className="text-xs">Any In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={() => setCaptureModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-3.5 shadow-sm font-medium"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Capture New Application
          </Button>
        </div>
      </div>

      {/* Applications Data Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-[140px]">
                  Application No.
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-[100px]">
                  Body Number
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Applicant / Operator
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Vehicle Specs
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Current Stage / Domain
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Assigned Officer
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right pr-6">
                  Workflow Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                      <FileText className="w-8 h-8 text-slate-400" />
                      <div className="text-sm font-semibold">No Applications Found</div>
                      <div className="text-xs text-slate-400">
                        Try adjusting your domain tab or search query.
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApps.map((app) => {
                  const isCurrentDomain = currentUser.domain === app.currentDomain;
                  const isUnassigned = app.taskStatus === "PENDING";
                  const isAssignedToMe = app.assignedUserId === currentUser.id;

                  return (
                    <TableRow
                      key={app.id}
                      onClick={() => handleOpenWorkflow(app)}
                      className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                    >
                      {/* Application No */}
                      <TableCell className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {app.applicationNumber}
                      </TableCell>

                      {/* Body Number */}
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs font-bold text-amber-600 border-amber-500/40 bg-amber-50 dark:bg-amber-950/30">
                          #{String(app.bodyNumber).padStart(4, "0")}
                        </Badge>
                      </TableCell>

                      {/* Applicant */}
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {app.applicantName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          MTOP Commercial Franchise
                        </div>
                      </TableCell>

                      {/* Vehicle Specs */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <Badge variant="secondary" className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800">
                            {app.plateNumber}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {app.makeModel}
                        </div>
                      </TableCell>

                      {/* Current Domain & Task */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[10px] font-mono ${
                              app.currentDomain === "TRAFFIC"
                                ? "bg-amber-600 text-white"
                                : app.currentDomain === "BPLO"
                                ? "bg-indigo-600 text-white"
                                : app.currentDomain === "SP"
                                ? "bg-purple-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {app.currentDomain}
                          </Badge>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {app.taskName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Assigned Officer */}
                      <TableCell>
                        {isUnassigned ? (
                          <Badge variant="outline" className="border-dashed border-amber-500/60 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-[11px]">
                            <Clock className="w-3 h-3 mr-1" />
                            Unclaimed in Queue
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="font-medium">{app.assignedUserName}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Action Button */}
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isUnassigned && isCurrentDomain ? (
                            <Button
                              size="sm"
                              onClick={(e) => handleQuickClaim(app, e)}
                              className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-medium"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Assign to Me
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenWorkflow(app)}
                              className="h-7 px-2.5 text-xs font-medium border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                            >
                              Manage Workflow
                              <ArrowRight className="w-3 h-3 ml-1 text-slate-400" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {filteredApplications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.min(currentPage * pageSize, filteredApplications.length)}
              </span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredApplications.length}</span> applications
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <div className="px-2 font-mono text-xs">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Full Workflow Management Modal */}
      <Dialog open={workflowModalOpen} onOpenChange={setWorkflowModalOpen}>
        <DialogContent className="sm:max-w-4xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Layers className="w-5 h-5 text-indigo-600" />
              Franchise Workflow Console
            </DialogTitle>
            <DialogDescription className="text-xs">
              Execute domain-governed lifecycle transitions, concurrency-safe task claiming, and inter-domain forwarding.
            </DialogDescription>
          </DialogHeader>

          {selectedFranchiseForWorkflow && (
            <div className="mt-2">
              <FranchiseApplication
                franchise={selectedFranchiseForWorkflow}
                currentUser={{
                  id: currentUser.id,
                  name: currentUser.name,
                  domain: currentUser.domain,
                  role: currentUser.role,
                }}
                initialApplication={selectedAppForWorkflow}
                initialTask={selectedTaskForWorkflow}
                onClose={() => setWorkflowModalOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Intake / Capture New Application Dialog */}
      <Dialog open={captureModalOpen} onOpenChange={setCaptureModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Capture New Franchise Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Initialize a FranchiseApplication record and spawn the initial BPLO Intake task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Select Franchise Body Number
              </label>
              <Select
                value={selectedBodyNumberForIntake}
                onValueChange={(val) => {
                  if (val) setSelectedBodyNumberForIntake(val);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Body Number" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {initialFranchises.slice(0, 50).map((f) => (
                    <SelectItem key={f.id} value={String(f.franchiseBodyNumber)} className="text-xs">
                      Body #{String(f.franchiseBodyNumber).padStart(4, "0")} {f.operator ? `— ${f.operator.name}` : "(Unassigned Operator)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Applicant / Operator Name
              </label>
              <Input
                placeholder="e.g. Juan C. Dela Cruz"
                value={intakeApplicantName}
                onChange={(e) => setIntakeApplicantName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-300">
              <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Initial Route: Domain: BPLO • Task: Receiving & Verification
              </div>
              <div>
                Upon capture, this entity is registered and an unassigned task is queued for the BPLO Receiving Clerk.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCaptureModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleIntakeSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
            >
              Confirm Intake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FranchiseApplicationClient;
