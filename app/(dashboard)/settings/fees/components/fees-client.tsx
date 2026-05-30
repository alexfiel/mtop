"use client";

import { useState } from "react";
import { FeeRule } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Edit, CheckCircle2, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FeeRuleForm } from "./fee-rule-form";
import { deleteFeeRule } from "../actions";

export function FeesClient({ initialFees }: { initialFees: FeeRule[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeRule | null>(null);

  const applications = Array.from(new Set(initialFees.map(f => f.applicationType))).sort();

  const handleEdit = (fee: FeeRule) => {
    setEditingFee(fee);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee rule?")) return;
    
    const res = await deleteFeeRule(id);
    if (res.success) {
      toast.success("Fee rule deleted.");
    } else {
      toast.error(res.error || "Failed to delete.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Rules Engine</h2>
          <p className="text-muted-foreground mt-2">
            Configure fees and charges for NEW, RENEWAL, and RETIREMENT applications.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Rule
          </Button>
        )}
      </div>

      {showForm ? (
        <FeeRuleForm 
          initialData={editingFee}
          onSuccess={() => {
            setShowForm(false);
            setEditingFee(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingFee(null);
          }}
        />
      ) : (
        <div className="space-y-8">
          {applications.map(appType => {
            const rules = initialFees.filter(f => f.applicationType === appType);
            const totalActive = rules.filter(f => f.isActive).reduce((sum, f) => sum + f.amount, 0);

            return (
              <div key={appType} className="border rounded-md bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{appType} Application</h3>
                  <div className="text-sm font-medium text-slate-600">
                    Total Active Fees: <span className="text-green-600 font-bold">₱{totalActive.toFixed(2)}</span>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.description}</TableCell>
                        <TableCell>₱{rule.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {rule.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100">
                              <XCircle className="w-3 h-3 mr-1" /> Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
          
          {initialFees.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-md border-dashed">
              No fee rules configured. Click "Add New Rule" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
