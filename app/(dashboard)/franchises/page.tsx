import { getFranchises, getUnassignedBodyNumbers } from "./actions";
import { FranchiseWorkflow } from "./components/franchise-workflow";

export default async function FranchisesPage() {
  const franchises = await getFranchises();
  const unassignedBodyNumbers = await getUnassignedBodyNumbers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Franchises</h2>
          <p className="text-muted-foreground mt-2">
            Manage MTOP Franchise Applications and Renewals.
          </p>
        </div>
      </div>
      
      <FranchiseWorkflow 
        initialFranchises={franchises} 
        unassignedBodyNumbers={unassignedBodyNumbers}
      />
    </div>
  );
}
