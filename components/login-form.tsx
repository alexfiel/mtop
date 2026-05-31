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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: false,
      })

      if (error) {
        toast.error(error.message || "Invalid credentials")
        setIsLoading(false)
        return
      }

      toast.success("Successfully logged in")
      sessionStorage.setItem("mtop_session_active", "true");
      router.push("/")
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
                <h1 className="text-3xl font-bold tracking-tight">MTOP Portal</h1>
                <p className="text-balance text-muted-foreground">
                  Login to the MTOP Management System
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
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
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                  Register here
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
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-16 w-16 text-primary"
                >
                  <path d="M4 14 L5 5 C5 4 6 3 8 3 L16 3 C18 3 19 4 19 5 L20 14 Z" fill="currentColor" fillOpacity="0.1" />
                  <path d="M4 14 L5 5 C5 4 6 3 8 3 L16 3 C18 3 19 4 19 5 L20 14 Z" />
                  <path d="M4 14 L20 14 L19 18 L5 18 Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M4 14 L20 14 L19 18 L5 18 Z" />
                  <path d="M6 10 L6.5 5.5 L17.5 5.5 L18 10 Z" fill="currentColor" fillOpacity="0.3" />
                  <path d="M6 10 L6.5 5.5 L17.5 5.5 L18 10 Z" />
                  <path d="M12 5.5 L12 10" />
                  <circle cx="7" cy="16" r="1" fill="currentColor" />
                  <circle cx="17" cy="16" r="1" fill="currentColor" />
                  <circle cx="12" cy="15" r="1.5" fill="currentColor" />
                  <path d="M11.5 18 L11.5 20 M12.5 18 L12.5 20" />
                  <rect x="11" y="20" width="2" height="3" rx="1" fill="currentColor" />
                  <rect x="3.5" y="17.5" width="1.5" height="3" rx="0.5" fill="currentColor" />
                  <rect x="19" y="17.5" width="1.5" height="3" rx="0.5" fill="currentColor" />
                  <path d="M7 3 L7 1 L17 1 L17 3" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">MTOP System</h2>
                <p className="max-w-[250px] text-balance text-sm text-primary/80">
                  Motor Tricycle Operator Permit LGU Management Portal
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
