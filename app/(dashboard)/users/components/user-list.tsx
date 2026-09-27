"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Building2,
  Shield,
  User,
  Phone,
  Briefcase,
  Eye,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserForm } from "./user-form";
import { DomainItem } from "./domain-dialog";
import { deleteUser, toggleUserAccess } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type RoleType = { id: string; name: string };

export type UserType = {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
  disabledAt?: Date | string | null;
  disabledReason?: string | null;
  roles: { role: RoleType }[];
  profile?: {
    id: string;
    domainId: string | null;
    office: string | null;
    department: string | null;
    jobTitle: string | null;
    contactNo: string | null;
    domain?: DomainItem | null;
  } | null;
  createdAt: Date | string;
};

type UserListProps = {
  users: UserType[];
  roles: RoleType[];
  domains: DomainItem[];
};

export function UserList({ users, roles, domains }: UserListProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | undefined>();

  // Toggle user access dialog state
  const [isToggleAccessOpen, setIsToggleAccessOpen] = useState(false);
  const [toggleUserTarget, setToggleUserTarget] = useState<UserType | undefined>();
  const [disableReason, setDisableReason] = useState("");
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handleView = (user: UserType) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleEdit = (user: UserType) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handlePromptToggleAccess = (user: UserType) => {
    setToggleUserTarget(user);
    setDisableReason("");
    setIsToggleAccessOpen(true);
  };

  const confirmToggleAccess = async () => {
    if (!toggleUserTarget) return;
    setIsSubmittingAccess(true);
    const willDisable = toggleUserTarget.isActive !== false;

    try {
      const res = await toggleUserAccess(toggleUserTarget.id, willDisable, disableReason);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update user access.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update user access.");
    } finally {
      setIsSubmittingAccess(false);
      setIsToggleAccessOpen(false);
      setToggleUserTarget(undefined);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await deleteUser(selectedUser.id);
      if (res.success) {
        toast.success("User deleted successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(undefined);
    }
  };

  const filteredUsers = users.filter((user) => {
    // Search match
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile?.jobTitle && user.profile.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.profile?.office && user.profile.office.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Domain match
    if (domainFilter !== "ALL") {
      if (domainFilter === "UNASSIGNED") {
        if (user.profile?.domainId || user.profile?.office) return false;
      } else {
        const matchesDomain =
          user.profile?.domainId === domainFilter ||
          user.profile?.domain?.code === domainFilter ||
          user.profile?.office === domainFilter;
        if (!matchesDomain) return false;
      }
    }

    // Status match
    if (statusFilter === "ACTIVE") {
      return user.isActive !== false;
    }
    if (statusFilter === "DISABLED") {
      return user.isActive === false;
    }

    return true;
  });

  const getDomainBadge = (user: UserType) => {
    const code = user.profile?.domain?.code || user.profile?.office;
    const name = user.profile?.domain?.name || user.profile?.department;

    if (!code) {
      return (
        <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
      );
    }

    const domainStyles: Record<string, string> = {
      BPLO: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      TRAFFIC: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      SP: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
      TREASURY: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      EXECUTIVE: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
      LEGAL: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
    };

    const style = domainStyles[code] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300";

    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`font-mono text-xs font-semibold px-2 py-0.2 shadow-sm ${style}`}>
            {code}
          </Badge>
          {user.profile?.jobTitle && (
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {user.profile.jobTitle}
            </span>
          )}
        </div>
        {name && name !== code && (
          <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
            {name}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Users & Officers</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage administrative access, municipal departmental domains, and active user credentials.
          </p>
        </div>
        <Button onClick={() => { setSelectedUser(undefined); setIsFormOpen(true); }} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex w-full md:w-96 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input 
            type="text" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10" 
            placeholder="Search by name, email, job title, or domain..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active Only</SelectItem>
              <SelectItem value="DISABLED">Disabled Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Domain Filter */}
          <Select value={domainFilter} onValueChange={(val) => setDomainFilter(val || "ALL")}>
            <SelectTrigger className="w-[180px] h-10">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Domains</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {domains.map((dom) => (
                <SelectItem key={dom.id} value={dom.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{dom.code}</span>
                    <span className="text-muted-foreground text-xs">({dom.name})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold text-foreground">User / Name</TableHead>
              <TableHead className="font-semibold text-foreground">Domain / Department</TableHead>
              <TableHead className="font-semibold text-foreground">System Roles</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <User className="w-12 h-12 text-muted-foreground/40" />
                    <span className="text-lg font-medium">No users found</span>
                    <span className="text-sm">Try adjusting your search query or status filter</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isSuperAdmin = user.roles.some((r) => r.role.name === "SUPERADMIN");
                const isActive = user.isActive !== false;

                return (
                  <TableRow
                    key={user.id}
                    className={`transition-colors ${
                      !isActive ? "bg-muted/30 opacity-75 hover:opacity-100" : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Name and Email */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          {user.name}
                          {!isActive && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                              Access Revoked
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>

                    {/* Domain / Department */}
                    <TableCell>
                      {getDomainBadge(user)}
                    </TableCell>

                    {/* Roles */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((r) => {
                          const isSA = r.role.name === 'SUPERADMIN';
                          const isAdm = r.role.name === 'ADMIN';
                          const isSup = r.role.name === 'SUPERVISOR';
                          
                          return (
                            <Badge 
                              key={r.role.id} 
                              variant="outline" 
                              className={`
                                ${isSA ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : ''}
                                ${isAdm ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : ''}
                                ${isSup ? 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' : ''}
                                ${!isSA && !isAdm && !isSup ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700' : ''}
                                font-medium px-2 py-0.5 shadow-sm text-xs
                              `}
                            >
                              {r.role.name}
                            </Badge>
                          );
                        })}
                        {user.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground/60 italic">No roles</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Disabled
                          </span>
                          {user.disabledReason && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={user.disabledReason}>
                              {user.disabledReason}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Created At */}
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), "PP")}
                    </TableCell>

                    {/* Actions Dropdown */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-semibold text-xs uppercase text-muted-foreground">
                              User Controls
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleView(user)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(user)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          {/* Superadmin Disable / Enable Action */}
                          {!isSuperAdmin ? (
                            isActive ? (
                              <DropdownMenuItem
                                onClick={() => handlePromptToggleAccess(user)}
                                className="text-amber-700 dark:text-amber-400 focus:text-amber-700 cursor-pointer"
                              >
                                <Ban className="mr-2 h-4 w-4" /> Disable Access
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handlePromptToggleAccess(user)}
                                className="text-emerald-700 dark:text-emerald-400 focus:text-emerald-700 cursor-pointer"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Restore Access
                              </DropdownMenuItem>
                            )
                          ) : (
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                              <Shield className="mr-2 h-3.5 w-3.5" /> Superadmin Protected
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Disable / Enable User Access Dialog */}
      <AlertDialog open={isToggleAccessOpen} onOpenChange={setIsToggleAccessOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {toggleUserTarget?.isActive !== false ? (
                <>
                  <Ban className="h-5 w-5 text-destructive" />
                  <span>Disable System Access?</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Restore System Access?</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-foreground">
              {toggleUserTarget?.isActive !== false ? (
                <>
                  <p>
                    Are you sure you want to disable access for <strong>{toggleUserTarget?.name}</strong> ({toggleUserTarget?.email})?
                  </p>
                  <p className="text-xs text-muted-foreground bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 text-destructive dark:text-destructive-foreground">
                    <strong>Notice:</strong> This will immediately invalidate and terminate all active sessions for this user. They will be prevented from logging in until re-enabled by a Super Admin.
                  </p>
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="disableReason" className="text-xs font-semibold text-muted-foreground">
                      Reason for Revoking Access (Optional)
                    </Label>
                    <Input
                      id="disableReason"
                      placeholder="e.g. Contract terminated, Officer on leave, Reassignment"
                      value={disableReason}
                      onChange={(e) => setDisableReason(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <p>
                  Restore system access for <strong>{toggleUserTarget?.name}</strong> ({toggleUserTarget?.email})?
                  The user will be able to log in with their existing credentials immediately.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel disabled={isSubmittingAccess}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAccess}
              disabled={isSubmittingAccess}
              className={
                toggleUserTarget?.isActive !== false
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }
            >
              {isSubmittingAccess
                ? "Processing..."
                : toggleUserTarget?.isActive !== false
                ? "Disable Access"
                : "Restore Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Profile & Domain Access
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{selectedUser.name}</span>
                  {selectedUser.isActive !== false ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active Access
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Access Revoked</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.isActive === false && selectedUser.disabledReason && (
                  <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900">
                    <strong>Revocation Reason:</strong> {selectedUser.disabledReason}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Domain / Office
                  </div>
                  <div className="font-semibold text-foreground">
                    {selectedUser.profile?.domain?.code || selectedUser.profile?.office || "Unassigned"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedUser.profile?.domain?.name || selectedUser.profile?.department || "No department specified"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> Job Title
                  </div>
                  <div className="font-semibold text-foreground">
                    {selectedUser.profile?.jobTitle || "Officer"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedUser.profile?.contactNo || "No contact"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Assigned Roles
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.map((r) => (
                    <Badge key={r.role.id} variant="secondary">
                      {r.role.name}
                    </Badge>
                  ))}
                  {selectedUser.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Account registered on {format(new Date(selectedUser.createdAt), "PPP")}
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User Account" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <UserForm 
            user={selectedUser as any} 
            roles={roles}
            domains={domains}
            onSuccess={() => {
              setIsFormOpen(false);
              router.refresh();
            }} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete User Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
              and remove their access from the MTOP system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
