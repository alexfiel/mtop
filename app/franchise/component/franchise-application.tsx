"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  FileText,
  AlertCircle,
  History,
  Send,
  User,
  Hash,
  Sparkles,
  Lock,
  RefreshCw,
  PlusCircle,
  Car,
  Receipt,
  Scale,
  Award,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  WorkflowDomain,
  ApplicationWorkflowStatus,
  WorkflowTaskStatus,
  WorkflowUserRole,
} from "@/lib/workflow/types";

export type DomainType = WorkflowDomain;
export type UserRoleType = WorkflowUserRole;

export interface FranchiseApplicationRecord {
  id: string;
  franchiseId: string;
  applicationNumber: string;
  applicantName: string;
  bodyNumber: number;
  currentDomain: WorkflowDomain;
  status: ApplicationWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FranchiseTaskRecord {
  id: string;
  applicationId: string;
  domain: WorkflowDomain;
  taskName: string;
  requiredRole: WorkflowUserRole;
  status: WorkflowTaskStatus;
  assignedUserId: string | null;
  assignedUserName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  remarks: string | null;
}

interface FranchiseApplicationProps {
  franchise: {
    id: string;
    bodyNumber?: number;
    franchiseBodyNumber?: number;
    status?: string;
    operator?: {
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      contactNumber?: string | null;
      mobileNo?: string | null;
    } | null;
    vehicle?: {
      id?: string;
      plateNumber?: string;
      make?: string | null;
    } | null;
    mtopVehicle?: {
      id?: string;
      plateNumber?: string;
      make?: string | null;
    } | null;
  };
  currentUser?: {
    id: string;
    name: string;
    domain: WorkflowDomain;
    role: WorkflowUserRole;
  };
  initialApplication?: FranchiseApplicationRecord | null;
  initialTask?: FranchiseTaskRecord | null;
  onClose?: () => void;
  onRefresh?: () => void;
}

const DOMAIN_STAGES: Array<{
  domain: WorkflowDomain;
  label: string;
  taskName: string;
  requiredRole: WorkflowUserRole;
  description: string;
}> = [
  {
    domain: "TRAFFIC",
    label: "1. City Traffic (CTMO)",
    taskName: "Vehicle Inspection & Clearance",
    requiredRole: "STAFF",
    description: "Physical unit inspection, engine/chassis verification, and violation registry clearance",
  },
  {
    domain: "BPLO",
    label: "2. BPLO Intake & Vetting",
    taskName: "Statutory Check & Delinquency",
    requiredRole: "STAFF",
    description: "Intake documentation, historical renewal check, and delinquency tax computation",
  },
  {
    domain: "SP",
    label: "3. Sangguniang Panlungsod",
    taskName: "Legislative Assessment & Resolution",
    requiredRole: "SUPERVISOR",
    description: "Legislative tax billing, Order of the Day agenda, council vote, and certificate issuance",
  },
  {
    domain: "TREASURY",
    label: "4. Treasury (eTRACS)",
    taskName: "Payment & OR Reconciliation",
    requiredRole: "STAFF",
    description: "Automated billing ingestion, payment webhook reconciliation, and official receipt audit",
  },
];

export function FranchiseApplication({
  franchise,
  currentUser = {
    id: "user-ctmo-101",
    name: "Engr. Roberto Santos",
    domain: "TRAFFIC",
    role: "STAFF",
  },
  initialApplication = null,
  initialTask = null,
  onClose,
  onRefresh,
}: FranchiseApplicationProps) {
  const bodyNumber = franchise.bodyNumber ?? franchise.franchiseBodyNumber ?? 0;
  const applicantDisplayName = franchise.operator?.name
    ? franchise.operator.name
    : franchise.operator?.firstName
    ? `${franchise.operator.firstName} ${franchise.operator.lastName || ""}`.trim()
    : "Unassigned Applicant";
  const vehiclePlateDisplay =
    franchise.vehicle?.plateNumber ?? franchise.mtopVehicle?.plateNumber ?? "TAG-7102";

  // Core state
  const [application, setApplication] = useState<FranchiseApplicationRecord | null>(initialApplication);
  const [activeTask, setActiveTask] = useState<FranchiseTaskRecord | null>(initialTask);
  const [taskHistory, setTaskHistory] = useState<FranchiseTaskRecord[]>(initialTask ? [initialTask] : []);
  const [activeTab, setActiveTab] = useState<string>("workflow");
  const [isProcessing, setIsProcessing] = useState(false);

  // CTMO Specific State
  const [ctmoEngineVerified, setCtmoEngineVerified] = useState(true);
  const [ctmoRoadworthy, setCtmoRoadworthy] = useState(true);
  const [ctmoBrakesLights, setCtmoBrakesLights] = useState(true);
  const [ctmoViolationsCount, setCtmoViolationsCount] = useState(0);
  const [ctmoClearanceCert, setCtmoClearanceCert] = useState<string | null>(null);

  // BPLO Specific State
  const [bploStatutoryVerified, setBploStatutoryVerified] = useState(true);
  const [bploExpiredYears, setBploExpiredYears] = useState(1);
  const [bploDelinquencyBillRef, setBploDelinquencyBillRef] = useState<string | null>(null);
  const [bploDelinquencyPaid, setBploDelinquencyPaid] = useState(false);
  const [bploOrNumber, setBploOrNumber] = useState<string | null>(null);

  // SP Specific State
  const [spBillingRef, setSpBillingRef] = useState<string | null>(null);
  const [spBillingPaid, setSpBillingPaid] = useState(false);
  const [spOrNumber, setSpOrNumber] = useState<string | null>(null);
  const [spOrderDate, setSpOrderDate] = useState<string>("");
  const [spResolutionNo, setSpResolutionNo] = useState<string | null>(null);
  const [spVotingResult, setSpVotingResult] = useState<"APPROVED" | "DISAPPROVED" | null>(null);

  // Final Release State
  const [finalPermitNumber, setFinalPermitNumber] = useState<string | null>(null);

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication);
    }
    if (initialTask) {
      setActiveTask(initialTask);
      setTaskHistory([initialTask]);
    }
  }, [initialApplication, initialTask]);

  // 1. Intake Capture
  const handleCaptureApplication = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const appId = `MTOP-2026-${String(bodyNumber).padStart(4, "0")}`;
      const newApp: FranchiseApplicationRecord = {
        id: `app-${Date.now()}`,
        franchiseId: franchise.id,
        applicationNumber: appId,
        applicantName: applicantDisplayName,
        bodyNumber,
        currentDomain: "TRAFFIC",
        status: "UNDER_INSPECTION",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const initialTaskRecord: FranchiseTaskRecord = {
        id: `task-${Date.now()}-ctmo`,
        applicationId: newApp.id,
        domain: "TRAFFIC",
        taskName: "Vehicle Inspection & Clearance",
        requiredRole: "STAFF",
        status: "PENDING",
        assignedUserId: null,
        assignedUserName: null,
        startedAt: null,
        completedAt: null,
        remarks: "Intake registered. Enqueued for CTMO physical vehicle inspection.",
      };

      setApplication(newApp);
      setActiveTask(initialTaskRecord);
      setTaskHistory([initialTaskRecord]);
      setIsProcessing(false);
      toast.success(`Application ${appId} initialized into CTMO Queue.`);
    }, 400);
  };

  // 2. Claim Task ("Assign to Me")
  const handleAssignToMe = () => {
    if (!activeTask) return;

    if (currentUser.domain !== activeTask.domain && currentUser.role !== "ADMIN") {
      toast.error(
        `Domain Isolation: You are in ${currentUser.domain}, but this task belongs to ${activeTask.domain}.`
      );
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const updated: FranchiseTaskRecord = {
        ...activeTask,
        status: "ASSIGNED",
        assignedUserId: currentUser.id,
        assignedUserName: currentUser.name,
        startedAt: new Date().toISOString(),
        remarks: `Claimed by ${currentUser.name} (${currentUser.role}).`,
      };
      setActiveTask(updated);
      setTaskHistory((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setIsProcessing(false);
      toast.success(`Task claimed: ${updated.taskName}`);
    }, 300);
  };

  // 3. CTMO: Issue Traffic Clearance
  const handleIssueTrafficClearance = () => {
    if (!ctmoEngineVerified || !ctmoRoadworthy || !ctmoBrakesLights) {
      toast.error("Vehicle inspection checklist incomplete.");
      return;
    }
    if (ctmoViolationsCount > 0) {
      toast.error("Unsettled traffic violations exist. Settle fines first.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const certNo = `CTMO-CLR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setCtmoClearanceCert(certNo);

      if (application && activeTask) {
        const completedTask: FranchiseTaskRecord = {
          ...activeTask,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          remarks: `Inspection passed. Issued Certificate #${certNo}.`,
        };

        const nextTask: FranchiseTaskRecord = {
          id: `task-${Date.now()}-bplo`,
          applicationId: application.id,
          domain: "BPLO",
          taskName: "Statutory Check & Delinquency",
          requiredRole: "STAFF",
          status: "PENDING",
          assignedUserId: null,
          assignedUserName: null,
          startedAt: null,
          completedAt: null,
          remarks: "Received from CTMO with verified Traffic Clearance Certificate.",
        };

        setApplication({
          ...application,
          currentDomain: "BPLO",
          status: "TRAFFIC_CLEARED",
          updatedAt: new Date().toISOString(),
        });
        setActiveTask(nextTask);
        setTaskHistory((prev) => [...prev.map((t) => (t.id === completedTask.id ? completedTask : t)), nextTask]);
      }

      setIsProcessing(false);
      toast.success(`Traffic Clearance ${certNo} issued! Routed to BPLO.`);
    }, 450);
  };

  // 4. BPLO: Delinquency eTRACS Billing
  const handleGenerateDelinquencyBill = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const billRef = `ETRACS-DELINQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setBploDelinquencyBillRef(billRef);
      setBploDelinquencyPaid(false);
      setIsProcessing(false);
      toast.success(`Delinquency Billing ${billRef} dispatched to eTRACS Treasury.`);
    }, 400);
  };

  // 5. BPLO: Forward to SP (Guard: CTMO Clearance & Delinquency Paid)
  const handleForwardToSP = () => {
    if (!ctmoClearanceCert) {
      toast.error("Transition Guard Failed: Must have verified CTMO Traffic Clearance Certificate.");
      return;
    }
    if (bploDelinquencyBillRef && !bploDelinquencyPaid) {
      toast.error("Transition Guard Failed: Delinquency billing in eTRACS is still UNPAID.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      if (application && activeTask) {
        const completedTask: FranchiseTaskRecord = {
          ...activeTask,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          remarks: "BPLO statutory and delinquency review cleared. Endorsed to Sangguniang Panlungsod.",
        };

        const nextTask: FranchiseTaskRecord = {
          id: `task-${Date.now()}-sp`,
          applicationId: application.id,
          domain: "SP",
          taskName: "Legislative Assessment & Resolution",
          requiredRole: "SUPERVISOR",
          status: "PENDING",
          assignedUserId: null,
          assignedUserName: null,
          startedAt: null,
          completedAt: null,
          remarks: "Queued for legislative assessment and council hearing.",
        };

        setApplication({
          ...application,
          currentDomain: "SP",
          status: "READY_FOR_SP",
          updatedAt: new Date().toISOString(),
        });
        setActiveTask(nextTask);
        setTaskHistory((prev) => [...prev.map((t) => (t.id === completedTask.id ? completedTask : t)), nextTask]);
      }
      setIsProcessing(false);
      toast.success("Application successfully routed to Sangguniang Panlungsod!");
    }, 450);
  };

  // 6. SP: Legislative Assessment eTRACS Billing
  const handleGenerateSpBilling = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const billRef = `ETRACS-SP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSpBillingRef(billRef);
      setSpBillingPaid(false);
      setIsProcessing(false);
      toast.success(`Legislative Assessment ${billRef} registered in eTRACS Treasury.`);
    }, 400);
  };

  // 7. SP: Council Hearing & Resolution Vote (Guard: Legislative Tax Paid)
  const handleCouncilVote = (decision: "APPROVED" | "DISAPPROVED") => {
    if (spBillingRef && !spBillingPaid) {
      toast.error("Transition Guard Failed: Franchise assessment fees must be paid in eTRACS before council hearing.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const resNo = `SP-RES-2026-${Math.floor(100 + Math.random() * 900)}`;
      setSpResolutionNo(resNo);
      setSpVotingResult(decision);

      if (application && activeTask) {
        const completedTask: FranchiseTaskRecord = {
          ...activeTask,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          remarks: `Council voted ${decision}. Resolution #${resNo}. Signed Certificate generated.`,
        };

        const nextTask: FranchiseTaskRecord = {
          id: `task-${Date.now()}-final`,
          applicationId: application.id,
          domain: "BPLO",
          taskName: "Executive Permit Final Release",
          requiredRole: "ADMIN",
          status: "PENDING",
          assignedUserId: null,
          assignedUserName: null,
          startedAt: null,
          completedAt: null,
          remarks: `Docket returned to BPLO with ${decision} SP Resolution #${resNo}. Ready for permit issuance.`,
        };

        setApplication({
          ...application,
          currentDomain: "BPLO",
          status: decision === "APPROVED" ? "SP_APPROVED" : "SP_DISAPPROVED",
          updatedAt: new Date().toISOString(),
        });
        setActiveTask(nextTask);
        setTaskHistory((prev) => [...prev.map((t) => (t.id === completedTask.id ? completedTask : t)), nextTask]);
      }
      setIsProcessing(false);
      toast.success(`SP Resolution #${resNo} recorded (${decision}). Docket returned to BPLO.`);
    }, 500);
  };

  // 8. BPLO: Final Release & Permit Issuance (Guard: SP Approved)
  const handleFinalPermitRelease = () => {
    if (spVotingResult !== "APPROVED") {
      toast.error("Guard Failed: Cannot release permit without an APPROVED Sangguniang Panlungsod Resolution.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const permitNo = `TOP-TAG-2026-${String(bodyNumber).padStart(4, "0")}`;
      setFinalPermitNumber(permitNo);

      if (application && activeTask) {
        const completedTask: FranchiseTaskRecord = {
          ...activeTask,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          remarks: `Sealed MTOP Permit #${permitNo} and official validation sticker released to operator.`,
        };

        setApplication({
          ...application,
          status: "COMPLETED",
          updatedAt: new Date().toISOString(),
        });
        setActiveTask(completedTask);
        setTaskHistory((prev) => prev.map((t) => (t.id === completedTask.id ? completedTask : t)));
      }
      setIsProcessing(false);
      toast.success(`MTOP Permit #${permitNo} officially released!`);
    }, 450);
  };

  // Treasury Simulation: Simulate Payment & Webhook
  const handleSimulatePayment = (type: "DELINQUENCY" | "LEGISLATIVE") => {
    setIsProcessing(true);
    setTimeout(() => {
      const orNum = `OR-TAG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      if (type === "DELINQUENCY") {
        setBploDelinquencyPaid(true);
        setBploOrNumber(orNum);
      } else {
        setSpBillingPaid(true);
        setSpOrNumber(orNum);
      }
      setIsProcessing(false);
      toast.success(`Payment verified in eTRACS! Official Receipt #${orNum} recorded.`);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-md border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-amber-400 border-amber-400/40 bg-amber-400/10 text-xs uppercase tracking-wider font-semibold">
              Franchise #{bodyNumber}
            </Badge>
            {application ? (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono">
                {application.applicationNumber}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-400 border-slate-700">
                Intake Pending
              </Badge>
            )}
            {application && (
              <Badge className="bg-indigo-600 font-mono text-[11px]">
                Status: {application.status}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            LGU Multi-Department Franchise Workflow Engine
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Applicant: <span className="font-semibold text-slate-100">{applicantDisplayName}</span> • Vehicle Plate:{" "}
            <span className="font-mono text-amber-300">{vehiclePlateDisplay}</span>
          </p>
        </div>

        {/* Current Officer Identity Context */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10 text-xs">
          <User className="w-4 h-4 text-indigo-300" />
          <div>
            <div className="font-semibold text-slate-200">{currentUser.name}</div>
            <div className="text-[11px] text-indigo-300 font-mono">
              Domain: <span className="font-bold text-amber-300">{currentUser.domain}</span> | Role: {currentUser.role}
            </div>
          </div>
        </div>
      </div>

      {/* Case 1: No Active Application Exists */}
      {!application && (
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <CardHeader className="text-center pb-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
              <PlusCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">No Active Application for Franchise #{bodyNumber}</CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs">
              Initialize a new municipal intake application to begin the multi-department routing sequence (CTMO Traffic Clearance &rarr; BPLO Vetting &rarr; SP Council Hearing &rarr; Treasury eTRACS).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button
              onClick={handleCaptureApplication}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-medium"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Initializing Intake...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Capture Application (Intake)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Case 2: Active Multi-Department Workflow Running */}
      {application && (
        <>
          {/* Domain-Driven Pipeline Stepper */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Inter-Departmental Municipal Pipeline & External eTRACS Boundary
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              {DOMAIN_STAGES.map((stage, idx) => {
                const isCurrent = application.currentDomain === stage.domain;
                return (
                  <div
                    key={stage.domain}
                    className={`relative p-3.5 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                        : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                        Department {idx + 1}
                      </span>
                      {isCurrent ? (
                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {stage.label}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {stage.taskName}
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-slate-400">
                      Prereq: {stage.requiredRole}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Control Panels */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4 text-xs">
              <TabsTrigger value="workflow" className="text-xs">
                Active Task
              </TabsTrigger>
              <TabsTrigger value="ctmo" className="text-xs">
                1. CTMO Traffic
              </TabsTrigger>
              <TabsTrigger value="bplo" className="text-xs">
                2. BPLO Vetting
              </TabsTrigger>
              <TabsTrigger value="sp" className="text-xs">
                3. SP Council
              </TabsTrigger>
              <TabsTrigger value="etracs" className="text-xs">
                4. eTRACS Ledger
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Active Task Claim & Status */}
            <TabsContent value="workflow">
              {activeTask && (
                <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-md">
                  <CardHeader className="bg-slate-50/80 dark:bg-slate-900/60 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-mono text-xs">
                          Office: {activeTask.domain}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            activeTask.status === "ASSIGNED"
                              ? "border-amber-500 text-amber-600 bg-amber-50"
                              : "border-slate-400 text-slate-600 bg-slate-100"
                          }
                        >
                          {activeTask.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Task ID: {activeTask.id}</span>
                    </div>
                    <CardTitle className="text-base mt-2 text-slate-900 dark:text-slate-100">
                      {activeTask.taskName}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Assigned Officer: <span className="font-semibold text-indigo-600">{activeTask.assignedUserName || "Unclaimed (In Queue)"}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border text-slate-700 dark:text-slate-300">
                      <div className="font-medium text-slate-500 mb-0.5">Instructions & Scope:</div>
                      {activeTask.remarks || "No remarks."}
                    </div>

                    {currentUser.domain !== activeTask.domain && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <div>
                          Domain Isolation Active: You are logged in under <span className="font-bold">{currentUser.domain}</span>. Only members of <span className="font-bold">{activeTask.domain}</span> can claim or mutate this task.
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-between py-3">
                    <div className="text-xs text-slate-400 font-mono">
                      Target Domain: {activeTask.domain}
                    </div>
                    {activeTask.status === "PENDING" && (
                      <Button
                        onClick={handleAssignToMe}
                        disabled={isProcessing || (currentUser.domain !== activeTask.domain && currentUser.role !== "ADMIN")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                        Assign to Me
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: CTMO Traffic */}
            <TabsContent value="ctmo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-600" />
                    City Traffic Management Office (CTMO) Clearance Engine
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Physical unit inspection, violation registry verification, and Traffic Clearance Certificate generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ctmoEngineVerified}
                        onChange={(e) => setCtmoEngineVerified(e.target.checked)}
                        className="rounded"
                      />
                      <span>Engine & Chassis Verified</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ctmoRoadworthy}
                        onChange={(e) => setCtmoRoadworthy(e.target.checked)}
                        className="rounded"
                      />
                      <span>Roadworthiness & Welding Passed</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ctmoBrakesLights}
                        onChange={(e) => setCtmoBrakesLights(e.target.checked)}
                        className="rounded"
                      />
                      <span>Brakes, Lights & Meter Validated</span>
                    </label>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Violation Registry Query</div>
                      <div className="text-slate-500">Active unsettled tickets for plate {vehiclePlateDisplay}</div>
                    </div>
                    <Badge variant={ctmoViolationsCount === 0 ? "secondary" : "destructive"}>
                      {ctmoViolationsCount} Unsettled Violations
                    </Badge>
                  </div>

                  {ctmoClearanceCert && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <div className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Traffic Clearance Certificate Issued: #{ctmoClearanceCert}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Digitally verified by CTMO Examiner. Ready for BPLO intake handoff.
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    onClick={handleIssueTrafficClearance}
                    disabled={isProcessing || !!ctmoClearanceCert}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                  >
                    {ctmoClearanceCert ? "Clearance Already Issued" : "Issue Traffic Clearance & Route to BPLO"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 3: BPLO Review & Delinquency */}
            <TabsContent value="bplo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    BPLO Statutory Verification & Delinquency Assessment
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Confirm statutory requirements, calculate renewal delinquency, and endorse to Sangguniang Panlungsod.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Statutory Documents Checklist</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Barangay Clearance Verified
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Police / NBI Clearance Clean
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Third-Party Liability Insurance Active
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> LTO Official Receipt & Registration Verified
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Renewal Delinquency Assessment</div>
                    <div className="text-slate-500">Formula: Base Franchise Tax (2,000/yr) + 25% Surcharge + 2%/mo Penalty + 500 Filing Fee</div>
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        onClick={handleGenerateDelinquencyBill}
                        disabled={isProcessing || !!bploDelinquencyBillRef}
                        className="text-xs h-7"
                      >
                        Calculate & Dispatch Delinquency to eTRACS
                      </Button>
                      {bploDelinquencyBillRef && (
                        <Badge variant={bploDelinquencyPaid ? "secondary" : "outline"} className="font-mono text-[11px]">
                          {bploDelinquencyBillRef} ({bploDelinquencyPaid ? "PAID" : "UNPAID"})
                        </Badge>
                      )}
                    </div>
                  </div>

                  {finalPermitNumber && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        Official MTOP Permit Released: #{finalPermitNumber}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Valid for 3 years. Operator authorized to pick up physical permit plate.
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    onClick={handleForwardToSP}
                    disabled={isProcessing || !ctmoClearanceCert || (!!bploDelinquencyBillRef && !bploDelinquencyPaid)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                  >
                    Forward to Sangguniang Panlungsod (SP)
                  </Button>
                  <Button
                    onClick={handleFinalPermitRelease}
                    disabled={isProcessing || spVotingResult !== "APPROVED" || !!finalPermitNumber}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    Release Final MTOP Permit & Sticker
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 4: SP Council Hearing */}
            <TabsContent value="sp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    Sangguniang Panlungsod (City Council) Legislative Engine
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Legislative franchise tax billing, session agenda, council resolution vote, and certificate issuance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">1. Legislative Fee Assessment</div>
                      <div className="text-slate-500">Franchise Fee (6,000) + Mayor's Permit (1,500) + Plate (350) + Sanitary (250) = 8,100 PHP</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handleGenerateSpBilling}
                        disabled={isProcessing || !!spBillingRef}
                        className="text-xs h-7"
                      >
                        Dispatch eTRACS Bill
                      </Button>
                      {spBillingRef && (
                        <Badge variant={spBillingPaid ? "secondary" : "outline"} className="font-mono text-[11px]">
                          {spBillingRef} ({spBillingPaid ? "PAID" : "UNPAID"})
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">2. Order of the Day & Session Docket</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={spOrderDate}
                        onChange={(e) => setSpOrderDate(e.target.value)}
                        className="text-xs h-8 max-w-[200px]"
                      />
                      <span className="text-slate-400">Regular Session Docket #2026-09</span>
                    </div>
                  </div>

                  {spResolutionNo && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        SP Resolution #{spResolutionNo} ({spVotingResult})
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Signed by SP Presiding Officer. Appended to Official Publication Gazette.
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    onClick={() => handleCouncilVote("APPROVED")}
                    disabled={isProcessing || !spBillingPaid || !!spResolutionNo}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    Approve Resolution & Certificate
                  </Button>
                  <Button
                    onClick={() => handleCouncilVote("DISAPPROVED")}
                    disabled={isProcessing || !spBillingPaid || !!spResolutionNo}
                    variant="destructive"
                    className="text-xs h-8"
                  >
                    Disapprove
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 5: eTRACS Treasury Interceptor */}
            <TabsContent value="etracs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    eTRACS Treasury Ledger & Interceptor Gateway
                  </CardTitle>
                  <CardDescription className="text-xs">
                    External system boundary simulating Treasury billing ingestion, cashier payment webhooks, and Official Receipt (OR) reconciliation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-3">
                    {/* Delinquency Bill Card */}
                    {bploDelinquencyBillRef && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            BPLO Delinquency Bill: {bploDelinquencyBillRef}
                          </div>
                          <div className="text-slate-500">Account: 4-01-01-080 • Total: 4,000.00 PHP</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {bploDelinquencyPaid ? (
                            <Badge className="bg-emerald-600 text-white font-mono text-[11px]">
                              Paid (OR #{bploOrNumber})
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSimulatePayment("DELINQUENCY")}
                              disabled={isProcessing}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
                            >
                              Simulate Cashier Payment & Webhook
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SP Legislative Bill Card */}
                    {spBillingRef && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            SP Legislative Assessment: {spBillingRef}
                          </div>
                          <div className="text-slate-500">Account: 4-01-01-080 • Total: 8,100.00 PHP</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {spBillingPaid ? (
                            <Badge className="bg-emerald-600 text-white font-mono text-[11px]">
                              Paid (OR #{spOrNumber})
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSimulatePayment("LEGISLATIVE")}
                              disabled={isProcessing}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
                            >
                              Simulate Cashier Payment & Webhook
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {!bploDelinquencyBillRef && !spBillingRef && (
                      <div className="p-6 text-center text-slate-400 border border-dashed rounded-lg">
                        No billing statements dispatched to eTRACS Treasury yet. Trigger an assessment in BPLO or SP.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Audit Trail & Task Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Immutable Task Transition Audit Log ({taskHistory.length})
            </h3>

            <div className="space-y-2">
              {taskHistory.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {task.domain}
                    </Badge>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{task.taskName}</div>
                      <div className="text-[11px] text-slate-500">
                        Officer: {task.assignedUserName || "Unassigned"} • Status: {task.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    {task.completedAt ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Completed: {new Date(task.completedAt).toLocaleTimeString()}
                      </span>
                    ) : task.startedAt ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        In Progress: {new Date(task.startedAt).toLocaleTimeString()}
                      </span>
                    ) : (
                      "Queued"
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FranchiseApplication;
