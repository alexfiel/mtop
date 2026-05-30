"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TricycleRegistration } from "./tricycle-registration";
import { TricycleList } from "./tricycles-list";
import { AssignDriver } from "./assign-driver";
import { Driver } from "@prisma/client";

export function TricyclesWorkflow({ 
  initialTricycles,
  activeDrivers 
}: { 
  initialTricycles: any[];
  activeDrivers: Driver[];
}) {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-[600px] grid-cols-3 mb-8">
        <TabsTrigger value="list">Registered Tricycles</TabsTrigger>
        <TabsTrigger value="register">Register New</TabsTrigger>
        <TabsTrigger value="assign">Assign Drivers</TabsTrigger>
      </TabsList>
      
      <TabsContent value="list" className="mt-4">
        <TricycleList tricycles={initialTricycles} />
      </TabsContent>
      
      <TabsContent value="register" className="mt-4">
        <TricycleRegistration onSuccess={() => setActiveTab("assign")} />
      </TabsContent>

      <TabsContent value="assign" className="mt-4">
        <AssignDriver 
          tricycles={initialTricycles} 
          drivers={activeDrivers} 
          onSuccess={() => setActiveTab("list")}
        />
      </TabsContent>
    </Tabs>
  );
}
