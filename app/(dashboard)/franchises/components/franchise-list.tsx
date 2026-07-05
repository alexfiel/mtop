"use client";

import { useState } from "react";
import type { Franchise, Tricycle } from "@prisma/client";
import { updateFranchiseStatus, recordFranchisePayment } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BillingModal } from "./billing-modal";

interface FranchiseListProps {
  franchises: (Franchise & { tricycle?: Tricycle | null })[];
  type: "pending" | "billing" | "payment" | "sp" | "approved" | "active";
}

export function FranchiseList({ franchises, type }: FranchiseListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSPModalOpen, setIsSPModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillingFranchise, setSelectedBillingFranchise] = useState<any>(null);
  const [spData, setSpData] = useState({ resolutionNo: "", approvedOn: "", areaOfOperation: "" });
  const [paymentData, setPaymentData] = useState({ amount: "", orNumber: "" });

  const openPaymentModal = async (franchise: any) => {
    setSelectedId(franchise.id);
    setPaymentData({ amount: "Loading...", orNumber: "" });
    setIsPaymentModalOpen(true);
    
    try {
      const res = await fetch(`/api/franchises/${franchise.id}/bill`);
      const responseData = await res.json();
      if (responseData.success && responseData.data.totalAmount !== undefined) {
        setPaymentData(prev => ({ ...prev, amount: responseData.data.totalAmount.toString() }));
      } else {
        setPaymentData(prev => ({ ...prev, amount: "" }));
      }
    } catch (e) {
      console.error(e);
      setPaymentData(prev => ({ ...prev, amount: "" }));
    }
  };

  const handleAction = async (id: string, newStatus: string, extraData?: any) => {
    try {
      await updateFranchiseStatus(id, newStatus, extraData);
      toast.success("Franchise updated successfully.");
    } catch (e) {
      toast.error("Failed to update franchise.");
    }
  };

  const handleSPApproval = async () => {
    if (!selectedId) return;
    await handleAction(selectedId, "APPROVED", {
      resolutionNo: spData.resolutionNo,
      approvedOn: new Date(spData.approvedOn),
      areaOfOperation: spData.areaOfOperation,
    });
    setIsSPModalOpen(false);
  };

  const handlePayment = async () => {
    if (!selectedId || !paymentData.amount || !paymentData.orNumber) {
      toast.error("Please fill in all payment details.");
      return;
    }
    try {
      await recordFranchisePayment({
        franchiseId: selectedId,
        amount: parseFloat(paymentData.amount),
        orNumber: paymentData.orNumber,
      });
      // The action `recordFranchisePayment` previously updated status to FOR_SP_APPROVAL.
      // We need to change that in actions.ts to ACTIVE.
      toast.success("Payment recorded successfully.");
      setIsPaymentModalOpen(false);
    } catch (e) {
      toast.error("Failed to record payment.");
    }
  };

  if (franchises.length === 0) {
    return <div className="p-8 text-center text-muted-foreground border rounded-md">No franchises found for this status.</div>;
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Franchise No</TableHead>
              <TableHead>Owner Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned Tricycle</TableHead>
              <TableHead>Applied At</TableHead>
              {type === "active" && <TableHead>Expiry Date</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {franchises.map((franchise) => (
              <TableRow key={franchise.id}>
                <TableCell className="font-medium">{franchise.franchiseNo}</TableCell>
                <TableCell>{franchise.ownerName}</TableCell>
                <TableCell>{franchise.contactNo}</TableCell>
                <TableCell>
                  {franchise.tricycle ? (
                    <span className="text-sm font-medium">{franchise.tricycle.bodyNumber}</span>
                  ) : (
                    <span className="text-sm italic text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>{format(new Date(franchise.createdAt), "MMM d, yyyy")}</TableCell>
                {type === "active" && (
                  <TableCell>
                    {franchise.expiresAt ? format(new Date(franchise.expiresAt), "MMM d, yyyy") : "N/A"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline">{franchise.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {type === "pending" && (
                    <Button size="sm" onClick={() => handleAction(franchise.id, "FOR_BILLING")}>
                      Send to Billing
                    </Button>
                  )}
                  {type === "billing" && (
                    <Button size="sm" onClick={() => setSelectedBillingFranchise(franchise)}>
                      Create Bill
                    </Button>
                  )}
                  {type === "payment" && (
                    <Button 
                      size="sm" 
                      onClick={() => openPaymentModal(franchise)}
                    >
                      Record Payment
                    </Button>
                  )}
                  {type === "sp" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedId(franchise.id);
                        setIsSPModalOpen(true);
                      }}
                    >
                      Approve via SP
                    </Button>
                  )}
                  {type === "approved" && (
                    <Button size="sm" onClick={() => handleAction(franchise.id, "PUBLISHED")}>
                      Publish
                    </Button>
                  )}
                  {type === "payment" && (
                    <Button 
                      size="sm" 
                      onClick={() => openPaymentModal(franchise)}
                    >
                      Record Payment
                    </Button>
                  )}
                  {type === "active" && franchise.status === "ACTIVE" && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`/franchises/${franchise.id}/certificate`, "_blank")}>
                      View Certificate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isSPModalOpen} onOpenChange={setIsSPModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SP Approval Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resolution No.</Label>
              <Input
                value={spData.resolutionNo}
                onChange={(e) => setSpData({ ...spData, resolutionNo: e.target.value })}
                placeholder="Res. No. 2026-123"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Approved</Label>
              <Input
                type="date"
                value={spData.approvedOn}
                onChange={(e) => setSpData({ ...spData, approvedOn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Area of Operation</Label>
              <Input
                value={spData.areaOfOperation}
                onChange={(e) => setSpData({ ...spData, areaOfOperation: e.target.value })}
                placeholder="Poblacion Area"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSPModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSPApproval}>Save Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Franchise Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>O.R. Number</Label>
              <Input
                value={paymentData.orNumber}
                onChange={(e) => setPaymentData({ ...paymentData, orNumber: e.target.value })}
                placeholder="e.g. 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (PHP)</Label>
              <Input
                type="number"
                value={paymentData.amount}
                readOnly
                className="bg-muted"
                placeholder="e.g. 1500"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Recording this payment will finalize the application and issue the certificate.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BillingModal 
        isOpen={!!selectedBillingFranchise}
        onClose={() => setSelectedBillingFranchise(null)}
        franchise={selectedBillingFranchise}
        onSuccess={() => {
          if (selectedBillingFranchise) {
            handleAction(selectedBillingFranchise.id, "FOR_SP_APPROVAL");
            setSelectedBillingFranchise(null);
          }
        }}
      />
    </>
  );
}
