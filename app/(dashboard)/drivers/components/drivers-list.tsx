"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Driver, Tricycle, Document } from "@prisma/client";

type DriverWithTricycles = Driver & {
  mainTricycles?: Tricycle[];
  extraTricycles?: Tricycle[];
  documents?: Document[];
};

export function DriversList({ drivers }: { drivers: DriverWithTricycles[] }) {
  const router = useRouter();

  if (drivers.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center text-muted-foreground bg-card shadow-sm">
        No drivers registered yet. Click "Register New Driver" to add one.
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver Name</TableHead>
            <TableHead>License No.</TableHead>
            <TableHead>Contact No.</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Pictures</TableHead>
            <TableHead>Assigned Tricycle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">
                {driver.lastName}, {driver.firstName} {driver.middleName ? `${driver.middleName.charAt(0)}.` : ""}
              </TableCell>
              <TableCell>{driver.licenseNo}</TableCell>
              <TableCell>{driver.contactNo}</TableCell>
              <TableCell>{driver.email}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {driver.profilePicture && (
                    <a href={driver.profilePicture} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" /> Profile Pic
                    </a>
                  )}
                  {driver.documents?.find(d => d.documentType === "DRIVERS_LICENSE")?.fileUrl && (
                    <a href={driver.documents.find(d => d.documentType === "DRIVERS_LICENSE")!.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                      <CreditCard className="w-3 h-3 mr-1" /> License
                    </a>
                  )}
                  {!driver.profilePicture && !driver.documents?.find(d => d.documentType === "DRIVERS_LICENSE") && (
                    <span className="text-xs italic text-muted-foreground">None</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {driver.mainTricycles && driver.mainTricycles.length > 0 && (
                    <span className="text-sm">
                      <span className="font-semibold">Main:</span> {driver.mainTricycles.map(t => t.bodyNumber).join(", ")}
                    </span>
                  )}
                  {driver.extraTricycles && driver.extraTricycles.length > 0 && (
                    <span className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">Extra:</span> {driver.extraTricycles.map(t => t.bodyNumber).join(", ")}
                    </span>
                  )}
                  {(!driver.mainTricycles || driver.mainTricycles.length === 0) && (!driver.extraTricycles || driver.extraTricycles.length === 0) && (
                    <span className="text-muted-foreground italic text-sm">Unassigned</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={driver.status === "ACTIVE" ? "default" : "secondary"}>
                  {driver.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/drivers/${driver.id}/certificate`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Certificate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
