import { ResetPasswordForm } from "@/components/reset-password-form"
import { Suspense } from "react"

export const metadata = {
  title: "Reset Password | MTOP System",
  description: "Set a new password for your MTOP System account",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
