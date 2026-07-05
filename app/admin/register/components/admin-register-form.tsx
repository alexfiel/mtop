"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import { registerAdmin } from "../actions";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  secretCode: z.string().min(1, "Secret code is required"),
});

export function AdminRegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const res = await registerAdmin(data);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Admin registered successfully!");
      router.push("/login");
    } else {
      toast.error(res.error || "Failed to register admin.");
    }
  }

  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Admin Registration</CardTitle>
        <CardDescription>
          Create a new system administrator account. An authorization secret code is required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Juan Dela Cruz" {...register("name")} disabled={isSubmitting} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@example.com" {...register("email")} disabled={isSubmitting} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} disabled={isSubmitting} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="secretCode">Secret Authorization Code</Label>
            <Input id="secretCode" type="password" placeholder="Enter admin secret code" {...register("secretCode")} disabled={isSubmitting} />
            {errors.secretCode && <p className="text-sm text-destructive">{errors.secretCode.message}</p>}
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Create Admin Account"}
          </Button>

          <div className="text-center text-sm pt-4">
            <Link href="/login" className="text-muted-foreground hover:text-primary hover:underline">
              Return to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
