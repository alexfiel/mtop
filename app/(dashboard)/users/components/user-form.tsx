"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

type RoleType = { id: string; name: string };

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
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
    roles: { role: RoleType }[];
  };
  roles: RoleType[];
  onSuccess: () => void;
  onCancel: () => void;
};

type UserFormValues = z.infer<typeof createUserSchema>;

export function UserForm({ user, roles, onSuccess, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordChange, setIsPasswordChange] = useState(false);
  
  const [localRoles, setLocalRoles] = useState<RoleType[]>(roles);
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
          password: "",
        }
      : {
          name: "",
          email: "",
          roles: [],
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
        });
        if (res.success) {
          toast.success("User created successfully");
          onSuccess();
        } else {
          toast.error(res.error || "Failed to create user");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const rolesValue = watch("roles") || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {user && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPasswordChange(!isPasswordChange)}
          >
            {isPasswordChange ? "Edit Details" : "Change Password"}
          </Button>
        </div>
      )}

      {(!user || !isPasswordChange) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Doe" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Roles</Label>
            
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={<Button variant="outline" className="w-full justify-between font-normal text-left h-auto min-h-[2.5rem] py-2" />}
              >
                <span className="truncate">
                  {rolesValue.length === 0 
                    ? "Select roles..." 
                    : localRoles
                        .filter(r => rolesValue.includes(r.id))
                        .map(r => r.name)
                        .join(", ")}
                </span>
              </DropdownMenuTrigger>
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
                    {role.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex gap-2 items-center mt-2">
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
                className="h-8"
              />
              <Button type="button" size="sm" onClick={handleAddCustomRole} variant="secondary">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {errors.roles && <p className="text-sm text-destructive">{errors.roles.message}</p>}
          </div>
        </>
      )}

      {(!user || isPasswordChange) && (
        <div className="space-y-2">
          <Label htmlFor="password">{user ? "New Password" : "Password"}</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : user ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
