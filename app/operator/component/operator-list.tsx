"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ExternalLink,
  Users,
  Star,
} from "lucide-react";
import { OperatorDetailModal } from "./operator-detail-modal";
import { UnitDriversModal } from "@/app/driver/component/unit-drivers-modal";

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
  drivers?: any[];
  [key: string]: any;
}

interface OperatorListProps {
  operators: OperatorItem[];
  onAddNew: () => void;
}

export function OperatorList({ operators, onAddNew }: OperatorListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<OperatorItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [manageDriversOperator, setManageDriversOperator] = useState<OperatorItem | null>(null);

  const currentSelectedOperator =
    operators.find((op) => op.id === selectedOperator?.id) || selectedOperator;

  const currentManageDriversOperator =
    operators.find((op) => op.id === manageDriversOperator?.id) || manageDriversOperator;

  const handleViewDetails = (op: OperatorItem) => {
    setSelectedOperator(op);
    setDetailModalOpen(true);
  };

  const filtered = operators.filter((op) => {
    const term = searchTerm.toLowerCase();
    return (
      op.name.toLowerCase().includes(term) ||
      op.operatorId.toLowerCase().includes(term) ||
      op.email.toLowerCase().includes(term) ||
      op.mobileNo.includes(term) ||
      op.validIDNumber.toLowerCase().includes(term) ||
      (op.drivers && op.drivers.some((d: any) => `${d.firstName} ${d.lastName}`.toLowerCase().includes(term)))
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
              <TableHead>Assigned Drivers (Max 2)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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
              filtered.map((op) => {
                const attachedVehicle = op.vehicle || op.newFranchise?.mtopVehicle;
                const primaryDriver = op.drivers?.find((d: any) => d.driverRole === "PRIMARY");
                const secondaryDriver = op.drivers?.find((d: any) => d.driverRole === "SECONDARY");

                return (
                  <TableRow key={op.id} className="hover:bg-muted/30">
                    {/* Photo */}
                    <TableCell>
                      <div
                        onClick={() => handleViewDetails(op)}
                        className="w-10 h-10 rounded-full overflow-hidden border bg-muted/40 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                        title="Click to view details"
                      >
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

                    {/* Operator Details (Clickable Name Link) */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(op)}
                        className="font-semibold text-sm text-foreground hover:text-primary hover:underline transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
                        title="Click to view full operator profile, vehicle & franchise details"
                      >
                        <span>{op.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </button>
                      <div className="text-xs font-mono text-primary mt-0.5">{op.operatorId}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
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
                          <button
                            type="button"
                            onClick={() => handleViewDetails(op)}
                            className="text-xs font-medium text-foreground hover:text-primary flex items-center gap-1 text-left cursor-pointer group"
                          >
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            <span>Body #{op.newFranchise.franchiseBodyNumber}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No Franchise Yet</span>
                        )}

                        {attachedVehicle ? (
                          <button
                            type="button"
                            onClick={() => handleViewDetails(op)}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 text-left cursor-pointer group"
                          >
                            <Car className="h-3 w-3 text-primary" />
                            <span>Plate: {attachedVehicle.plateNumber}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No Vehicle Attached</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Assigned Drivers (Primary & Secondary) */}
                    <TableCell>
                      <div className="space-y-1">
                        {primaryDriver || secondaryDriver ? (
                          <div className="flex flex-col gap-1">
                            {primaryDriver && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold gap-1 w-fit"
                              >
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                {primaryDriver.firstName} {primaryDriver.lastName}
                              </Badge>
                            )}
                            {secondaryDriver && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold gap-1 w-fit"
                              >
                                <ShieldCheck className="h-2.5 w-2.5 text-blue-500" />
                                {secondaryDriver.firstName} {secondaryDriver.lastName}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None (0/2)</span>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setManageDriversOperator(op)}
                          className="text-[11px] h-6 px-1.5 text-primary hover:text-primary hover:bg-primary/10 gap-1 mt-0.5"
                        >
                          <Users className="h-3 w-3" />
                          Manage Drivers
                        </Button>
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

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(op)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                        title="View complete profile"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* OPERATOR DETAILS PROFILE MODAL */}
      <OperatorDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        operator={currentSelectedOperator}
        onRefresh={() => router.refresh()}
      />

      {/* MANAGE OPERATOR DRIVERS MODAL */}
      <UnitDriversModal
        isOpen={Boolean(currentManageDriversOperator)}
        onClose={() => setManageDriversOperator(null)}
        targetType="operator"
        targetId={currentManageDriversOperator?.id || ""}
        targetTitle={`Operator: ${currentManageDriversOperator?.name}`}
        targetSubtext={`Operator ID: ${currentManageDriversOperator?.operatorId} • ${currentManageDriversOperator?.mobileNo}`}
        drivers={currentManageDriversOperator?.drivers || []}
        onSuccess={() => {
          setManageDriversOperator(null);
          router.refresh();
        }}
      />
    </div>
  );
}
