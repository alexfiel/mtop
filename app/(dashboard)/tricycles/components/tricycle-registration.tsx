"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { verifyFranchiseForRegistration, registerTricycle, getActiveDrivers } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Franchise, Driver } from "@prisma/client";

const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  color: z.string().min(1, "Color is required"),
  plateNo: z.string().min(1, "Plate No is required"),
  chassisNo: z.string().min(1, "Chassis No is required"),
  motorNo: z.string().min(1, "Motor No is required"),
  bodyNumber: z.string().min(1, "Body Number is required"),
});

export function TricycleRegistration({ onSuccess }: { onSuccess?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedFranchise, setVerifiedFranchise] = useState<Franchise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [frontPhoto, setFrontPhoto] = useState("");
  const [backPhoto, setBackPhoto] = useState("");
  const [leftPhoto, setLeftPhoto] = useState("");
  const [rightPhoto, setRightPhoto] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleVerify = async () => {
    setVerifyError(null);
    if (!searchQuery) {
      setVerifyError("Please enter a Franchise No.");
      return;
    }
    
    setIsVerifying(true);
    setVerifiedFranchise(null);
    try {
      const result = await verifyFranchiseForRegistration(searchQuery);
      if (result.success && result.franchise) {
        setVerifiedFranchise(result.franchise);
        toast.success("Franchise verified successfully!");
      } else {
        setVerifyError(result.error || "Verification failed");
      }
    } catch (e) {
      setVerifyError("Failed to verify franchise.");
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!verifiedFranchise) return;
    setSubmitError(null);
    
    try {
      setIsSubmitting(true);
      const result = await registerTricycle({
        ...values,
        franchiseId: verifiedFranchise.id,
        frontPhoto,
        backPhoto,
        leftPhoto,
        rightPhoto,
      });

      if (result?.error) {
        setSubmitError(result.error);
        return;
      }

      toast.success("Tricycle registered successfully!");
      reset();
      setVerifiedFranchise(null);
      setSearchQuery("");
      setFrontPhoto("");
      setBackPhoto("");
      setLeftPhoto("");
      setRightPhoto("");
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setSubmitError(e.message || "Failed to register tricycle. Make sure Plate No/Chassis No are unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Verify Franchise</CardTitle>
          <CardDescription>
            Enter the Franchise Number to verify eligibility. Only ACTIVE and non-expired franchises without a registered tricycle are allowed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifyError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{verifyError}</AlertDescription>
            </Alert>
          )}
          <div className="flex space-x-2">
            <Input 
              placeholder="Enter Franchise No (e.g. TAG-MTOP-2026-0001)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isVerifying || !!verifiedFranchise}
            />
            {!verifiedFranchise ? (
              <Button onClick={handleVerify} disabled={isVerifying}>
                <Search className="h-4 w-4 mr-2" /> Verify
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setVerifiedFranchise(null)}>
                Clear
              </Button>
            )}
          </div>

          {verifiedFranchise && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-900 mb-2">Franchise Verified</h4>
              <p className="text-sm text-green-800">
                <strong>Owner:</strong> {verifiedFranchise.ownerName} <br />
                <strong>Address:</strong> {verifiedFranchise.address}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {verifiedFranchise && (
        <Card>
          <CardHeader>
            <CardTitle>Tricycle Registration</CardTitle>
            <CardDescription>Enter the details of the tricycle to be registered.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input placeholder="e.g. Honda" {...register("make")} />
                  {errors.make && <p className="text-sm text-destructive">{errors.make.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="e.g. TMX 125" {...register("model")} />
                  {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input placeholder="e.g. Red" {...register("color")} />
                  {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Body Number</Label>
                  <Input placeholder="e.g. 0123" {...register("bodyNumber")} />
                  {errors.bodyNumber && <p className="text-sm text-destructive">{errors.bodyNumber.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Plate Number</Label>
                  <Input placeholder="e.g. ABC 123" {...register("plateNo")} />
                  {errors.plateNo && <p className="text-sm text-destructive">{errors.plateNo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Chassis Number</Label>
                  <Input placeholder="e.g. CHS123456789" {...register("chassisNo")} />
                  {errors.chassisNo && <p className="text-sm text-destructive">{errors.chassisNo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Motor Number</Label>
                  <Input placeholder="e.g. MOT123456789" {...register("motorNo")} />
                  {errors.motorNo && <p className="text-sm text-destructive">{errors.motorNo.message}</p>}
                </div>
              </div>
              
              <div className="pt-4 border-t mt-4">
                <h4 className="font-semibold mb-4">Tricycle Photos (Optional)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <Label>Front View</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setFrontPhoto)} className="text-xs" />
                    {frontPhoto && (
                      <div className="relative group rounded-md overflow-hidden border">
                        <img src={frontPhoto} alt="Front View" className="w-full h-32 object-cover" />
                        <button type="button" onClick={() => setFrontPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label>Back View</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setBackPhoto)} className="text-xs" />
                    {backPhoto && (
                      <div className="relative group rounded-md overflow-hidden border">
                        <img src={backPhoto} alt="Back View" className="w-full h-32 object-cover" />
                        <button type="button" onClick={() => setBackPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label>Left Side View</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLeftPhoto)} className="text-xs" />
                    {leftPhoto && (
                      <div className="relative group rounded-md overflow-hidden border">
                        <img src={leftPhoto} alt="Left Side" className="w-full h-32 object-cover" />
                        <button type="button" onClick={() => setLeftPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label>Right Side View</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setRightPhoto)} className="text-xs" />
                    {rightPhoto && (
                      <div className="relative group rounded-md overflow-hidden border">
                        <img src={rightPhoto} alt="Right Side" className="w-full h-32 object-cover" />
                        <button type="button" onClick={() => setRightPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register Tricycle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
