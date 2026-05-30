import { getFeeRules } from "./actions";
import { FeesClient } from "./components/fees-client";

export default async function FeesPage() {
  const fees = await getFeeRules();

  return (
    <div className="p-6">
      <FeesClient initialFees={fees} />
    </div>
  );
}
