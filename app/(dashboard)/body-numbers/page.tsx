import { getBodyNumbers } from "./actions";
import { BodyNumberManager } from "./components/body-number-manager";

export default async function BodyNumbersPage() {
  const bodyNumbers = await getBodyNumbers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Body Numbers</h2>
          <p className="text-muted-foreground mt-2">
            Manage MTOP Body Numbers and Assignment Status.
          </p>
        </div>
      </div>
      
      <BodyNumberManager initialBodyNumbers={bodyNumbers} />
    </div>
  );
}
