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
import { useRouter } from "next/navigation";

const formSchema = z.object({
  ownerName: z.string().min(2, "Owner Name is required"),
  address: z.string().min(5, "Address is required"),
  contactNo: z.string().min(10, "Valid contact number required"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  isRenewal: z.boolean(),
  tricycle: z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    color: z.string().min(1, "Color is required"),
    plateNo: z.string().min(1, "Plate Number is required"),
    chassisNo: z.string().min(1, "Chassis Number is required"),
    motorNo: z.string().min(1, "Motor Number is required"),
    bodyNumber: z.string().min(1, "Body Number is required"),
  }),
});

export function ApplicationForm({ unassignedBodyNumbers, onSuccess }: { unassignedBodyNumbers: any[]; onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset, setError } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: "",
      address: "",
      contactNo: "",
      email: "",
      dateOfBirth: "",
      isRenewal: false,
      tricycle: {
        make: "",
        model: "",
        color: "",
        plateNo: "",
        chassisNo: "",
        motorNo: "",
        bodyNumber: "",
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      const result = await createFranchiseApplication({
        ...values,
        dateOfBirth: new Date(values.dateOfBirth),
      });

      if (result && result.error) {
        if (result.field) {
          setError(result.field as keyof z.infer<typeof formSchema>, {
            type: "server",
            message: result.error,
          });
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success("Franchise application submitted successfully.");
      reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/franchises");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred. Please try again.");
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

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Tricycle Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input id="make" placeholder="Honda" {...register("tricycle.make")} />
                {errors.tricycle?.make && <p className="text-sm text-destructive">{errors.tricycle.make.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="TMX 125" {...register("tricycle.model")} />
                {errors.tricycle?.model && <p className="text-sm text-destructive">{errors.tricycle.model.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" placeholder="Red" {...register("tricycle.color")} />
                {errors.tricycle?.color && <p className="text-sm text-destructive">{errors.tricycle.color.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plateNo">Plate Number</Label>
                <Input id="plateNo" placeholder="ABC-1234" {...register("tricycle.plateNo")} />
                {errors.tricycle?.plateNo && <p className="text-sm text-destructive">{errors.tricycle.plateNo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chassisNo">Chassis Number</Label>
                <Input id="chassisNo" placeholder="CHASSIS-987" {...register("tricycle.chassisNo")} />
                {errors.tricycle?.chassisNo && <p className="text-sm text-destructive">{errors.tricycle.chassisNo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motorNo">Motor Number</Label>
                <Input id="motorNo" placeholder="MOTOR-654" {...register("tricycle.motorNo")} />
                {errors.tricycle?.motorNo && <p className="text-sm text-destructive">{errors.tricycle.motorNo.message}</p>}
              </div>

              <div className="space-y-2 col-span-2 md:col-span-3">
                <Label htmlFor="bodyNumber">Body Number</Label>
                <select
                  id="bodyNumber"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("tricycle.bodyNumber")}
                >
                  <option value="">Select an unassigned body number...</option>
                  {unassignedBodyNumbers.map((bn) => (
                    <option key={bn.bodyNumber} value={bn.bodyNumber.toString()}>
                      {bn.bodyNumber}
                    </option>
                  ))}
                </select>
                {errors.tricycle?.bodyNumber && <p className="text-sm text-destructive">{errors.tricycle.bodyNumber.message}</p>}
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
