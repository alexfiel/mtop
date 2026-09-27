"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Building2, Users, Globe, Shield, Search } from "lucide-react";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { DomainDialog, DomainItem } from "./domain-dialog";
import { deleteDomain } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DomainListProps {
  domains: DomainItem[];
}

export function DomainList({ domains }: DomainListProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<DomainItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setSelectedDomain(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (domain: DomainItem) => {
    setSelectedDomain(domain);
    setIsDialogOpen(true);
  };

  const handleDeletePrompt = (domain: DomainItem) => {
    setDomainToDelete(domain);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!domainToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteDomain(domainToDelete.id);
      if (res.success) {
        toast.success(`Domain '${domainToDelete.code}' deleted.`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete domain.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete domain.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDomainToDelete(null);
    }
  };

  const filteredDomains = domains.filter(
    (d) =>
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.allowedEmailDomain && d.allowedEmailDomain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const protectedCodes = ["BPLO", "TRAFFIC", "SP", "TREASURY"];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Municipal Domains & Offices</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Define organizational domains, workflow engine department barriers, and authorized email domains.
          </p>
        </div>
        <Button onClick={handleCreate} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add New Domain
        </Button>
      </div>

      {/* Search and summary metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex w-full sm:w-96 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
            placeholder="Search domains by code, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Shield className="h-3.5 w-3.5" />
            {domains.filter((d) => d.type === "WORKFLOW").length} Workflow Engines
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Building2 className="h-3.5 w-3.5" />
            {domains.filter((d) => d.type === "DEPARTMENT").length} Departments
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold text-foreground">Domain Code</TableHead>
              <TableHead className="font-semibold text-foreground">Name & Description</TableHead>
              <TableHead className="font-semibold text-foreground">Type</TableHead>
              <TableHead className="font-semibold text-foreground">Email Domain</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Assigned Users</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Building2 className="w-12 h-12 text-muted-foreground/40" />
                    <span className="text-lg font-medium">No domains found</span>
                    <span className="text-sm">Click "Add New Domain" to register a municipal office.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDomains.map((domain) => {
                const isProtected = protectedCodes.includes(domain.code);
                const userCount = domain._count?.users || 0;

                return (
                  <TableRow key={domain.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-bold tracking-wider px-2.5 py-1 bg-primary/10 border-primary/20 text-primary"
                        >
                          {domain.code}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{domain.name}</div>
                        {domain.description && (
                          <div className="text-xs text-muted-foreground max-w-md line-clamp-2">
                            {domain.description}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {domain.type === "WORKFLOW" ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        >
                          Workflow
                        </Badge>
                      ) : domain.type === "DEPARTMENT" ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          Department
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                        >
                          Office
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {domain.allowedEmailDomain ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          @{domain.allowedEmailDomain}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Any</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        <Users className="h-3 w-3" />
                        {userCount}
                      </span>
                    </TableCell>

                    <TableCell>
                      {domain.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </TableCell>

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
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                            Domain Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(domain)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit Domain
                          </DropdownMenuItem>
                          {!isProtected ? (
                            <DropdownMenuItem
                              onClick={() => handleDeletePrompt(domain)}
                              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Domain
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                              <Shield className="mr-2 h-3.5 w-3.5" /> Core Workflow
                            </DropdownMenuItem>
                          )}
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

      {/* Edit/Create Dialog */}
      <DomainDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        domain={selectedDomain}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain '{domainToDelete?.code}'?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the domain <strong>{domainToDelete?.name}</strong>?
              Any users assigned to this domain will have their domain unlinked, but their accounts will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Domain"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
