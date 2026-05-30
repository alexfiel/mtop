"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { registerDriver } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CameraCapture } from "./camera-capture";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  middleName: z.string().optional(),
  licenseNo: z.string().min(1, "License Number is required"),
  address: z.string().min(1, "Address is required"),
  contactNo: z.string().min(1, "Contact Number is required"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
});

export function DriverRegistration({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [licensePicture, setLicensePicture] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const uploadBase64 = async (base64Str: string, filename: string): Promise<string | null> => {
    try {
      const fetchResponse = await fetch(base64Str);
      const blob = await fetchResponse.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    if (!profilePicture) {
      setError("Please capture the driver's profile picture.");
      return;
    }
    if (!licensePicture) {
      setError("Please capture the driver's license.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const uploadedProfile = await uploadBase64(profilePicture, "profile.jpg");
      const uploadedLicense = await uploadBase64(licensePicture, "license.jpg");

      if (!uploadedProfile || !uploadedLicense) {
        setError("Failed to upload images.");
        setIsSubmitting(false);
        return;
      }

      const result = await registerDriver({
        ...values,
        dateOfBirth: new Date(values.dateOfBirth),
        profilePicture: uploadedProfile,
        licensePicture: uploadedLicense,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      toast.success("Driver registered successfully!");
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to register driver. Make sure Email and License No. are unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Driver</CardTitle>
        <CardDescription>Enter driver details and capture required photos.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input placeholder="Juan" {...register("firstName")} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input placeholder="Dela Cruz" {...register("lastName")} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input placeholder="M" {...register("middleName")} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" {...register("dateOfBirth")} />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input placeholder="NXX-XX-XXXXXX" {...register("licenseNo")} />
              {errors.licenseNo && <p className="text-sm text-destructive">{errors.licenseNo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input placeholder="09XX XXX XXXX" {...register("contactNo")} />
              {errors.contactNo && <p className="text-sm text-destructive">{errors.contactNo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="juan@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Main St, Barangay, City" {...register("address")} />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t">
            <CameraCapture label="Profile Picture" onCapture={setProfilePicture} />
            <CameraCapture label="Driver's License" onCapture={setLicensePicture} />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Driver"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
