import { AdminRegisterForm } from "./components/admin-register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Registration | MTOP",
};

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full max-w-md">
        <AdminRegisterForm />
      </div>
    </div>
  );
}
