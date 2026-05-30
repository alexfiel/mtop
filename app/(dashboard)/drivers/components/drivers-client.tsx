"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DriverRegistration } from "./driver-registration";
import { DriversList } from "./drivers-list";
import { Driver, Tricycle, Document } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type DriverWithTricycles = Driver & {
  mainTricycles?: Tricycle[];
  extraTricycles?: Tricycle[];
  documents?: Document[];
};

export function DriversClient({ initialDrivers }: { initialDrivers: DriverWithTricycles[] }) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDrivers = initialDrivers.filter(driver => {
    const search = searchQuery.toLowerCase();
    const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
    return fullName.includes(search) || 
           driver.licenseNo.toLowerCase().includes(search) ||
           driver.contactNo.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drivers & Operators</h2>
          <p className="text-muted-foreground mt-2">
            Manage registered drivers and operators.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Register New Driver
          </Button>
        )}
      </div>
      
      {showForm ? (
        <DriverRegistration 
          onSuccess={() => setShowForm(false)} 
          onCancel={() => setShowForm(false)} 
        />
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, license or contact..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DriversList drivers={filteredDrivers} />
        </div>
      )}
    </div>
  );
}
