"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createUser, updateUser, updateUserPassword } from "../actions";
import { Plus, Building2, Key, Shield } from "lucide-react";
import { toast } from "sonner";
import { DomainDialog, DomainItem } from "./domain-dialog";

type RoleType = { id: string; name: string };

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
  domainId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  contactNo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormProps = {
  user?: {
    id: string;
    name: string;
    email: string;
    isActive?: boolean;
    roles: { role: RoleType }[];
    profile?: {
      domainId?: string | null;
      office?: string | null;
      department?: string | null;
      jobTitle?: string | null;
      contactNo?: string | null;
      domain?: { id: string; code: string; name: string } | null;
    } | null;
  };
  roles: RoleType[];
  domains?: DomainItem[];
  onSuccess: () => void;
  onCancel: () => void;
};

type UserFormValues = z.infer<typeof createUserSchema>;

export function UserForm({ user, roles, domains = [], onSuccess, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordChange, setIsPasswordChange] = useState(false);
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  
  const [localRoles, setLocalRoles] = useState<RoleType[]>(roles);
  const [localDomains, setLocalDomains] = useState<DomainItem[]>(domains);
  const [newRole, setNewRole] = useState("");

  const handleAddCustomRole = () => {
    if (!newRole.trim()) return;
    const roleName = newRole.trim().toUpperCase();
    
    if (!localRoles.some(r => r.name === roleName)) {
      setLocalRoles([...localRoles, { id: roleName, name: roleName }]);
    }
    
    const currentRoles = form.getValues("roles") || [];
    if (!currentRoles.includes(roleName)) {
      form.setValue("roles", [...currentRoles, roleName], { shouldValidate: true });
    }
    setNewRole("");
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(user ? (isPasswordChange ? updatePasswordSchema : userSchema) : createUserSchema) as any,
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          roles: user.roles.map((r) => r.role.id),
          domainId: user.profile?.domainId || user.profile?.domain?.id || "",
          jobTitle: user.profile?.jobTitle || "",
          contactNo: user.profile?.contactNo || "",
          isActive: user.isActive !== false,
          password: "",
        }
      : {
          name: "",
          email: "",
          roles: [],
          domainId: "",
          jobTitle: "",
          contactNo: "",
          isActive: true,
          password: "",
        },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    try {
      if (user) {
        if (isPasswordChange) {
          const res = await updateUserPassword(user.id, values.password);
          if (res.success) {
            toast.success("Password updated successfully");
            onSuccess();
          } else {
            toast.error(res.error || "Failed to update password");
          }
        } else {
          const res = await updateUser(user.id, {
            name: values.name,
            email: values.email,
            roles: values.roles,
            domainId: values.domainId || null,
            jobTitle: values.jobTitle || null,
            contactNo: values.contactNo || null,
            isActive: values.isActive,
          });
          if (res.success) {
            toast.success("User updated successfully");
            onSuccess();
          } else {
            toast.error(res.error || "Failed to update user");
          }
        }
      } else {
        const res = await createUser({
          name: values.name,
          email: values.email,
          roles: values.roles,
          password: values.password,
          domainId: values.domainId || null,
          jobTitle: values.jobTitle || null,
          contactNo: values.contactNo || null,
          isActive: values.isActive,
        });
        if (res.success) {
          toast.success("User created successfully");
          onSuccess();
        } else {
          toast.error(res.error || "Failed to create user");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const rolesValue = watch("roles") || [];
  const domainValue = watch("domainId") || "";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {user && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordChange(!isPasswordChange)}
            >
              <Key className="mr-1.5 h-3.5 w-3.5" />
              {isPasswordChange ? "Edit Details" : "Change Password"}
            </Button>
          </div>
        )}

        {(!user || !isPasswordChange) && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="e.g. Maria Santos" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" placeholder="maria.santos@tagbilaran.gov.ph" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Domain & Department Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="domainId" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>Workflow Domain / Department</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDomainDialogOpen(true)}
                  className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Domain
                </Button>
              </div>

              <Select
                value={domainValue || "NONE"}
                onValueChange={(val) => {
                  setValue("domainId", val === "NONE" ? "" : val, { shouldValidate: true });
                }}
              >
                <SelectTrigger id="domainId" className="w-full">
                  <SelectValue placeholder="Select Domain / Office..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-muted-foreground italic">None / Unassigned</span>
                  </SelectItem>
                  {localDomains.map((dom) => (
                    <SelectItem key={dom.id} value={dom.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-muted border">
                          {dom.code}
                        </span>
                        <span>{dom.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Determines the officer's workflow barrier domain (e.g. BPLO, TRAFFIC, SP, TREASURY).
              </p>
            </div>

            {/* Job Title & Contact Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Job Title / Designation</Label>
                <Input id="jobTitle" placeholder="e.g. Licensing Officer II" {...register("jobTitle")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input id="contactNo" placeholder="e.g. 0912 345 6789" {...register("contactNo")} />
              </div>
            </div>

            {/* Roles Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>System Roles <span className="text-destructive">*</span></span>
              </Label>
              
              <DropdownMenu>
                <DropdownMenuTrigger 
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal text-left h-auto min-h-[2.5rem] py-2">
                      <span className="truncate">
                        {rolesValue.length === 0 
                          ? "Select roles..." 
                          : localRoles
                              .filter(r => rolesValue.includes(r.id))
                              .map(r => r.name)
                              .join(", ")}
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-[375px] max-h-[300px] overflow-y-auto">
                  {localRoles.map((role) => (
                    <DropdownMenuCheckboxItem
                      key={role.id}
                      checked={rolesValue.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue("roles", [...rolesValue, role.id], { shouldValidate: true });
                        } else {
                          setValue("roles", rolesValue.filter((id: string) => id !== role.id), { shouldValidate: true });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{role.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex gap-2 items-center mt-1">
                <Input 
                  placeholder="Custom role name..." 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRole();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button type="button" size="sm" onClick={handleAddCustomRole} variant="secondary" className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {errors.roles && <p className="text-xs text-destructive">{errors.roles.message}</p>}
            </div>

            {/* Active System Access Toggle */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="userIsActive"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...register("isActive")}
              />
              <Label htmlFor="userIsActive" className="text-xs font-medium cursor-pointer">
                Account Access Active (uncheck to disable access and prevent sign in)
              </Label>
            </div>
          </>
        )}

        {(!user || isPasswordChange) && (
          <div className="space-y-1.5">
            <Label htmlFor="password">{user ? "New Password" : "Password"} <span className="text-destructive">*</span></Label>
            <Input id="password" type="password" placeholder="At least 6 characters..." {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>

      {/* Quick Add Domain Dialog */}
      <DomainDialog
        open={isDomainDialogOpen}
        onOpenChange={setIsDomainDialogOpen}
        onSuccess={() => {
          // Refresh domains locally
          import("../actions").then(mod => {
            mod.getDomains().then(res => {
              if (res.success && res.domains) {
                setLocalDomains(res.domains as any);
              }
            });
          });
        }}
      />
    </>
  );
}
