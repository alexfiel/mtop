import { Metadata } from "next";
import { ItemAccountForm } from "./components/item-account-form";
import { ItemAccountList } from "./components/item-account-list";
import { getItemAccounts } from "./actions";

export const metadata: Metadata = {
  title: "Financial Settings",
  description: "Manage financial configurations and item accounts.",
};

export default async function FinancialPage() {
  const accounts = await getItemAccounts();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Settings</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-7">
          <ItemAccountForm />
        </div>
        
        <div className="col-span-4 lg:col-span-7 mt-8">
          <h3 className="text-xl font-semibold mb-4">Item Accounts</h3>
          <ItemAccountList accounts={accounts} />
        </div>
      </div>
    </div>
  );
}
