import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "../../components/print-button";

export default async function FranchiseCertificate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const franchise = await prisma.franchise.findUnique({
    where: { id },
    include: {
      tricycle: true,
      franchiseTransactions: {
        where: { transactionType: "FRANCHISE_FEE", paymentStatus: "PAID" },
        orderBy: { paymentDate: "desc" },
        take: 1,
      },
    }
  });

  if (!franchise || franchise.status !== "ACTIVE") {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white text-black p-12 border shadow-lg relative print:shadow-none print:border-none print:m-0 print:p-0">
      <div className="flex justify-end print:hidden mb-4">
        <PrintButton />
      </div>

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Republic of the Philippines</h1>
        <h2 className="text-xl font-semibold">City / Municipality Office</h2>
        <h3 className="text-lg">Office of the Sangguniang Panglungsod</h3>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold uppercase border-b-2 border-black inline-block pb-2">
          Motor Tricycle Operator's Permit
        </h1>
        <p className="mt-4 font-semibold text-lg tracking-widest text-muted-foreground print:text-black">
          CERTIFICATE OF FRANCHISE
        </p>
      </div>

      <div className="space-y-6 text-lg leading-relaxed">
        <p>
          This is to certify that <strong>{franchise.ownerName}</strong> of legal age, residing at{" "}
          <strong>{franchise.address}</strong>, has been granted this franchise to operate a Motorized Tricycle for Hire within the <strong>{franchise.areaOfOperation || "approved route"}</strong>.
        </p>
        
        <p>
          This franchise is granted pursuant to <strong>Resolution No. {franchise.resolutionNo || "N/A"}</strong> approved on{" "}
          <strong>{franchise.approvedOn ? format(new Date(franchise.approvedOn), "MMMM d, yyyy") : "N/A"}</strong> and will expire on{" "}
          <strong>{franchise.expiresAt ? format(new Date(franchise.expiresAt), "MMMM d, yyyy") : "N/A"}</strong>.
        </p>

        <div className="grid grid-cols-2 gap-8 my-8 bg-slate-50 p-6 rounded border border-slate-200 print:bg-transparent print:border-none print:p-0">
          <div>
            <span className="block text-sm text-muted-foreground uppercase font-semibold">Franchise No.</span>
            <span className="text-xl font-bold">{franchise.franchiseNo}</span>
          </div>
          <div>
            <span className="block text-sm text-muted-foreground uppercase font-semibold">Issued Date</span>
            <span className="text-xl font-bold">{format(new Date(franchise.issuedAt), "MMMM d, yyyy")}</span>
          </div>
          {franchise.expiresAt && (
            <div>
              <span className="block text-sm text-muted-foreground uppercase font-semibold">Expiry Date</span>
              <span className="text-xl font-bold">{format(new Date(franchise.expiresAt), "MMMM d, yyyy")}</span>
            </div>
          )}
          {franchise.tricycle && (
            <>
              <div>
                <span className="block text-sm text-muted-foreground uppercase font-semibold">Tricycle Model</span>
                <span className="text-xl font-bold">{franchise.tricycle.make} {franchise.tricycle.model}</span>
              </div>
              <div>
                <span className="block text-sm text-muted-foreground uppercase font-semibold">Body Number</span>
                <span className="text-xl font-bold">{franchise.tricycle.bodyNumber}</span>
              </div>
              <div>
                <span className="block text-sm text-muted-foreground uppercase font-semibold">Color</span>
                <span className="text-xl font-bold">{franchise.tricycle.color}</span>
              </div>
              <div>
                <span className="block text-sm text-muted-foreground uppercase font-semibold">Chassis No.</span>
                <span className="text-xl font-bold">{franchise.tricycle.chassisNo}</span>
              </div>
              <div>
                <span className="block text-sm text-muted-foreground uppercase font-semibold">Engine No.</span>
                <span className="text-xl font-bold">{franchise.tricycle.motorNo}</span>
              </div>
            </>
          )}
        </div>

        {franchise.franchiseTransactions && franchise.franchiseTransactions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 bg-slate-50 p-6 rounded border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <div>
              <span className="block text-sm text-muted-foreground uppercase font-semibold">O.R. Number</span>
              <span className="text-lg font-bold">{franchise.franchiseTransactions[0].orNumber}</span>
            </div>
            <div>
              <span className="block text-sm text-muted-foreground uppercase font-semibold">Amount Paid</span>
              <span className="text-lg font-bold">PHP {franchise.franchiseTransactions[0].amount.toFixed(2)}</span>
            </div>
            <div>
              <span className="block text-sm text-muted-foreground uppercase font-semibold">Payment Date</span>
              <span className="text-lg font-bold">{format(new Date(franchise.franchiseTransactions[0].paymentDate), "MMM d, yyyy")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-32 flex justify-between px-12">
        <div className="text-center">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="font-semibold">City Mayor</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="font-semibold">SP Secretary</p>
        </div>
      </div>
    </div>
  );
}
