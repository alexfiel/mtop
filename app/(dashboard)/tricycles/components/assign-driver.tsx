"use client";

import { useState } from "react";
import { Driver } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { assignDriversToTricycle } from "../actions";
import { toast } from "sonner";
import { AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function AssignDriver({ 
  tricycles, 
  drivers, 
  onSuccess 
}: { 
  tricycles: any[];
  drivers: Driver[];
  onSuccess: () => void;
}) {
  const [selectedTricycle, setSelectedTricycle] = useState("");
  const [mainDriver, setMainDriver] = useState("");
  const [extraDriver, setExtraDriver] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openTricycle, setOpenTricycle] = useState(false);
  const [openMain, setOpenMain] = useState(false);
  const [openExtra, setOpenExtra] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTricycle) {
      setError("Please select a tricycle.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await assignDriversToTricycle(
        selectedTricycle, 
        mainDriver === "none" || !mainDriver ? null : mainDriver, 
        extraDriver === "none" || !extraDriver ? null : extraDriver
      );

      if (result?.error) {
        setError(result.error);
        return;
      }

      toast.success("Drivers successfully assigned!");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to assign drivers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Drivers to Tricycle</CardTitle>
        <CardDescription>Select a registered tricycle and assign a main and/or extra driver.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <Label>Registered Tricycle</Label>
              <Popover open={openTricycle} onOpenChange={setOpenTricycle}>
                <PopoverTrigger 
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openTricycle}
                      className="w-full justify-between"
                    />
                  }
                >
                  {selectedTricycle
                    ? (() => {
                        const t = tricycles.find((tr) => tr.id === selectedTricycle);
                        return t ? `${t.bodyNumber} - ${t.franchise?.ownerName || "Unknown Owner"} (${t.plateNo})` : "Select a tricycle...";
                      })()
                    : "Select a tricycle..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search owner or body no..." />
                    <CommandList>
                      <CommandEmpty>No tricycle found.</CommandEmpty>
                      <CommandGroup>
                        {tricycles.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={`${t.bodyNumber} ${t.franchise?.ownerName || ""} ${t.plateNo}`}
                            onSelect={() => {
                              setSelectedTricycle(t.id === selectedTricycle ? "" : t.id);
                              setOpenTricycle(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedTricycle === t.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {t.bodyNumber} - {t.franchise?.ownerName || "Unknown Owner"} ({t.plateNo})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label>Main Driver (Optional)</Label>
                <Popover open={openMain} onOpenChange={setOpenMain}>
                  <PopoverTrigger 
                    render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMain}
                        className="w-full justify-between"
                      />
                    }
                  >
                    {mainDriver && mainDriver !== "none"
                      ? (() => {
                          const d = drivers.find((dr) => dr.id === mainDriver);
                          return d ? `${d.lastName}, ${d.firstName}` : "Select Main Driver";
                        })()
                      : "Select Main Driver"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search driver name or license..." />
                      <CommandList>
                        <CommandEmpty>No driver found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setMainDriver("none");
                              setOpenMain(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                mainDriver === "none" || !mainDriver ? "opacity-100" : "opacity-0"
                              )}
                            />
                            None
                          </CommandItem>
                          {drivers.map((d) => (
                            <CommandItem
                              key={d.id}
                              value={`${d.lastName} ${d.firstName} ${d.licenseNo}`}
                              onSelect={() => {
                                setMainDriver(d.id === mainDriver ? "" : d.id);
                                setOpenMain(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  mainDriver === d.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {d.lastName}, {d.firstName} ({d.licenseNo})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Extra Driver (Optional)</Label>
                <Popover open={openExtra} onOpenChange={setOpenExtra}>
                  <PopoverTrigger 
                    render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openExtra}
                        className="w-full justify-between"
                      />
                    }
                  >
                    {extraDriver && extraDriver !== "none"
                      ? (() => {
                          const d = drivers.find((dr) => dr.id === extraDriver);
                          return d ? `${d.lastName}, ${d.firstName}` : "Select Extra Driver";
                        })()
                      : "Select Extra Driver"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search driver name or license..." />
                      <CommandList>
                        <CommandEmpty>No driver found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setExtraDriver("none");
                              setOpenExtra(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                extraDriver === "none" || !extraDriver ? "opacity-100" : "opacity-0"
                              )}
                            />
                            None
                          </CommandItem>
                          {drivers.map((d) => (
                            <CommandItem
                              key={d.id}
                              value={`${d.lastName} ${d.firstName} ${d.licenseNo}`}
                              onSelect={() => {
                                setExtraDriver(d.id === extraDriver ? "" : d.id);
                                setOpenExtra(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  extraDriver === d.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {d.lastName}, {d.firstName} ({d.licenseNo})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
