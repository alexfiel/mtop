"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createBodyNumber, deleteBodyNumber, generateBodyNumberRange } from "../actions";

export function BodyNumberManager({ initialBodyNumbers }: { initialBodyNumbers: any[] }) {
  const [newBodyNumber, setNewBodyNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleAdd() {
    const num = parseInt(newBodyNumber, 10);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }

    setIsSubmitting(true);
    const result = await createBodyNumber(num);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Body number added successfully.");
      setNewBodyNumber("");
    }
  }

  async function handleGenerateRange() {
    const start = parseInt(rangeStart, 10);
    const end = parseInt(rangeEnd, 10);

    if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
      toast.error("Please enter valid positive numbers for the range.");
      return;
    }
    if (start > end) {
      toast.error("Start number must be less than or equal to end number.");
      return;
    }

    setIsGenerating(true);
    const result = await generateBodyNumberRange(start, end);
    setIsGenerating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Successfully generated ${result.count} body numbers.`);
      setRangeStart("");
      setRangeEnd("");
    }
  }

  async function handleDelete(num: number) {
    if (!confirm(`Are you sure you want to delete body number ${num}?`)) return;

    const result = await deleteBodyNumber(num);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Body number deleted successfully.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Single Body Number</CardTitle>
            <CardDescription>Register a new body number manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                placeholder="e.g. 101" 
                value={newBodyNumber}
                onChange={(e) => setNewBodyNumber(e.target.value)}
              />
              <Button onClick={handleAdd} disabled={isSubmitting || !newBodyNumber}>
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Range</CardTitle>
            <CardDescription>Generate a bulk range of body numbers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Input 
                  type="number" 
                  placeholder="Start (e.g. 1)" 
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                />
                <span className="text-muted-foreground">to</span>
                <Input 
                  type="number" 
                  placeholder="End (e.g. 3000)" 
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerateRange} disabled={isGenerating || !rangeStart || !rangeEnd} className="w-full">
                {isGenerating ? "Generating..." : "Generate Range"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Body Numbers</CardTitle>
          <CardDescription>List of all body numbers and their assignment status.</CardDescription>
        </CardHeader>
        <CardContent>
          {initialBodyNumbers.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No body numbers registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Body Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Franchise</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialBodyNumbers.map((bn) => (
                  <TableRow key={bn.bodyNumber}>
                    <TableCell className="font-medium text-lg">{bn.bodyNumber}</TableCell>
                    <TableCell>
                      {bn.franchiseId ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Assigned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {bn.franchiseId ? (
                        <span className="text-sm font-medium">{bn.franchise.franchiseNo} ({bn.franchise.ownerName})</span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(bn.bodyNumber)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
