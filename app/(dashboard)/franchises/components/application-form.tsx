"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createFranchiseApplication } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const formSchema = z.object({
  ownerName: z.string().min(2, "Owner Name is required"),
  address: z.string().min(5, "Address is required"),
  contactNo: z.string().min(10, "Valid contact number required"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  isRenewal: z.boolean(),
});

export function ApplicationForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: "",
      address: "",
      contactNo: "",
      email: "",
      dateOfBirth: "",
      isRenewal: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await createFranchiseApplication({
        ...values,
        dateOfBirth: new Date(values.dateOfBirth),
      });
      toast.success("Franchise application submitted successfully.");
      reset();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>New Franchise Application</CardTitle>
        <CardDescription>
          Enter the applicant's details to submit a new franchise application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input id="ownerName" placeholder="Juan Dela Cruz" {...register("ownerName")} />
            {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Main St, Brgy..." {...register("address")} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactNo">Contact No.</Label>
              <Input id="contactNo" placeholder="09123456789" {...register("contactNo")} />
              {errors.contactNo && <p className="text-sm text-destructive">{errors.contactNo.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="juan@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
            </div>

            <div className="space-y-2 flex flex-col justify-center items-center">
              <Label htmlFor="isRenewal" className="mb-2">Is Renewal?</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRenewal"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register("isRenewal")}
                />
                <Label htmlFor="isRenewal" className="font-normal text-sm text-muted-foreground">Yes, this is a renewal</Label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
