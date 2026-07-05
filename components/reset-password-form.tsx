"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token || "",
      });

      if (resetError) {
        toast.error(resetError.message || "Failed to reset password");
        setError(resetError.message || "Failed to reset password. The link might be expired.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Password successfully reset!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (err) {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-0 shadow-lg md:border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-12 flex flex-col justify-center">
            {isSuccess ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Password Reset Complete</h2>
                <p className="text-muted-foreground text-sm">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                <Button 
                  className="mt-4 w-full"
                  onClick={() => router.push("/login")}
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-6">
                  <div className="flex flex-col items-center gap-2 text-center mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
                    <p className="text-balance text-muted-foreground">
                      Please enter your new password below.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="password">New Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || !token}
                      className="h-11"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading || !token}
                      className="h-11"
                    />
                  </Field>
                  <Field className="pt-4">
                    <Button type="submit" disabled={isLoading || !token} className="h-11 w-full text-base">
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </Field>
                  
                  <div className="text-center text-sm">
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                      Back to login
                    </Link>
                  </div>
                </FieldGroup>
              </form>
            )}
          </div>
          <div className="relative hidden bg-primary/5 md:flex md:items-center md:justify-center">
            <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center text-primary-foreground dark:text-primary">
              <div className="rounded-full bg-primary/20 p-6 backdrop-blur-md ring-1 ring-primary/30">
                <LockKeyhole className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Secure Access</h2>
                <p className="max-w-[250px] text-balance text-sm text-primary/80">
                  Update your credentials to keep your MTOP System account secure.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs opacity-70">
        &copy; {new Date().getFullYear()} MTOP System. All rights reserved.
      </FieldDescription>
    </div>
  );
}
