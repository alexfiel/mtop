"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function TricycleList({ tricycles }: { tricycles: any[] }) {
  if (tricycles.length === 0) {
    return <div className="p-8 text-center text-muted-foreground border rounded-md">No tricycles registered yet.</div>;
  }

  return (
    <div className="border rounded-md bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Body No.</TableHead>
            <TableHead>Plate No.</TableHead>
            <TableHead>Make & Model</TableHead>
            <TableHead>Franchise No.</TableHead>
            <TableHead>Main Driver</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tricycles.map((tricycle) => (
            <TableRow key={tricycle.id}>
              <TableCell className="font-medium">{tricycle.bodyNumber}</TableCell>
              <TableCell>{tricycle.plateNo}</TableCell>
              <TableCell>{tricycle.make} {tricycle.model} ({tricycle.color})</TableCell>
              <TableCell>{tricycle.franchise?.franchiseNo || "N/A"}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {tricycle.mainDriver ? (
                    <span>Main: {tricycle.mainDriver.lastName}, {tricycle.mainDriver.firstName}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No Main Driver</span>
                  )}
                  {tricycle.extraDriver && (
                    <span className="text-sm text-slate-500">Extra: {tricycle.extraDriver.lastName}, {tricycle.extraDriver.firstName}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={tricycle.status === "ACTIVE" ? "default" : "secondary"}>
                  {tricycle.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
