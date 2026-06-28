"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { searchFranchiseForRenewal, processFranchiseRenewal } from "../actions";
import { format, differenceInDays } from "date-fns";
import { BillingModal } from "./billing-modal";
import { Search, AlertTriangle, CheckCircle2 } from "lucide-react";

export function FranchiseRenewal({ onSuccess }: { onSuccess: () => void }) {
  const [franchiseNo, setFranchiseNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [franchise, setFranchise] = useState<any>(null);
  const [billingFranchise, setBillingFranchise] = useState<any>(null);

  const handleSearch = async () => {
    if (!franchiseNo.trim()) {
      toast.error("Please enter a Franchise No.");
      return;
    }
    setLoading(true);
    try {
      const result = await searchFranchiseForRenewal(franchiseNo);
      if (!result) {
        toast.error("Franchise not found.");
        setFranchise(null);
      } else {
        setFranchise(result);
      }
    } catch (e) {
      toast.error("Error searching franchise.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!franchise) return;
    setLoading(true);
    try {
      const updatedFranchise = await processFranchiseRenewal(franchise.id);
      toast.success("Franchise set for renewal.");
      // Open billing modal with the updated franchise (isRenewal = true)
      setBillingFranchise(updatedFranchise);
    } catch (e) {
      toast.error("Failed to renew franchise.");
    } finally {
      setLoading(false);
    }
  };

  const renderEligibility = () => {
    if (!franchise) return null;
    
    // If not active, it might not be valid for renewal, but we'll check expiration primarily
    if (!franchise.expiresAt) {
      return (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md mt-4">
          <AlertTriangle className="h-5 w-5" />
          <span>This franchise has no expiration date set.</span>
        </div>
      );
    }

    const daysUntilExpiry = differenceInDays(new Date(franchise.expiresAt), new Date());
    const isExpired = daysUntilExpiry < 0;
    const isEligible = daysUntilExpiry <= 30; // 1 month before expiry or expired

    if (isEligible) {
      return (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-medium">Eligible for Renewal</p>
              <p className="text-sm">
                {isExpired 
                  ? `Franchise expired ${Math.abs(daysUntilExpiry)} days ago.` 
                  : `Franchise expires in ${daysUntilExpiry} days.`}
              </p>
            </div>
          </div>
          <Button onClick={handleRenew} disabled={loading} className="w-full sm:w-auto self-end">
            Renew Franchise & Generate Bill
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 mt-4">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Not yet eligible for renewal</p>
            <p className="text-sm">Franchise expires in {daysUntilExpiry} days. You can renew at most 30 days before expiry.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Renew Existing Franchise</h2>
        <div className="flex gap-3 items-end">
          <div className="space-y-2 flex-1">
            <Label>Franchise No.</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. TAG-MTOP-2026-0001"
                value={franchiseNo}
                onChange={(e) => setFranchiseNo(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            Search
          </Button>
        </div>

        {franchise && (
          <div className="mt-8 space-y-4 border-t pt-6">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Franchise Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Owner Name</span>
                <span className="font-medium text-base">{franchise.ownerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Current Status</span>
                <span className="font-medium">{franchise.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Assigned Tricycle</span>
                <span className="font-medium">{franchise.tricycle?.bodyNumber || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Expiration Date</span>
                <span className="font-medium">
                  {franchise.expiresAt ? format(new Date(franchise.expiresAt), "MMM d, yyyy") : "N/A"}
                </span>
              </div>
            </div>

            {renderEligibility()}
          </div>
        )}
      </div>

      <BillingModal 
        isOpen={!!billingFranchise}
        onClose={() => {
          setBillingFranchise(null);
          setFranchise(null);
          setFranchiseNo("");
          onSuccess();
        }}
        franchise={billingFranchise}
        onSuccess={() => {
          // Keep it simple: after billing modal finishes (user clicks Generate & Send to Payment)
          // The BillingModal logic itself handles the transition to FOR_PAYMENT.
          setBillingFranchise(null);
          setFranchise(null);
          setFranchiseNo("");
          onSuccess();
        }}
      />
    </div>
  );
}
