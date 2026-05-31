"use client";

import { ApplicationForm } from "../components/application-form";
import { useRouter } from "next/navigation";

export default function NewFranchiseApplicationPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Franchise Application</h2>
        <p className="text-muted-foreground mt-2">
          Submit a new MTOP franchise application. Fill out the details below.
        </p>
      </div>
      
      <div className="mt-8">
        <ApplicationForm onSuccess={() => {
          router.push("/franchises");
          router.refresh();
        }} />
      </div>
    </div>
  );
}
