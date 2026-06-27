"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import Link from "next/link"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setEmailError("")

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        // The default role is configured as USER in lib/auth.ts
      })

      if (error) {
        if (error.code === "USER_ALREADY_EXISTS") {
          setEmailError("This email is already registered")
        } else {
          toast.error(error.message || "Failed to register")
        }
        setIsLoading(false)
        return
      }

      if (!data || !data.user) {
        toast.error("Failed to save user to the database. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Successfully registered! Please check your email to verify your account.")
      router.push("/login")
      router.refresh()
    } catch (err) {
      toast.error("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-0 shadow-lg md:border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-12 flex flex-col justify-center" onSubmit={handleSubmit}>
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
                <p className="text-balance text-muted-foreground">
                  Register for the MTOP Management System
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError("")
                  }}
                  disabled={isLoading}
                  className={cn("h-11", emailError && "border-destructive focus-visible:ring-destructive")}
                />
                {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </Field>
              <Field className="pt-4">
                <Button type="submit" disabled={isLoading} className="h-11 w-full text-base">
                  {isLoading ? "Creating account..." : "Register"}
                </Button>
              </Field>
              
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Login here
                </Link>
              </div>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-primary/5 md:flex md:items-center md:justify-center">
            <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center text-primary-foreground dark:text-primary">
              <div className="rounded-full bg-primary/20 p-6 backdrop-blur-md ring-1 ring-primary/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-16 w-16 opacity-90 text-primary"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Join MTOP System</h2>
                <p className="max-w-[250px] text-balance text-sm text-primary/80">
                  Quick and secure registration for operators and enforcers.
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
  )
}
