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
import { createUser, updateUser, updateUserPassword } from "../actions";
import { toast } from "sonner";
import { Role } from "@prisma/client";

const roles = ["ADMIN", "ENFORCER", "CASHIER", "VIEWER", "USER"] as const;

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(roles),
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
    role: Role;
  };
  onSuccess: () => void;
  onCancel: () => void;
};

type UserFormValues = z.infer<typeof createUserSchema>;

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordChange, setIsPasswordChange] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(user ? (isPasswordChange ? updatePasswordSchema : userSchema) : createUserSchema) as any,
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          password: "",
        }
      : {
          name: "",
          email: "",
          role: "USER",
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
            role: values.role,
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
          role: values.role,
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

  const roleValue = watch("role");

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

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={roleValue} 
              onValueChange={(value) => setValue("role", value as any, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
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
