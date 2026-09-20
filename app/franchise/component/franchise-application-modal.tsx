"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { toast } from "sonner";

export interface FranchiseApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchise: any | null;
  onSuccess?: () => void;
}

const DOMAIN_SEQUENCE = [
  { domain: "BPLO", label: "BPLO Intake", task: "Receiving & Verification", role: "STAFF" },
  { domain: "TREASURY", label: "Treasury", task: "Assessment & Tax Payment", role: "STAFF" },
  { domain: "ZONING", label: "Zoning & Traffic", task: "Route Clearance & Inspection", role: "STAFF" },
  { domain: "SP", label: "City Council", task: "SP Resolution Approval", role: "SUPERVISOR" },
  { domain: "MAYOR", label: "Mayor's Office", task: "Executive Permit Issuance", role: "ADMIN" },
];

export function FranchiseApplicationModal({
  open,
  onOpenChange,
  franchise,
  onSuccess,
}: FranchiseApplicationModalProps) {
  const [activeTab, setActiveTab] = useState<"workflow" | "history">("workflow");
  const [forwardDialogOpen, setForwardDialogOpen] = useState<boolean>(false);

  // Forward form state
  const [targetDomain, setTargetDomain] = useState<string>("TREASURY");
  const [nextTaskName, setNextTaskName] = useState<string>("Assessment & Tax Payment");
  const [forwardRemarks, setForwardRemarks] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Local simulated workflow state for demonstration
  const [currentDomain, setCurrentDomain] = useState<string>("BPLO");
  const [currentTaskName, setCurrentTaskName] = useState<string>("Receiving & Verification");
  const [currentTaskStatus, setCurrentTaskStatus] = useState<"PENDING" | "ASSIGNED" | "COMPLETED">("PENDING");
  const [assigneeName, setAssigneeName] = useState<string | null>(null);

  if (!franchise) return null;

  const handleAssignToMe = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setAssigneeName("Officer Current User (You)");
      setCurrentTaskStatus("ASSIGNED");
      setIsSubmitting(false);
      toast.success("Task successfully claimed and locked to your profile.");
    }, 400);
  };

  const handleForwardTask = () => {
    if (!forwardRemarks.trim()) {
      toast.error("Please provide transition remarks for the target domain.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentDomain(targetDomain);
      setCurrentTaskName(nextTaskName);
      setCurrentTaskStatus("PENDING");
      setAssigneeName(null);
      setForwardDialogOpen(false);
      setForwardRemarks("");
      setIsSubmitting(false);
      toast.success(`Application atomically forwarded to ${targetDomain} domain.`);
      onSuccess?.();
    }, 500);
  };

  const currentDomainIndex = DOMAIN_SEQUENCE.findIndex((d) => d.domain === currentDomain);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 border shadow-2xl">
        {/* HEADER */}
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
                <FileText className="h-6 w-6" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Franchise Application Workflow</span>
                  <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
                    Body #{franchise.franchiseBodyNumber}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Multi-Domain Government Routing & State Machine Engine • LGU Tagbilaran City
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={
                  currentTaskStatus === "ASSIGNED"
                    ? "bg-blue-600 text-white gap-1 text-xs"
                    : "bg-amber-600 text-white gap-1 text-xs"
                }
              >
                {currentTaskStatus === "ASSIGNED" ? <UserCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {currentTaskStatus}: {currentDomain}
              </Badge>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("workflow")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "workflow"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Active Domain & Task Action
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Task Audit Trail
            </button>
          </div>
        </DialogHeader>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6">
          {/* FRANCHISE & OPERATOR SUMMARY BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border bg-muted/20 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Assigned Operator</span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">
                {franchise.operator?.name || "Unassigned Operator"}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {franchise.operator?.operatorId || "ID PENDING"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Linked Vehicle</span>
              <span className="font-mono font-semibold text-primary mt-0.5 block">
                {franchise.mtopVehicle?.plateNumber || "No Vehicle Linked"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {franchise.mtopVehicle ? `${franchise.mtopVehicle.make} ${franchise.mtopVehicle.model}` : "Pending assignment"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Zone & Status</span>
              <span className="font-medium text-foreground mt-0.5 block">
                {franchise.zone || "Tagbilaran City"}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {franchise.isActive ? "ACTIVE ROAD PERMIT" : "APPLICATION IN PROGRESS"}
              </span>
            </div>
          </div>

          {activeTab === "workflow" ? (
            <>
              {/* MULTI-DOMAIN PROGRESS STEPPER */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Inter-Domain Routing Lifecycle
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {DOMAIN_SEQUENCE.map((step, idx) => {
                    const isPassed = idx < currentDomainIndex;
                    const isCurrent = idx === currentDomainIndex;
                    return (
                      <div
                        key={step.domain}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          isCurrent
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : isPassed
                            ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
                            : "border-border/60 bg-muted/10 opacity-60"
                        }`}
                      >
                        <div className="text-[10px] font-bold font-mono tracking-wider">
                          {idx + 1}. {step.domain}
                        </div>
                        <div className="text-[11px] font-semibold truncate mt-0.5">
                          {step.label}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-1 truncate">
                          {isPassed ? "Completed" : isCurrent ? "Active Step" : "Queued"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CURRENT ACTIVE TASK CARD */}
              <div className="rounded-xl border-2 border-primary/30 bg-card p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">
                      Active Departmental Task
                    </span>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2 mt-0.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {currentDomain}: {currentTaskName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Required: STAFF / ADMIN
                    </Badge>
                    <Badge
                      className={
                        currentTaskStatus === "ASSIGNED"
                          ? "bg-blue-600 text-white text-[10px]"
                          : "bg-amber-600 text-white text-[10px]"
                      }
                    >
                      {currentTaskStatus}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Current Assignee:</span>
                    {assigneeName ? (
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        <span>{assigneeName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        <span>Unassigned in Domain Queue (Pending Claim)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Domain SLA & Concurrency:</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <span>Pessimistic Row Lock & Domain Isolation Active</span>
                    </div>
                  </div>
                </div>

                {/* TASK ACTION BAR */}
                <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {currentTaskStatus === "PENDING"
                      ? "Claim this task to lock assignment before processing."
                      : "Task claimed. Complete processing and forward to the next domain."}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentTaskStatus === "PENDING" ? (
                      <Button
                        onClick={handleAssignToMe}
                        disabled={isSubmitting}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                      >
                        <UserCheck className="h-4 w-4" />
                        Assign to Me
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setForwardDialogOpen(true)}
                        disabled={isSubmitting}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer shadow-xs"
                      >
                        <Send className="h-4 w-4" />
                        Forward Task to Next Domain
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* AUDIT TRAIL TAB */
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Immutable Event & Task Log
              </span>
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg border bg-muted/20 flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white text-[10px]">COMPLETED</Badge>
                      <span className="font-bold text-foreground">BPLO: Application Intake & Capture</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Initial receiving task recorded by Clerk Maria Santos (BPLO).
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Today at 10:15 AM</span>
                </div>

                <div className="p-3 rounded-lg border bg-primary/5 border-primary/30 flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white text-[10px]">ACTIVE</Badge>
                      <span className="font-bold text-foreground">{currentDomain}: {currentTaskName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {assigneeName ? `Locked by ${assigneeName}` : "Awaiting claim by domain officer"}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-primary font-bold">In Progress</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close View
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* FORWARD TASK DIALOG */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Forward Task (Inter-Domain Handoff)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atomically completes the current task in {currentDomain} and provisions a new task in the target domain queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="targetDomain">Target Domain Department</Label>
              <Select value={targetDomain} onValueChange={(val) => {
                if (val) {
                  setTargetDomain(val);
                  const step = DOMAIN_SEQUENCE.find(d => d.domain === val);
                  if (step) setNextTaskName(step.task);
                }
              }}>
                <SelectTrigger id="targetDomain" className="h-9">
                  <SelectValue placeholder="Select target department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TREASURY">Treasury (Assessment & Payment)</SelectItem>
                  <SelectItem value="ZONING">Zoning & Traffic (Route Clearance)</SelectItem>
                  <SelectItem value="SP">Sangguniang Panlungsod (Resolution)</SelectItem>
                  <SelectItem value="MAYOR">Mayor's Office (Permit Issuance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nextTask">Downstream Task Name</Label>
              <Input
                id="nextTask"
                value={nextTaskName}
                onChange={(e) => setNextTaskName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remarks">Handoff Instructions & Audit Remarks</Label>
              <Textarea
                id="remarks"
                value={forwardRemarks}
                onChange={(e) => setForwardRemarks(e.target.value)}
                placeholder="e.g., Documents verified. Forwarding to Treasury for regulatory fee assessment."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleForwardTask} disabled={isSubmitting} className="bg-primary">
              Confirm Handoff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
