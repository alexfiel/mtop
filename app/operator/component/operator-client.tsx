"use client";

import { useState } from "react";
import { OperatorRegistration } from "./operator-registration";
import { OperatorList } from "./operator-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";

interface OperatorClientProps {
  initialOperators: any[];
}

export function OperatorClient({ initialOperators }: OperatorClientProps) {
  const [activeTab, setActiveTab] = useState<string>("register");
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
    setActiveTab("list");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Operator Management System
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            LGU Tagbilaran City Tricycle Operator Registry & Biometric Credential Enrollment
          </p>
        </div>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="grid grid-cols-2 w-72">
            <TabsTrigger value="register" className="gap-2 text-xs font-semibold">
              <UserPlus className="h-3.5 w-3.5" />
              Registration
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2 text-xs font-semibold">
              <Users className="h-3.5 w-3.5" />
              Directory ({initialOperators.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      {activeTab === "register" ? (
        <OperatorRegistration
          onSuccess={handleSuccess}
          onCancel={() => setActiveTab("list")}
        />
      ) : (
        <OperatorList
          operators={initialOperators}
          onAddNew={() => setActiveTab("register")}
        />
      )}
    </div>
  );
}
