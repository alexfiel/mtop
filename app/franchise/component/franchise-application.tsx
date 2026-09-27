"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  FileText,
  AlertCircle,
  Car,
  Receipt,
  Scale,
  Award,
  CreditCard,
  Printer,
  BookOpen,
  Send,
  Sparkles,
  RefreshCw,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  WorkflowDomain,
  ApplicationWorkflowStatus,
  WorkflowTaskStatus,
  WorkflowUserRole,
} from "@/lib/workflow/types";
import {
  issueTrafficClearanceAndForwardAction,
  issueSPResolutionAction,
  issueSPBillingAndSubmitToTreasuryAction,
  verifyTreasuryPaymentAction,
  printAndPublishFranchiseRenewalAction,
  releaseFranchiseRenewalAction,
} from "@/app/franchise/renewal-actions";
import { FranchiseBillingEngine } from "@/lib/workflow/billing-calculator";

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
  lastRenewalYear?: number;
  priorResolutionNo?: string;
  priorResolutionDate?: string;
  resolutionNo?: string | null;
  resolutionDate?: string | null;
  remarks?: string | null;
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
      address?: string;
      contactNumber?: string | null;
      mobileNo?: string | null;
    } | null;
    vehicle?: {
      id?: string;
      plateNumber?: string;
      make?: string | null;
      model?: string | null;
    } | null;
    mtopVehicle?: {
      id?: string;
      plateNumber?: string;
      make?: string | null;
      model?: string | null;
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

const RENEWAL_PIPELINE_STAGES: Array<{
  domain: WorkflowDomain;
  label: string;
  taskName: string;
  requiredRole: WorkflowUserRole;
  description: string;
}> = [
  {
    domain: "BPLO",
    label: "1. BPLO Intake",
    taskName: "Franchise Intake & Delinquency",
    requiredRole: "STAFF",
    description: "Check franchise name, find Last Renewal Year, capture resolution details & log taskId",
  },
  {
    domain: "TRAFFIC",
    label: "2. City Traffic (CTMO)",
    taskName: "Clearance & Inspection",
    requiredRole: "STAFF",
    description: "Engine, chassis, roadworthiness check & traffic clearance certificate issuance",
  },
  {
    domain: "SP",
    label: "3. Sangguniang Panlungsod",
    taskName: "Franchise Renewal Resolution",
    requiredRole: "SUPERVISOR",
    description: "SP issues council resolution number & date for 3-year franchise renewal",
  },
  {
    domain: "TREASURY",
    label: "4. Treasury (eTRACS)",
    taskName: "Renewal Billing & Payment",
    requiredRole: "STAFF",
    description: "SP issues ₱6,000/3-yr renewal billing; Treasury checks payment OK & returns to SP",
  },
  {
    domain: "SP",
    label: "5. SP Printing & Gazette",
    taskName: "Certificate & Publication",
    requiredRole: "STAFF",
    description: "SP prints official Franchise Renewal and records in LGU publication gazette",
  },
  {
    domain: "SP",
    label: "6. SP Final Release",
    taskName: "Release Renewal (End)",
    requiredRole: "SUPERVISOR",
    description: "SP releases the sealed 3-year Franchise Renewal to the operator",
  },
];

export function FranchiseApplication({
  franchise,
  currentUser = {
    id: "user-bplo-101",
    name: "Elena Vasquez",
    domain: "BPLO",
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

  // Core application and task state
  const [application, setApplication] = useState<FranchiseApplicationRecord | null>(initialApplication);
  const [activeTask, setActiveTask] = useState<FranchiseTaskRecord | null>(initialTask);
  const [taskHistory, setTaskHistory] = useState<FranchiseTaskRecord[]>(initialTask ? [initialTask] : []);
  const [activeTab, setActiveTab] = useState<string>("pipeline");
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. City Traffic (CTMO) State
  const [ctmoEngineVerified, setCtmoEngineVerified] = useState(true);
  const [ctmoRoadworthy, setCtmoRoadworthy] = useState(true);
  const [ctmoBrakesLights, setCtmoBrakesLights] = useState(true);
  const [ctmoViolationsCount, setCtmoViolationsCount] = useState(0);
  const [ctmoClearanceCert, setCtmoClearanceCert] = useState<string | null>(null);

  // 2. SP Resolution State
  const [spResNumber, setSpResNumber] = useState<string>("SP-RES-2026-042");
  const [spResDate, setSpResDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [spSessionNumber, setSpSessionNumber] = useState<string>("38th Regular Legislative Session");
  const [spResolutionIssued, setSpResolutionIssued] = useState<boolean>(false);

  // 3. SP Billing & Treasury State
  const [spRenewalBillingRef, setSpRenewalBillingRef] = useState<string | null>(null);
  const [treasuryOrNumber, setTreasuryOrNumber] = useState<string>("OR-TAG-2026-881920");
  const [treasuryPaymentConfirmed, setTreasuryPaymentConfirmed] = useState<boolean>(false);

  // 4. SP Printing & Publication State
  const [spPrinted, setSpPrinted] = useState<boolean>(false);
  const [spGazette, setSpGazette] = useState<string>("Tagbilaran City Official Gazette & SP Bulletin (Vol. 42)");
  const [spPublished, setSpPublished] = useState<boolean>(false);

  // 5. SP Final Release State
  const [spReleased, setSpReleased] = useState<boolean>(false);
  const [releasedAtTimestamp, setReleasedAtTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication);
      if (initialApplication.status === "TRAFFIC_CLEARED" || initialApplication.currentDomain === "SP") {
        setCtmoClearanceCert(`CTMO-CLR-2026-${bodyNumber}`);
      }
      if (initialApplication.resolutionNo) {
        setSpResNumber(initialApplication.resolutionNo);
        setSpResolutionIssued(true);
      }
    }
    if (initialTask) {
      setActiveTask(initialTask);
      setTaskHistory([initialTask]);
    }
  }, [initialApplication, initialTask, bodyNumber]);

  // Claim Active Task
  const handleAssignToMe = () => {
    if (!activeTask) return;

    if (currentUser.domain !== activeTask.domain && currentUser.role !== "ADMIN") {
      toast.error(
        `Domain Isolation: You belong to ${currentUser.domain}, but this task is in ${activeTask.domain}.`
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
      };
      setActiveTask(updated);
      setTaskHistory((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setIsProcessing(false);
      toast.success(`Task '${activeTask.taskName}' claimed by ${currentUser.name}.`);
    }, 300);
  };

  // STEP 2: City Traffic Clearance -> Submit to SP for Resolution
  const handleIssueClearanceAndSubmitToSP = async () => {
    if (!ctmoEngineVerified || !ctmoRoadworthy || !ctmoBrakesLights) {
      toast.error("CTMO Checklist Incomplete: Unit physical inspection must pass.");
      return;
    }
    if (ctmoViolationsCount > 0) {
      toast.error("CTMO Guard: Unsettled violations exist. Fines must be cleared first.");
      return;
    }

    setIsProcessing(true);
    const certNo = `CTMO-CLR-2026-${String(bodyNumber).padStart(4, "0")}`;
    setCtmoClearanceCert(certNo);

    if (application && activeTask) {
      const completedTask: FranchiseTaskRecord = {
        ...activeTask,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        remarks: `Physical inspection passed. Issued Traffic Clearance Certificate #${certNo}.`,
      };

      const spTask: FranchiseTaskRecord = {
        id: `task-${Date.now()}-sp-resolution`,
        applicationId: application.id,
        domain: "SP",
        taskName: "SP Franchise Resolution Enactment",
        requiredRole: "SUPERVISOR",
        status: "PENDING",
        assignedUserId: null,
        assignedUserName: null,
        startedAt: null,
        completedAt: null,
        remarks: `City Traffic issued clearance #${certNo}. Forwarded to SP for Franchise Resolution.`,
      };

      setApplication({
        ...application,
        currentDomain: "SP",
        status: "SP_RESOLUTION_PENDING",
        updatedAt: new Date().toISOString(),
      });
      setActiveTask(spTask);
      setTaskHistory((prev) => [...prev.map((t) => (t.id === completedTask.id ? completedTask : t)), spTask]);
    }

    setIsProcessing(false);
    toast.success(`City Traffic issued clearance #${certNo}! Submitted to SP for Franchise Resolution.`);
  };

  // STEP 3: SP Issues Resolution Number for Franchise Renewal
  const handleIssueSPResolution = async () => {
    if (!spResNumber.trim()) {
      toast.error("Please enter a valid SP Resolution Number.");
      return;
    }

    setIsProcessing(true);
    setSpResolutionIssued(true);

    if (application && activeTask) {
      const updatedApp: FranchiseApplicationRecord = {
        ...application,
        resolutionNo: spResNumber,
        resolutionDate: spResDate,
        status: "SP_RESOLUTION_ISSUED",
        updatedAt: new Date().toISOString(),
      };

      const updatedTask: FranchiseTaskRecord = {
        ...activeTask,
        status: "ASSIGNED",
        remarks: `SP Resolution #${spResNumber} enacted on ${spResDate} in ${spSessionNumber}. Ready to issue renewal billing.`,
      };

      setApplication(updatedApp);
      setActiveTask(updatedTask);
    }

    setIsProcessing(false);
    toast.success(`SP issued Resolution #${spResNumber} for Franchise Renewal.`);
  };

  // STEP 4: SP Issues Billing for Franchise Renewal & Submits to Treasury
  const handleIssueSPBillingAndSubmitToTreasury = async () => {
    if (!spResolutionIssued) {
      toast.error("SP Resolution must be issued first.");
      return;
    }

    setIsProcessing(true);
    const billRef = `ETRACS-SP-REN-2026-${String(bodyNumber).padStart(4, "0")}`;
    setSpRenewalBillingRef(billRef);

    if (application && activeTask) {
      const completedTask: FranchiseTaskRecord = {
        ...activeTask,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        remarks: `SP issued 3-Year Renewal Billing ${billRef} (₱8,600). Docket submitted to Treasury for payment.`,
      };

      const treasuryTask: FranchiseTaskRecord = {
        id: `task-${Date.now()}-treasury-payment`,
        applicationId: application.id,
        domain: "TREASURY",
        taskName: "Treasury Payment & OR Verification",
        requiredRole: "STAFF",
        status: "PENDING",
        assignedUserId: null,
        assignedUserName: null,
        startedAt: null,
        completedAt: null,
        remarks: `Treasury to check payment for Billing Ref ${billRef} under SP Resolution #${spResNumber}.`,
      };

      setApplication({
        ...application,
        currentDomain: "TREASURY",
        status: "TREASURY_PAYMENT_PENDING",
        updatedAt: new Date().toISOString(),
      });
      setActiveTask(treasuryTask);
      setTaskHistory((prev) => [...prev.map((t) => (t.id === completedTask.id ? completedTask : t)), treasuryTask]);
    }

    setIsProcessing(false);
    toast.success(`SP issued Renewal Billing ${billRef}! Docket submitted to Treasury for payment.`);
  };

  // STEP 5: Treasury Checks Payment OK & Sends Back to SP for Printing
  const handleTreasuryConfirmPayment = async () => {
    if (!treasuryOrNumber.trim()) {
      toast.error("Please provide an Official Receipt (OR) Number.");
      return;
    }

    setIsProcessing(true);
    setTreasuryPaymentConfirmed(true);

    if (application && activeTask) {
      const completedTask: FranchiseTaskRecord = {
        ...activeTask,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        remarks: `Treasury confirmed payment under OR #${treasuryOrNumber}. Sent back to SP for printing.`,
      };

      const spPrintTask: FranchiseTaskRecord = {
        id: `task-${Date.now()}-sp-print`,
        applicationId: application.id,
        domain: "SP",
        taskName: "Print Franchise Renewal & Add to Publication",
        requiredRole: "STAFF",
        status: "PENDING",
        assignedUserId: null,
        assignedUserName: null,
        startedAt: null,
        completedAt: null,
        remarks: `Payment verified under OR #${treasuryOrNumber}. SP to print certificate and record publication.`,
      };

      setApplication({
        ...application,
        currentDomain: "SP",
        status: "PAID_PENDING_PRINTING",
        updatedAt: new Date().toISOString(),
      });
      setActiveTask(spPrintTask);
      setTaskHistory((prev) => [...prev.map((t) => (t.id === completedTask.id ? completedTask : t)), spPrintTask]);
    }

    setIsProcessing(false);
    toast.success(`Treasury confirmed payment OK under OR #${treasuryOrNumber}! Sent back to SP for printing.`);
  };

  // STEP 6: SP Prints Franchise Renewal & Adds to Publication
  const handleSPPrintAndPublish = async () => {
    if (!treasuryPaymentConfirmed) {
      toast.error("Guard Failed: Treasury payment must be confirmed before printing.");
      return;
    }

    setIsProcessing(true);
    setSpPrinted(true);
    setSpPublished(true);

    if (application && activeTask) {
      const updatedTask: FranchiseTaskRecord = {
        ...activeTask,
        status: "ASSIGNED",
        remarks: `Franchise Renewal printed. Appended to ${spGazette}. Ready for final release.`,
      };

      setApplication({
        ...application,
        status: "SP_PRINTED_PUBLISHED",
        updatedAt: new Date().toISOString(),
      });
      setActiveTask(updatedTask);
    }

    setIsProcessing(false);
    toast.success("SP printed Franchise Renewal and recorded entry in Publication Gazette!");
  };

  // STEP 7: SP Releases the Franchise Renewal -> END
  const handleSPReleaseRenewal = async () => {
    if (!spPrinted || !spPublished) {
      toast.error("Guard Failed: Certificate must be printed and added to publication before release.");
      return;
    }

    setIsProcessing(true);
    const nowStr = new Date().toISOString();
    setSpReleased(true);
    setReleasedAtTimestamp(nowStr);

    if (application && activeTask) {
      const completedTask: FranchiseTaskRecord = {
        ...activeTask,
        status: "COMPLETED",
        completedAt: nowStr,
        remarks: `SP officially released sealed Franchise Renewal to operator ${applicantDisplayName}. Term: 2026 - 2029.`,
      };

      setApplication({
        ...application,
        status: "COMPLETED",
        updatedAt: nowStr,
      });
      setActiveTask(completedTask);
      setTaskHistory((prev) => prev.map((t) => (t.id === completedTask.id ? completedTask : t)));
    }

    setIsProcessing(false);
    toast.success(`SP successfully released Franchise Renewal for Body #${bodyNumber}! Workflow Completed.`);
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
                Domain: {application.currentDomain} • {application.status}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Franchise Renewal Lifecycle Engine
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Applicant: <span className="font-semibold text-slate-100">{applicantDisplayName}</span> • Unit Plate:{" "}
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

      {/* Domain-Driven Pipeline Stepper */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Municipal Renewal Workflow Pipeline (Republic Act No. 7160 / MTOP Framework)
          </div>
          <span className="text-[11px] font-mono text-indigo-600 font-bold">6-Step Statutory Sequence</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {RENEWAL_PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = application?.currentDomain === stage.domain;
            return (
              <div
                key={stage.label}
                className={`relative p-2.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                    : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                    Step {idx + 1}
                  </span>
                  {isCurrent ? (
                    <Clock className="w-3 h-3 text-indigo-600 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">
                  {stage.label}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {stage.taskName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Domain Interactive Control Center */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-4 text-xs">
          <TabsTrigger value="pipeline" className="text-xs">
            1. Active Task
          </TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs">
            2. City Traffic
          </TabsTrigger>
          <TabsTrigger value="sp-res" className="text-xs">
            3. SP Resolution
          </TabsTrigger>
          <TabsTrigger value="treasury" className="text-xs">
            4. SP Billing / Treasury
          </TabsTrigger>
          <TabsTrigger value="sp-pub" className="text-xs">
            5. SP Print & Gazette
          </TabsTrigger>
          <TabsTrigger value="sp-rel" className="text-xs">
            6. SP Release (End)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Active Task & Domain Overview */}
        <TabsContent value="pipeline" className="space-y-4">
          {activeTask ? (
            <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-md">
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/60 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white font-mono text-xs">
                      Target Office: {activeTask.domain}
                    </Badge>
                    <Badge variant={activeTask.status === "ASSIGNED" ? "secondary" : "outline"}>
                      {activeTask.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Task ID: {activeTask.id}</span>
                </div>
                <CardTitle className="text-base mt-2">{activeTask.taskName}</CardTitle>
                <CardDescription className="text-xs">
                  Assigned Officer: <span className="font-semibold text-indigo-600">{activeTask.assignedUserName || "Unclaimed (Pending in Department Queue)"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-slate-700 dark:text-slate-300">
                  <div className="font-medium text-slate-500 mb-0.5">Task Objective & Routing Context:</div>
                  {activeTask.remarks || "Queued in domain inbox."}
                </div>

                {currentUser.domain !== activeTask.domain && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                      Department Boundary: Active task belongs to <span className="font-bold">{activeTask.domain}</span>. Only officers assigned to this department may advance the state.
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-3">
                <span className="text-xs text-slate-400 font-mono">Role Required: {activeTask.requiredRole}</span>
                {activeTask.status === "PENDING" && (
                  <Button
                    size="sm"
                    onClick={handleAssignToMe}
                    disabled={isProcessing || (currentUser.domain !== activeTask.domain && currentUser.role !== "ADMIN")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                    Assign to Me
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <Card className="text-center p-6 text-xs text-slate-500">
              No active task currently assigned.
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: City Traffic Clearance */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                Step 2: City Traffic Management Office (CTMO) Clearance
              </CardTitle>
              <CardDescription className="text-xs">
                Physical roadworthiness inspection, chassis/engine matching, and violation clearance before SP council submission.
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
                  <span>Roadworthiness Inspection Passed</span>
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
                  <div className="font-semibold text-slate-700 dark:text-slate-300">City Traffic Violation Registry</div>
                  <div className="text-slate-500">Active tickets for plate {vehiclePlateDisplay}</div>
                </div>
                <Badge variant={ctmoViolationsCount === 0 ? "secondary" : "destructive"}>
                  {ctmoViolationsCount} Unsettled Violations
                </Badge>
              </div>

              {ctmoClearanceCert && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg text-emerald-800 text-xs">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Traffic Clearance Certificate Issued: #{ctmoClearanceCert}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    Clearance verified by CTMO Officer. Docket submitted to Sangguniang Panlungsod for Franchise Resolution.
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-3">
              <Button
                onClick={handleIssueClearanceAndSubmitToSP}
                disabled={isProcessing || !!ctmoClearanceCert}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                {ctmoClearanceCert ? "Clearance Issued & Submitted to SP" : "Issue Clearance & Submit to SP for Franchise Resolution"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB 3: SP Resolution */}
        <TabsContent value="sp-res" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                Step 3: Sangguniang Panlungsod (SP) Franchise Resolution
              </CardTitle>
              <CardDescription className="text-xs">
                City Council review of CTMO clearance docket and legislative enactment of the Franchise Renewal Resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Resolution Number</Label>
                  <Input
                    value={spResNumber}
                    onChange={(e) => setSpResNumber(e.target.value)}
                    placeholder="e.g. SP-RES-2026-042"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Resolution Enactment Date</Label>
                  <Input
                    type="date"
                    value={spResDate}
                    onChange={(e) => setSpResDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Legislative Session</Label>
                  <Input
                    value={spSessionNumber}
                    onChange={(e) => setSpSessionNumber(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {spResolutionIssued && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg text-emerald-800 text-xs">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    SP Resolution #{spResNumber} Enacted for Franchise Renewal
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    Resolution officially recorded in Sangguniang Panlungsod legislative journal on {spResDate}.
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-3">
              <Button
                onClick={handleIssueSPResolution}
                disabled={isProcessing || spResolutionIssued || !ctmoClearanceCert}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                {spResolutionIssued ? "Resolution Already Issued" : "Issue SP Resolution for Renewal"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB 4: SP Billing & Treasury */}
        <TabsContent value="treasury" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Step 4: SP Renewal Billing & Treasury Payment Check
              </CardTitle>
              <CardDescription className="text-xs">
                SP issues franchise renewal billing (₱6,000 for 3 years + municipal regulatory fees) & submits to Treasury. Treasury checks payment OK & returns to SP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Standard Franchise Renewal Schedule of Fees (3-Year Term)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600">
                  <div>Franchise Fee: ₱6,000.00</div>
                  <div>Mayor's Permit: ₱1,500.00</div>
                  <div>Metal Plate/Sticker: ₱350.00</div>
                  <div>Health/Sanitary: ₱250.00</div>
                </div>
                <div className="font-bold text-indigo-600 pt-1">
                  Total Municipal Assessment: ₱8,600.00
                </div>
              </div>

              {!spRenewalBillingRef ? (
                <div className="flex justify-end">
                  <Button
                    onClick={handleIssueSPBillingAndSubmitToTreasury}
                    disabled={isProcessing || !spResolutionIssued}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  >
                    Issue SP Billing & Submit to Treasury for Payment
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    SP Billing Issued: {spRenewalBillingRef} (Dispatched to Treasury)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Treasury Official Receipt (OR) Number</Label>
                      <Input
                        value={treasuryOrNumber}
                        onChange={(e) => setTreasuryOrNumber(e.target.value)}
                        placeholder="e.g. OR-TAG-2026-881920"
                        className="text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleTreasuryConfirmPayment}
                        disabled={isProcessing || treasuryPaymentConfirmed}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full"
                      >
                        {treasuryPaymentConfirmed
                          ? `Payment Verified (OR #${treasuryOrNumber})`
                          : "Treasury: Confirm Payment OK & Send Back to SP"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: SP Printing & Publication */}
        <TabsContent value="sp-pub" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                Step 5: SP Prints Franchise Renewal & Adds to Publication
              </CardTitle>
              <CardDescription className="text-xs">
                After receiving paid docket back from Treasury, SP prints the Certificate of Franchise Renewal and records in the official municipal publication gazette.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Official Publication Gazette / Bulletin Reference</Label>
                <Input
                  value={spGazette}
                  onChange={(e) => setSpGazette(e.target.value)}
                  className="text-xs"
                />
              </div>

              {spPrinted && spPublished && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg text-emerald-800 text-xs">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Franchise Renewal Printed & Appended to Publication Gazette
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    Recorded in {spGazette}. Ready for final physical release.
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-3">
              <Button
                onClick={handleSPPrintAndPublish}
                disabled={isProcessing || !treasuryPaymentConfirmed || spPrinted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {spPrinted ? "Certificate Printed & Published" : "Print Franchise Renewal & Add to Publication"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB 6: SP Release (End) */}
        <TabsContent value="sp-rel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Step 6: SP Releases Franchise Renewal (Workflow End)
              </CardTitle>
              <CardDescription className="text-xs">
                Final legislative seal and release of the Franchise Renewal Certificate to the operator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {spReleased ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-900">
                  <div className="text-base font-bold flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Franchise Renewal Officially Released!
                  </div>
                  <div className="text-xs text-emerald-800">
                    Body #{bodyNumber} ({applicantDisplayName}) has been renewed for 3 years (2026 - 2029).
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 pt-1">
                    Released By: {currentUser.name} • SP Resolution: #{spResNumber} • OR: #{treasuryOrNumber}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-slate-600">
                  Ready for physical certificate releasing. Please ensure all prior steps (Traffic Clearance, SP Resolution, Treasury Payment, Printing & Publication) are satisfied.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-3">
              <Button
                onClick={handleSPReleaseRenewal}
                disabled={isProcessing || !spPrinted || spReleased}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Award className="w-3.5 h-3.5 mr-1.5" />
                {spReleased ? "Franchise Released (Completed)" : "SP Release Franchise Renewal"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
