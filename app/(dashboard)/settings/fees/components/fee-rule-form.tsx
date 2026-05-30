"use client";

import { useState } from "react";
import { FeeRule } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createFeeRule, updateFeeRule } from "../actions";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function FeeRuleForm({
  initialData,
  onSuccess,
  onCancel
}: {
  initialData: FeeRule | null,
  onSuccess: () => void,
  onCancel: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [applicationType, setApplicationType] = useState(initialData?.applicationType || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!applicationType || !description || !amount) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    const data = {
      applicationType,
      description,
      amount: parseFloat(amount),
      isActive
    };

    let result;
    if (initialData) {
      result = await updateFeeRule(initialData.id, data);
    } else {
      result = await createFeeRule(data);
    }

    if (result.success) {
      toast.success(initialData ? "Fee rule updated!" : "Fee rule created!");
      onSuccess();
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="max-w-xl mx-auto shadow-sm border">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Fee Rule" : "Add New Fee Rule"}</CardTitle>
        <CardDescription>Specify the fee line item and which application type it belongs to.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Application Type</Label>
            <Select value={applicationType} onValueChange={(val) => setApplicationType(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW_FRANCHISE">New Franchise</SelectItem>
                <SelectItem value="NEW_FRANCHISE_DRIVER">New Franchise Driver</SelectItem>
                <SelectItem value="NEW_FRANCHISE_OPERATOR">New Franchise Operator</SelectItem>
                <SelectItem value="NEW_TRICYCLE">New Tricycle</SelectItem>
                <SelectItem value="RENEWAL_FRANCHISE">Renewal</SelectItem>
                <SelectItem value="RENEWAL_TRICYCLE">Renewal Tricycle</SelectItem>
                <SelectItem value="RETIREMENT_FRANCHISE">Retirement</SelectItem>
                <SelectItem value="RETIREMENT_TRICYCLE">Retirement Tricycle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fee Description (Line Item)</Label>
            <Input
              placeholder="e.g. Mayor's Permit Fee, Filing Fee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Amount (₱)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(c) => setIsActive(c as boolean)}
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active (Apply this fee automatically)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Rule"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
