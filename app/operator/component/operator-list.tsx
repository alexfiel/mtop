"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  User,
  Plus,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
} from "lucide-react";

interface OperatorItem {
  id: string;
  operatorId: string;
  name: string;
  address: string;
  email: string;
  mobileNo: string;
  dateOfBirth: Date | string;
  validIDType: string;
  validIDNumber: string;
  profilePicture: string | null;
  validIdFront: string | null;
  validIdBack: string | null;
  status: string;
  isVerified: boolean;
  createdAt: Date | string;
  newFranchise?: any;
  vehicle?: any;
}

interface OperatorListProps {
  operators: OperatorItem[];
  onAddNew: () => void;
}

export function OperatorList({ operators, onAddNew }: OperatorListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = operators.filter((op) => {
    const term = searchTerm.toLowerCase();
    return (
      op.name.toLowerCase().includes(term) ||
      op.operatorId.toLowerCase().includes(term) ||
      op.email.toLowerCase().includes(term) ||
      op.mobileNo.includes(term) ||
      op.validIDNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Showing {filtered.length} of {operators.length} operators
          </span>
          <Button onClick={onAddNew} size="sm" className="gap-2 bg-primary">
            <Plus className="h-4 w-4" />
            Register New Operator
          </Button>
        </div>
      </div>

      {/* Operators Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12">Photo</TableHead>
              <TableHead>Operator Details</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Valid ID Credential</TableHead>
              <TableHead>Franchise & Vehicle</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No operators found</p>
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search criteria."
                        : "Click 'Register New Operator' to enroll the first operator."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((op) => (
                <TableRow key={op.id} className="hover:bg-muted/30">
                  {/* Photo */}
                  <TableCell>
                    <div className="w-10 h-10 rounded-full overflow-hidden border bg-muted/40 flex items-center justify-center shrink-0">
                      {op.profilePicture ? (
                        <img
                          src={op.profilePicture}
                          alt={op.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>

                  {/* Operator Details */}
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground">{op.name}</div>
                    <div className="text-xs font-mono text-primary">{op.operatorId}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {op.address}
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {op.mobileNo}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {op.email}
                    </div>
                  </TableCell>

                  {/* Valid ID */}
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{op.validIDType}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      No: {op.validIDNumber}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {op.validIdFront ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                          ID Front ✓
                        </Badge>
                      ) : null}
                      {op.validIdBack ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                          ID Back ✓
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  {/* Franchise & Vehicle Link */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {op.newFranchise ? (
                        <span className="text-xs font-medium text-foreground flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Body #{op.newFranchise.franchiseBodyNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Franchise Yet</span>
                      )}

                      {op.vehicle ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Car className="h-3 w-3 text-primary" />
                          Plate: {op.vehicle.plateNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Vehicle Attached</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {op.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="h-3 w-3" /> {op.status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
