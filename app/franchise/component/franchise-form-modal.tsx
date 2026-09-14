"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Hash, Loader2, Sparkles, CheckCircle2, Layers, AlertCircle } from "lucide-react";
import {
  createNewFranchise,
  updateNewFranchise,
  generateBodyNumber,
  batchGenerateFranchiseRange,
} from "../actions";

interface FranchiseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchise?: any | null;
  suggestedBodyNumber?: number;
  onSuccess: () => void;
}

export function FranchiseFormModal({
  open,
  onOpenChange,
  franchise,
  suggestedBodyNumber = 1,
  onSuccess,
}: FranchiseFormModalProps) {
  const isEditing = Boolean(franchise);

  // Form Mode: "single" or "batch" (only available when creating)
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single Slot state
  const [bodyNumber, setBodyNumber] = useState<string>("");
  const [zone, setZone] = useState<string>("Tagbilaran City");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>("");

  // Range inputs for generation (e.g. 1 to 3000)
  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeTo, setRangeTo] = useState<number>(3000);

  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (franchise) {
      setBodyNumber(franchise.franchiseBodyNumber?.toString() || "");
      setZone(franchise.zone || "Tagbilaran City");
      setIsActive(Boolean(franchise.isActive));
      setRemarks(franchise.remarks || "");
      setMode("single");
      setGenerationFeedback(null);
    } else {
      setBodyNumber(suggestedBodyNumber ? suggestedBodyNumber.toString() : "1");
      setZone("Tagbilaran City");
      setIsActive(false);
      setRemarks("");
      setRangeFrom(1);
      setRangeTo(3000);
      setMode("single");
      setGenerationFeedback(null);
    }
  }, [franchise, suggestedBodyNumber, open]);

  // Generate next available body number from the input range (e.g. 1 to 3000)
  const handleGenerateFromRange = async () => {
    if (rangeFrom > rangeTo) {
      toast.error("Range 'From' must be less than or equal to 'To'.");
      return;
    }

    setGenerating(true);
    try {
      const res = await generateBodyNumber({
        startRange: Number(rangeFrom),
        endRange: Number(rangeTo),
      });

      if (res.success && res.bodyNumber !== undefined) {
        setBodyNumber(res.bodyNumber.toString());
        setGenerationFeedback(res.reason || `Generated Body #${res.bodyNumber}`);
        toast.success(`Generated Franchise Body #${res.bodyNumber}`, {
          description: `Allocated next available number in range ${rangeFrom} to ${rangeTo}.`,
        });
      } else {
        toast.error(res.error || "Could not generate body number from range.");
        setGenerationFeedback(res.error || null);
      }
    } catch (err: any) {
      toast.error(err.message || "Error generating body number.");
    } finally {
      setGenerating(false);
    }
  };

  // Submit Single or Batch
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "batch") {
      if (rangeFrom > rangeTo) {
        toast.error("Range 'From' must be less than or equal to 'To'.");
        return;
      }

      setLoading(true);
      try {
        const res = await batchGenerateFranchiseRange(rangeFrom, rangeTo, zone);
        if (res.success) {
          toast.success(`Generated ${res.count} available franchise slots in range ${rangeFrom} to ${rangeTo}.`);
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(res.error || "Failed to batch generate body numbers.");
        }
      } catch (err: any) {
        toast.error(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single mode submission
    const num = parseInt(bodyNumber, 10);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive Franchise Body Number.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && franchise) {
        const res = await updateNewFranchise(franchise.id, {
          franchiseBodyNumber: num,
          zone,
          isActive,
          remarks,
        });

        if (res.success) {
          toast.success(`Franchise Body #${num} updated successfully.`);
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(res.error || "Failed to update franchise.");
        }
      } else {
        const res = await createNewFranchise({
          franchiseBodyNumber: num,
          zone,
          isActive,
          remarks,
        });

        if (res.success) {
          toast.success(`Franchise Body #${num} registered to unassigned pool.`);
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(res.error || "Failed to register franchise.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <Hash className="h-5 w-5" />
              </span>
              {isEditing ? `Edit Franchise #${franchise?.franchiseBodyNumber}` : "Register Franchise Body Number"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update franchise parameters or administrative remarks."
                : "Create franchise body number slots. Use the range generator to find or batch generate available numbers."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher (only when creating) */}
          {!isEditing && (
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="single" className="text-xs font-semibold gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Single Body Number
                </TabsTrigger>
                <TabsTrigger value="batch" className="text-xs font-semibold gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Batch Range Generation
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="space-y-4">
            {/* RANGE-BASED GENERATOR SECTION */}
            <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Body Number Range Input
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Range: {rangeFrom} — {rangeTo}
                </span>
              </div>

              {/* Range Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rangeFrom" className="text-[11px] font-medium text-muted-foreground">
                    Range From *
                  </Label>
                  <Input
                    id="rangeFrom"
                    type="number"
                    min={1}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="h-9 font-mono font-bold text-sm bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rangeTo" className="text-[11px] font-medium text-muted-foreground">
                    Range To *
                  </Label>
                  <Input
                    id="rangeTo"
                    type="number"
                    min={1}
                    value={rangeTo}
                    onChange={(e) => setRangeTo(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="h-9 font-mono font-bold text-sm bg-background"
                  />
                </div>
              </div>

              {/* THE FUNCTION BUTTON: Generate Body Number based on input range */}
              {mode === "single" && (
                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={handleGenerateFromRange}
                    disabled={generating}
                    variant="secondary"
                    className="w-full h-10 gap-2 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 cursor-pointer transition-all shadow-2xs"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    )}
                    <span>Generate Next Body Number in Range ({rangeFrom} to {rangeTo})</span>
                  </Button>

                  {generationFeedback && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{generationFeedback}</span>
                    </div>
                  )}
                </div>
              )}

              {mode === "batch" && (
                <p className="text-[11px] text-muted-foreground">
                  The system will scan range <strong>{rangeFrom}</strong> to <strong>{rangeTo}</strong>, skip any numbers already taken, and populate all available body numbers into the unassigned pool.
                </p>
              )}
            </div>

            {/* SINGLE MODE: BODY NUMBER INPUT FIELD */}
            {mode === "single" && (
              <div className="space-y-2">
                <Label htmlFor="bodyNumber" className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  Target Body Number *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-muted-foreground">#</span>
                  <Input
                    id="bodyNumber"
                    type="number"
                    placeholder="e.g. 1001"
                    value={bodyNumber}
                    onChange={(e) => {
                      setBodyNumber(e.target.value);
                      setGenerationFeedback(null);
                    }}
                    className="pl-8 font-mono font-bold text-base tracking-wider bg-background"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  You can type any specific number or click the button above to generate from your range.
                </p>
              </div>
            )}

            {/* Operational Status (Single Mode) */}
            {mode === "single" && (
              <div className="rounded-xl border p-3 bg-card flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                    Operational Status
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isActive ? "Active - Authorized for road service" : "Inactive / Available in pool"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsActive(!isActive)}
                  className={`h-7 text-xs ${isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  {isActive ? "Active" : "Inactive"}
                </Button>
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="remarks" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administrative Remarks (Optional)
              </Label>
              <Textarea
                id="remarks"
                rows={2}
                placeholder="E.g., Allocated under Resolution No. 2026-088; Waiting for operator credential clearance..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2 bg-primary font-semibold">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing
                ? "Save Changes"
                : mode === "batch"
                ? `Batch Generate (${rangeFrom} to ${rangeTo})`
                : "Create Franchise Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
