import { TricyclesWorkflow } from "./components/tricycles-workflow";
import { getTricycles, getActiveDrivers } from "./actions";

export default async function TricyclesPage() {
  const tricycles = await getTricycles();
  const drivers = await getActiveDrivers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tricycles & Permits</h2>
          <p className="text-muted-foreground mt-2">
            Manage registered tricycles and MTOP permits.
          </p>
        </div>
      </div>
      
      <TricyclesWorkflow initialTricycles={tricycles} activeDrivers={drivers} />
    </div>
  );
}
