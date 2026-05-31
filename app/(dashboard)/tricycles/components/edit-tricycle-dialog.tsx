"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Edit } from "lucide-react";
import { updateTricycle } from "../actions";
import { toast } from "sonner";

const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  color: z.string().min(1, "Color is required"),
  plateNo: z.string().min(1, "Plate No is required"),
  chassisNo: z.string().min(1, "Chassis No is required"),
  motorNo: z.string().min(1, "Motor No is required"),
  bodyNumber: z.string().min(1, "Body Number is required"),
});

export function EditTricycleDialog({ tricycle }: { tricycle: any }) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [frontPhoto, setFrontPhoto] = useState(tricycle.documents?.find((d: any) => d.documentType === "TRICYCLE_FRONT")?.fileUrl || "");
  const [backPhoto, setBackPhoto] = useState(tricycle.documents?.find((d: any) => d.documentType === "TRICYCLE_BACK")?.fileUrl || "");
  const [leftPhoto, setLeftPhoto] = useState(tricycle.documents?.find((d: any) => d.documentType === "TRICYCLE_LEFT")?.fileUrl || "");
  const [rightPhoto, setRightPhoto] = useState(tricycle.documents?.find((d: any) => d.documentType === "TRICYCLE_RIGHT")?.fileUrl || "");

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

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: tricycle.make,
      model: tricycle.model,
      color: tricycle.color,
      plateNo: tricycle.plateNo,
      chassisNo: tricycle.chassisNo,
      motorNo: tricycle.motorNo,
      bodyNumber: tricycle.bodyNumber,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      const result = await updateTricycle(tricycle.id, {
        ...values,
        frontPhoto,
        backPhoto,
        leftPhoto,
        rightPhoto,
      });

      if (result?.error) {
        setSubmitError(result.error);
        return;
      }

      toast.success("Tricycle updated successfully!");
      setOpen(false);
    } catch (e: any) {
      setSubmitError(e.message || "Failed to update tricycle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        }
      />
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tricycle Data</DialogTitle>
        </DialogHeader>
        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <h4 className="font-semibold mb-4 text-sm">Update Photos (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <Label className="text-xs">Front View</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setFrontPhoto)} className="text-xs" />
                {frontPhoto && (
                  <div className="relative group rounded-md overflow-hidden border">
                    <img src={frontPhoto} alt="Front View" className="w-full h-24 object-cover" />
                    <button type="button" onClick={() => setFrontPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-xs">Back View</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setBackPhoto)} className="text-xs" />
                {backPhoto && (
                  <div className="relative group rounded-md overflow-hidden border">
                    <img src={backPhoto} alt="Back View" className="w-full h-24 object-cover" />
                    <button type="button" onClick={() => setBackPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-xs">Left Side View</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLeftPhoto)} className="text-xs" />
                {leftPhoto && (
                  <div className="relative group rounded-md overflow-hidden border">
                    <img src={leftPhoto} alt="Left Side" className="w-full h-24 object-cover" />
                    <button type="button" onClick={() => setLeftPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-xs">Right Side View</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setRightPhoto)} className="text-xs" />
                {rightPhoto && (
                  <div className="relative group rounded-md overflow-hidden border">
                    <img src={rightPhoto} alt="Right Side" className="w-full h-24 object-cover" />
                    <button type="button" onClick={() => setRightPhoto("")} className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
