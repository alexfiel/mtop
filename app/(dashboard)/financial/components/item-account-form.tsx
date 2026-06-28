"use client";

import { useState } from "react";
import { createItemAccount } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ItemAccountForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    account_name: "",
    account_number: "",
    default_amount: "",
    fundtype: "General Fund",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createItemAccount({
        account_name: formData.account_name,
        account_number: formData.account_number,
        default_amount: parseFloat(formData.default_amount) || 0,
        fundtype: formData.fundtype,
      });

      if (result.success) {
        toast.success("Item Account created successfully!");
        setFormData({
          account_name: "",
          account_number: "",
          default_amount: "",
          fundtype: "General Fund",
        });
      } else {
        toast.error(result.error || "Failed to create Item Account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Item Account</CardTitle>
        <CardDescription>Add a new financial item account to the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="e.g. Mayor's Permit Fee"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="e.g. 123-456-789"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_amount">Default Amount (PHP)</Label>
              <Input
                id="default_amount"
                type="number"
                step="0.01"
                value={formData.default_amount}
                onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundtype">Fund Type</Label>
              <Select
                value={formData.fundtype}
                onValueChange={(value) => setFormData({ ...formData, fundtype: value })}
              >
                <SelectTrigger id="fundtype">
                  <SelectValue placeholder="Select Fund Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Fund">General Fund</SelectItem>
                  <SelectItem value="Trust Fund">Trust Fund</SelectItem>
                  <SelectItem value="Motorized Vehicle Fund">Motorized Vehicle Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
