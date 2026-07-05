"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getItemAccounts } from "@/app/(dashboard)/financial/actions";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { evaluateFranchiseBill } from "@/lib/rules/engine";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  franchise: any | null;
  onSuccess: () => void;
}

export function BillingModal({ isOpen, onClose, franchise, onSuccess }: BillingModalProps) {
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  useEffect(() => {
    if (isOpen && franchise) {
      loadFees();
    }
  }, [isOpen, franchise]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const accounts = await getItemAccounts();
      setAllAccounts(accounts.filter((a: any) => a.isActive));
      
      const facts = {
        isRenewal: franchise.isRenewal,
        apptype: franchise.currentApplication?.apptype || (franchise.isRenewal ? 'renewal' : 'new')
      };
      
      const applicableFees = await evaluateFranchiseBill(facts, accounts);
      
      setFees(applicableFees);
      
      const total = applicableFees.reduce((sum: number, acc: any) => sum + (acc.default_amount || 0), 0);
      setTotalAmount(total);
    } catch (error) {
      toast.error("Failed to load billing fees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = () => {
    if (!selectedAccountId) return;
    const accountToAdd = allAccounts.find(a => a.id === selectedAccountId);
    if (!accountToAdd) return;
    
    if (fees.some(f => f.id === accountToAdd.id)) {
       toast.error("This fee is already added");
       return;
    }
    
    const newFees = [...fees, accountToAdd];
    setFees(newFees);
    setTotalAmount(newFees.reduce((sum, acc) => sum + (acc.default_amount || 0), 0));
    setSelectedAccountId("");
  };

  const handleRemoveFee = (index: number) => {
    const newFees = fees.filter((_, i) => i !== index);
    setFees(newFees);
    setTotalAmount(newFees.reduce((sum, acc) => sum + (acc.default_amount || 0), 0));
  };

  const generateBill = () => {
    if (!franchise) return;
    
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("MTOP FRANCHISE BILLING", 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Franchise No: ${franchise.franchiseNo}`, 14, 30);
      doc.text(`Owner Name: ${franchise.ownerName}`, 14, 36);
      doc.text(`Application Type: ${franchise.isRenewal ? 'Renewal' : 'New Application'}`, 14, 42);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);
      
      const tableData = fees.map(fee => [
        fee.account_name,
        fee.account_number,
        `PHP ${fee.default_amount.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: 55,
        head: [['Description', 'Account No.', 'Amount']],
        body: tableData,
        foot: [['', 'TOTAL', `PHP ${totalAmount.toFixed(2)}`]],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
      });
      
      doc.save(`Billing_${franchise.franchiseNo}_${franchise.ownerName.replace(/\s+/g, '_')}.pdf`);
      toast.success("Bill generated successfully");
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Bill</DialogTitle>
          <DialogDescription>
            Generate billing statement for {franchise?.ownerName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading fees...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Applicant:</div>
                  <div className="font-medium">{franchise?.ownerName}</div>
                  <div className="text-muted-foreground">Type:</div>
                  <div className="font-medium">{franchise?.isRenewal ? "Renewal" : "New Application"}</div>
                  <div className="text-muted-foreground">Franchise No:</div>
                  <div className="font-medium">{franchise?.franchiseNo}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Applicable Fees</h4>
                {fees.length > 0 ? (
                  <div className="border rounded-md overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Description</th>
                          <th className="text-right p-2 font-medium">Amount</th>
                          <th className="w-[40px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((fee, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{fee.account_name}</td>
                            <td className="p-2 text-right">₱{fee.default_amount.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveFee(i)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t font-medium bg-muted/50">
                        <tr>
                          <td className="p-2">Total</td>
                          <td className="p-2 text-right">₱{totalAmount.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 mb-4">
                    No matching item accounts found. Please add fees below.
                  </div>
                )}
                
                <div className="flex gap-2 items-center mt-2 p-3 bg-muted/30 rounded-md border border-dashed">
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue placeholder="Select an item account to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allAccounts
                        .filter(a => !fees.some(f => f.id === a.id))
                        .map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.account_name} (₱{acc.default_amount.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddFee} disabled={!selectedAccountId} size="sm">
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={generateBill} disabled={loading || fees.length === 0}>
            Generate & Send to SP Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
