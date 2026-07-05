"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(error.message || "Failed to send reset link");
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-0 shadow-lg md:border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-12 flex flex-col justify-center">
            {isSent ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                  We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => setIsSent(false)}
                >
                  Try another email
                </Button>
                <Link href="/login" className="text-sm font-medium underline underline-offset-4 hover:text-primary mt-2">
                  Return to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-6">
                  <div className="flex flex-col items-center gap-2 text-center mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Forgot Password?</h1>
                    <p className="text-balance text-muted-foreground">
                      Enter your email to receive a password reset link
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-11"
                    />
                  </Field>
                  <Field className="pt-4">
                    <Button type="submit" disabled={isLoading} className="h-11 w-full text-base">
                      {isLoading ? "Sending link..." : "Send Reset Link"}
                    </Button>
                  </Field>
                  <div className="text-center text-sm">
                    Remember your password?{" "}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                      Log in here
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
                <KeyRound className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Account Recovery</h2>
                <p className="max-w-[250px] text-balance text-sm text-primary/80">
                  Securely reset your password to regain access to the MTOP Management System.
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
