"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export default function DriversPage() {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let documentUrl = "";
      
      // Handle file upload first if present
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error("File upload failed");
        
        const uploadData = await uploadRes.json();
        documentUrl = uploadData.url;
      }
      
      // Simulate API call to save driver
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast("Success", {
        description: "Driver registered successfully." + (documentUrl ? ` Document saved at ${documentUrl}` : "")
      });
      setShowForm(false);
      setFile(null);
    } catch (error) {
      toast("Error", {
        description: "An error occurred while saving.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Card>
          <CardHeader>
            <CardTitle>Register New Driver</CardTitle>
            <CardDescription>Enter the driver's details and upload necessary documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required placeholder="Juan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required placeholder="Dela Cruz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNo">License Number</Label>
                  <Input id="licenseNo" required placeholder="NXX-XX-XXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNo">Contact Number</Label>
                  <Input id="contactNo" required placeholder="09XX XXX XXXX" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required placeholder="123 Main St, Barangay, City" />
                </div>
                
                <div className="col-span-2 space-y-2 border-t pt-4 mt-2">
                  <Label>Upload Driver's License or Clearance</Label>
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                        >
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
                      {file && <p className="text-sm font-medium mt-2 text-primary">Selected: {file.name}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Driver"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground bg-card shadow-sm">
          No drivers registered yet. Click "Register New Driver" to add one.
        </div>
      )}
    </div>
  );
}
