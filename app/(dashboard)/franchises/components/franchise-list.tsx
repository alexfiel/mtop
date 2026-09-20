"use client";

import { useState, useEffect } from "react";
import type { Franchise, Tricycle, Driver } from "@prisma/client";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BillingModal } from "./billing-modal";
import {
  Car,
  User,
  Star,
  ShieldCheck,
  Eye,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type FranchiseWithRelations = Franchise & {
  tricycle?: (Tricycle & {
    mainDriver?: Driver | null;
    extraDriver?: Driver | null;
  }) | null;
};

interface FranchiseListProps {
  franchises: FranchiseWithRelations[];
  type: "pending" | "billing" | "payment" | "sp" | "approved" | "active";
}

export function FranchiseList({ franchises, type }: FranchiseListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSPModalOpen, setIsSPModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillingFranchise, setSelectedBillingFranchise] = useState<any>(null);
  const [spData, setSpData] = useState({ resolutionNo: "", approvedOn: "", areaOfOperation: "" });
  const [paymentData, setPaymentData] = useState({ amount: "", orNumber: "" });

  // Detail view modal states
  const [viewingTricycle, setViewingTricycle] = useState<any | null>(null);
  const [viewingDriver, setViewingDriver] = useState<any | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [franchises.length]);

  const totalItems = franchises.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedFranchises = franchises.slice(startIndex, endIndex);

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
      <div className="border rounded-md bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-36">Franchise No</TableHead>
              <TableHead>Owner Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned Tricycle Vehicle</TableHead>
              <TableHead>Assigned Driver(s)</TableHead>
              <TableHead>Applied At</TableHead>
              {type === "active" && <TableHead>Expiry Date</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFranchises.map((franchise) => {
              const tricycle = franchise.tricycle;
              const mainDriver = tricycle?.mainDriver;
              const extraDriver = tricycle?.extraDriver;

              return (
                <TableRow key={franchise.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold text-primary">
                    {franchise.franchiseNo}
                  </TableCell>
                  <TableCell className="font-medium">{franchise.ownerName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{franchise.contactNo}</TableCell>
                  
                  {/* Assigned Tricycle Vehicle (Clickable Link View) */}
                  <TableCell>
                    {tricycle ? (
                      <button
                        type="button"
                        onClick={() => setViewingTricycle({ ...tricycle, franchise })}
                        className="group flex flex-col items-start gap-1 p-2 -m-1 rounded-lg border border-border/70 hover:border-primary/50 bg-card hover:bg-primary/5 transition-all text-left cursor-pointer w-full max-w-[200px] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        title={`View details for Tricycle Body #${tricycle.bodyNumber}`}
                      >
                        <div className="flex items-center justify-between w-full gap-1.5">
                          <Badge
                            variant="outline"
                            className="font-mono font-bold text-xs bg-primary/10 border-primary/25 text-primary tracking-wider px-1.5 py-0"
                          >
                            <Hash className="h-2.5 w-2.5 mr-0.5 text-primary" />
                            {tricycle.bodyNumber}
                          </Badge>
                          <span className="text-[10px] font-medium text-primary flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:underline transition-all">
                            <Eye className="h-3 w-3" />
                            View
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">
                          {tricycle.make} {tricycle.model}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          Plate: {tricycle.plateNo}
                        </div>
                      </button>
                    ) : (
                      <Badge variant="outline" className="border-dashed text-xs text-muted-foreground font-normal">
                        No Tricycle Linked
                      </Badge>
                    )}
                  </TableCell>

                  {/* Assigned Drivers (Clickable Link View) */}
                  <TableCell>
                    <div className="space-y-1.5 min-w-[190px]">
                      {mainDriver && (
                        <button
                          type="button"
                          onClick={() => setViewingDriver({ ...mainDriver, role: "PRIMARY", tricycle, franchise })}
                          className="group flex items-center justify-between w-full p-1.5 rounded-md border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-2xs"
                          title={`View Primary Driver ${mainDriver.firstName} ${mainDriver.lastName}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-none px-1 py-0 text-[9px] font-semibold uppercase shrink-0">
                              <Star className="h-2 w-2 fill-amber-500 mr-0.5" />
                              Primary
                            </Badge>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-foreground truncate block group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                {mainDriver.firstName} {mainDriver.lastName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground block truncate">
                                {mainDriver.licenseNo}
                              </span>
                            </div>
                          </div>
                          <Eye className="h-3 w-3 text-amber-600 dark:text-amber-400 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0 ml-1" />
                        </button>
                      )}

                      {extraDriver && (
                        <button
                          type="button"
                          onClick={() => setViewingDriver({ ...extraDriver, role: "RELIEF", tricycle, franchise })}
                          className="group flex items-center justify-between w-full p-1.5 rounded-md border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500/50 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 shadow-2xs"
                          title={`View Relief Driver ${extraDriver.firstName} ${extraDriver.lastName}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Badge className="bg-blue-500/20 text-blue-800 dark:text-blue-300 border-none px-1 py-0 text-[9px] font-semibold uppercase shrink-0">
                              <ShieldCheck className="h-2 w-2 mr-0.5 text-blue-500" />
                              Relief
                            </Badge>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-foreground truncate block group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                {extraDriver.firstName} {extraDriver.lastName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground block truncate">
                                {extraDriver.licenseNo}
                              </span>
                            </div>
                          </div>
                          <Eye className="h-3 w-3 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0 ml-1" />
                        </button>
                      )}

                      {!mainDriver && !extraDriver && (
                        <span className="text-xs text-muted-foreground italic">No Drivers Attached</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(franchise.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  {type === "active" && (
                    <TableCell className="text-xs text-muted-foreground">
                      {franchise.expiresAt ? format(new Date(franchise.expiresAt), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{franchise.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {type === "pending" && (
                      <Button size="sm" onClick={() => handleAction(franchise.id, "FOR_BILLING")} className="cursor-pointer">
                        Send to Billing
                      </Button>
                    )}
                    {type === "billing" && (
                      <Button size="sm" onClick={() => setSelectedBillingFranchise(franchise)} className="cursor-pointer">
                        Create Bill
                      </Button>
                    )}
                    {type === "payment" && (
                      <Button 
                        size="sm" 
                        onClick={() => openPaymentModal(franchise)}
                        className="cursor-pointer"
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
                        className="cursor-pointer"
                      >
                        Approve via SP
                      </Button>
                    )}
                    {type === "approved" && (
                      <Button size="sm" onClick={() => handleAction(franchise.id, "PUBLISHED")} className="cursor-pointer">
                        Publish
                      </Button>
                    )}
                    {type === "active" && franchise.status === "ACTIVE" && (
                      <Button size="sm" variant="outline" onClick={() => window.open(`/franchises/${franchise.id}/certificate`, "_blank")} className="cursor-pointer">
                        View Certificate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* PAGINATION TOOLBAR */}
        {totalItems > 10 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-foreground">{totalItems > 0 ? startIndex + 1 : 0}</strong> to{" "}
                <strong className="text-foreground">{endIndex}</strong> of{" "}
                <strong className="text-foreground">{totalItems.toLocaleString()}</strong> records
              </span>
              {totalItems > pageSize && (
                <span className="text-muted-foreground/60 hidden sm:inline font-mono">
                  (Page {safeCurrentPage} of {totalPages})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Per page:</span>
                <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                  {[10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        pageSize === size
                          ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 cursor-pointer"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  title="First page"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 cursor-pointer"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  title="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 cursor-pointer"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  title="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 cursor-pointer"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  title="Last page"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TRICYCLE VEHICLE DETAIL DIALOG */}
      <Dialog open={!!viewingTricycle} onOpenChange={(open) => !open && setViewingTricycle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {viewingTricycle?.make} {viewingTricycle?.model}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tricycle Unit Specifications & Assignment
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewingTricycle && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-gradient-to-b from-card to-muted/30 p-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Official License Plate
                </span>
                <div className="text-2xl font-mono font-black tracking-widest text-foreground my-1">
                  {viewingTricycle.plateNo}
                </div>
                <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
                  Body #{viewingTricycle.bodyNumber}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Make & Model</span>
                  <span className="font-semibold text-foreground">{viewingTricycle.make} {viewingTricycle.model}</span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Color</span>
                  <span className="font-semibold text-foreground">{viewingTricycle.color}</span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Chassis No.</span>
                  <span className="font-mono text-foreground">{viewingTricycle.chassisNo}</span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Motor/Engine No.</span>
                  <span className="font-mono text-foreground">{viewingTricycle.motorNo}</span>
                </div>
              </div>

              {viewingTricycle.franchise && (
                <div className="p-3.5 rounded-xl border bg-muted/10 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Linked Franchise Record
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Franchise No:</span>
                    <span className="font-mono font-bold text-primary">{viewingTricycle.franchise.franchiseNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Owner Name:</span>
                    <span className="font-medium text-foreground">{viewingTricycle.franchise.ownerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-mono text-foreground">{viewingTricycle.franchise.contactNo}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingTricycle(null)} className="w-full">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DRIVER DETAIL DIALOG */}
      <Dialog open={!!viewingDriver} onOpenChange={(open) => !open && setViewingDriver(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <User className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {viewingDriver?.firstName} {viewingDriver?.lastName}
                </DialogTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    className={
                      viewingDriver?.role === "PRIMARY"
                        ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-none text-[10px] font-semibold"
                        : "bg-blue-500/20 text-blue-800 dark:text-blue-300 border-none text-[10px] font-semibold"
                    }
                  >
                    {viewingDriver?.role === "PRIMARY" ? "Primary Driver" : "Relief Driver"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{viewingDriver?.status}</Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          {viewingDriver && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> License No.
                  </span>
                  <span className="font-mono font-bold text-foreground mt-0.5 block">
                    {viewingDriver.licenseNo}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Contact No.
                  </span>
                  <span className="font-mono font-bold text-foreground mt-0.5 block">
                    {viewingDriver.contactNo}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-muted/10 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Address</span>
                    <span className="text-foreground">{viewingDriver.address}</span>
                  </div>
                </div>

                {viewingDriver.tricycle && (
                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Assigned Unit:</span>
                    <span className="font-mono font-semibold text-primary">
                      Body #{viewingDriver.tricycle.bodyNumber} • {viewingDriver.tricycle.plateNo}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingDriver(null)} className="w-full">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
