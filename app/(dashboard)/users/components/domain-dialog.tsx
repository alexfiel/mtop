"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createDomain, updateDomain } from "../actions";
import { toast } from "sonner";
import { Building2, Globe, Shield } from "lucide-react";

export type DomainItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  allowedEmailDomain: string | null;
  isActive: boolean;
  _count?: {
    users: number;
  };
};

const domainFormSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["WORKFLOW", "DEPARTMENT", "OFFICE"]).default("WORKFLOW"),
  allowedEmailDomain: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DomainFormValues = z.infer<typeof domainFormSchema>;

interface DomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: DomainItem | null;
  onSuccess?: () => void;
}

export function DomainDialog({
  open,
  onOpenChange,
  domain,
  onSuccess,
}: DomainDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainFormSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "WORKFLOW",
      allowedEmailDomain: "",
      isActive: true,
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    if (domain) {
      reset({
        code: domain.code,
        name: domain.name,
        description: domain.description || "",
        type: (domain.type as any) || "WORKFLOW",
        allowedEmailDomain: domain.allowedEmailDomain || "",
        isActive: domain.isActive,
      });
    } else {
      reset({
        code: "",
        name: "",
        description: "",
        type: "WORKFLOW",
        allowedEmailDomain: "",
        isActive: true,
      });
    }
  }, [domain, reset, open]);

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    try {
      if (domain) {
        const res = await updateDomain(domain.id, {
          name: values.name,
          description: values.description,
          type: values.type,
          allowedEmailDomain: values.allowedEmailDomain,
          isActive: values.isActive,
        });

        if (res.success) {
          toast.success(`Domain '${values.name}' updated successfully.`);
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to update domain.");
        }
      } else {
        const res = await createDomain({
          code: values.code.toUpperCase().trim(),
          name: values.name,
          description: values.description,
          type: values.type,
          allowedEmailDomain: values.allowedEmailDomain,
          isActive: values.isActive,
        });

        if (res.success) {
          toast.success(`Domain '${values.code.toUpperCase()}' created successfully.`);
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to create domain.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedType = watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {domain ? "Edit Domain / Office" : "Add New Domain"}
          </DialogTitle>
          <DialogDescription>
            Configure municipal workflow departments, offices, and authorized email domains.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Domain Code */}
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Domain Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="e.g. BPLO, TRAFFIC, SP, TREASURY, LEGAL"
              disabled={!!domain || isSubmitting}
              className="uppercase font-mono tracking-wider font-semibold"
              {...register("code", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
            {domain && (
              <p className="text-[11px] text-muted-foreground">Domain code cannot be changed once created.</p>
            )}
          </div>

          {/* Domain Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Domain / Department Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Business Permit and Licensing Office"
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Domain Type & Allowed Email Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Domain Type
              </Label>
              <Select
                value={selectedType}
                onValueChange={(val: any) => setValue("type", val, { shouldValidate: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKFLOW">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-blue-500" />
                      <span>Workflow Engine</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="DEPARTMENT">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>LGU Department</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="OFFICE">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-purple-500" />
                      <span>External / Office</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allowedEmailDomain" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Allowed Email Domain
              </Label>
              <Input
                id="allowedEmailDomain"
                placeholder="tagbilaran.gov.ph"
                disabled={isSubmitting}
                {...register("allowedEmailDomain")}
              />
              <p className="text-[11px] text-muted-foreground">Optional domain filter for officers</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description / Responsibilities
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Describe the department's mandate, inspection responsibilities, or workflow stage..."
              disabled={isSubmitting}
              {...register("description")}
            />
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register("isActive")}
              disabled={isSubmitting}
            />
            <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Active Domain (available for workflow task assignments and officer registration)
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : domain ? "Save Changes" : "Create Domain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
