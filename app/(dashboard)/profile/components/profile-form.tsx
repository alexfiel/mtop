"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { updateProfile } from "../actions";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactNo: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RoleType = { id: string; name: string };
type UserProfileProps = {
  user: {
    id: string;
    name: string;
    email: string;
    roles: { role: RoleType }[];
    profile: {
      contactNo: string | null;
      jobTitle: string | null;
      department: string | null;
      office: string | null;
      dateOfBirth: Date | null;
      address: string | null;
    } | null;
  };
};

export function ProfileForm({ user }: UserProfileProps) {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      contactNo: user.profile?.contactNo || "",
      jobTitle: user.profile?.jobTitle || "",
      department: user.profile?.department || "",
      office: user.profile?.office || "",
      dateOfBirth: user.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] : "",
      address: user.profile?.address || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onUpdateProfile(data: z.infer<typeof profileSchema>) {
    setIsUpdatingProfile(true);
    const res = await updateProfile(data);
    setIsUpdatingProfile(false);

    if (res.success) {
      toast.success("Profile updated successfully!");
      // Reset form with new values to remove dirty state
      profileForm.reset(data);
    } else {
      toast.error(res.error || "Failed to update profile.");
    }
  }

  async function onUpdatePassword(data: z.infer<typeof passwordSchema>) {
    setIsUpdatingPassword(true);
    
    try {
      const { error } = await authClient.changePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(error.message || "Failed to change password");
      } else {
        toast.success("Password changed successfully!");
        passwordForm.reset();
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal and professional information.</CardDescription>
        </CardHeader>
        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...profileForm.register("name")} disabled={isUpdatingProfile} />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input id="contactNo" placeholder="e.g. 09123456789" {...profileForm.register("contactNo")} disabled={isUpdatingProfile} />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...profileForm.register("dateOfBirth")} disabled={isUpdatingProfile} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" placeholder="e.g. Lead Enforcer" {...profileForm.register("jobTitle")} disabled={isUpdatingProfile} />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="e.g. Traffic Management" {...profileForm.register("department")} disabled={isUpdatingProfile} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="office">Office / Location</Label>
                <Input id="office" placeholder="e.g. Main Branch" {...profileForm.register("office")} disabled={isUpdatingProfile} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Home Address</Label>
              <Input id="address" placeholder="Complete address" {...profileForm.register("address")} disabled={isUpdatingProfile} />
            </div>

            <div className="space-y-2 pt-2 border-t mt-4">
              <Label>Assigned Roles</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <Badge key={r.role.id} variant="secondary">
                      {r.role.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Roles can only be modified by a System Administrator.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingProfile || !profileForm.formState.isDirty}>
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  {...passwordForm.register("currentPassword")} 
                  disabled={isUpdatingPassword} 
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  {...passwordForm.register("newPassword")} 
                  disabled={isUpdatingPassword} 
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  {...passwordForm.register("confirmPassword")} 
                  disabled={isUpdatingPassword} 
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="secondary" disabled={isUpdatingPassword || !passwordForm.formState.isDirty}>
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
