import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PrintButton } from "@/app/(dashboard)/franchises/components/print-button";

export default async function DriverCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await prisma.driver.findUnique({
    where: { id },
  });

  if (!driver) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/drivers">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white p-12 border rounded-xl shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-10 border-b pb-8">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Republic of the Philippines</h1>
          <h2 className="text-xl font-semibold mt-1">City of Tagbilaran</h2>
          <h3 className="text-lg mt-1 text-slate-600">Office of the City Mayor - MTOP Division</h3>
          
          <div className="mt-12 mb-6">
            <h1 className="text-4xl font-serif font-bold text-slate-900">CERTIFICATE OF REGISTRATION</h1>
            <p className="text-sm font-semibold tracking-widest mt-2 uppercase text-slate-500">Tricycle Driver Authorization</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-start mt-12">
          <div className="w-48 h-48 border-4 border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
            {driver.profilePicture ? (
              <img src={driver.profilePicture} alt="Driver" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400">No Photo</span>
            )}
          </div>

          <div className="flex-1 space-y-6 text-lg">
            <p>
              This is to certify that <strong>{driver.firstName} {driver.middleName ? `${driver.middleName} ` : ""}{driver.lastName}</strong>, 
              of legal age, with date of birth on <strong>{format(new Date(driver.dateOfBirth), "MMMM dd, yyyy")}</strong> and a resident of 
              <strong> {driver.address}</strong>, has successfully registered as an authorized Tricycle Driver in the City of Tagbilaran.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Driver's License No.</p>
                <p className="font-semibold text-xl">{driver.licenseNo}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Contact Number</p>
                <p className="font-semibold text-xl">{driver.contactNo}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                <p className="font-semibold">{driver.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Registration Date</p>
                <p className="font-semibold">{format(new Date(driver.createdAt), "MMMM dd, yyyy")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t flex justify-between items-end">
          <div className="text-sm text-slate-500">
            <p>Document ID: {driver.id.toUpperCase()}</p>
            <p>Generated on: {format(new Date(), "MMMM dd, yyyy hh:mm a")}</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-black mb-2 pb-8"></div>
            <p className="font-bold uppercase">City Administrator</p>
            <p className="text-sm text-slate-600">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
