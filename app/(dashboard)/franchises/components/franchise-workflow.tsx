"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationForm } from "./application-form";
import { FranchiseRenewal } from "./franchise-renewal";
import { FranchiseList } from "./franchise-list";
import type { Franchise } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function FranchiseWorkflow({ 
  initialFranchises, 
  unassignedBodyNumbers 
}: { 
  initialFranchises: Franchise[];
  unassignedBodyNumbers: any[];
}) {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFranchises = initialFranchises.filter((f) => {
    const query = searchQuery.toLowerCase();
    return (
      f.ownerName.toLowerCase().includes(query) ||
      f.franchiseNo.toLowerCase().includes(query)
    );
  });

  const pending = filteredFranchises.filter((f) => f.status === "PENDING");
  const forBilling = filteredFranchises.filter((f) => f.status === "FOR_BILLING");
  const forPayment = filteredFranchises.filter((f) => f.status === "FOR_PAYMENT");
  const forApproval = filteredFranchises.filter((f) => f.status === "FOR_SP_APPROVAL");
  const approved = filteredFranchises.filter((f) => f.status === "APPROVED");
  const published = filteredFranchises.filter((f) => f.status === "PUBLISHED" || f.status === "ACTIVE");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name or Franchise No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-8">
          <TabsTrigger value="new">New Application</TabsTrigger>
          <TabsTrigger value="renewal">Renewal</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="billing">Billing ({forBilling.length})</TabsTrigger>
          <TabsTrigger value="payment">Payment ({forPayment.length})</TabsTrigger>
          <TabsTrigger value="sp">SP Approval ({forApproval.length})</TabsTrigger>
          <TabsTrigger value="approved">Publication ({approved.length})</TabsTrigger>
          <TabsTrigger value="active">Certificates ({published.length})</TabsTrigger>
        </TabsList>
      
      <TabsContent value="new" className="mt-4">
        <ApplicationForm 
          unassignedBodyNumbers={unassignedBodyNumbers} 
          onSuccess={() => setActiveTab("pending")} 
        />
      </TabsContent>

      <TabsContent value="renewal" className="mt-4">
        <FranchiseRenewal onSuccess={() => setActiveTab("payment")} />
      </TabsContent>
      
      <TabsContent value="pending" className="mt-4">
        <FranchiseList franchises={pending} type="pending" />
      </TabsContent>

      <TabsContent value="billing" className="mt-4">
        <FranchiseList franchises={forBilling} type="billing" />
      </TabsContent>

      <TabsContent value="payment" className="mt-4">
        <FranchiseList franchises={forPayment} type="payment" />
      </TabsContent>
      
      <TabsContent value="sp" className="mt-4">
        <FranchiseList franchises={forApproval} type="sp" />
      </TabsContent>

      <TabsContent value="approved" className="mt-4">
        <FranchiseList franchises={approved} type="approved" />
      </TabsContent>

      <TabsContent value="active" className="mt-4">
        <FranchiseList franchises={published} type="active" />
      </TabsContent>
    </Tabs>
    </div>
  );
}
