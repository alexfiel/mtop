import { ApplicationForm } from "../components/application-form";
import { getUnassignedBodyNumbers } from "../actions";

export default async function NewFranchiseApplicationPage() {
  const unassignedBodyNumbers = await getUnassignedBodyNumbers();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Franchise Application</h2>
        <p className="text-muted-foreground mt-2">
          Submit a new MTOP franchise application. Fill out the details below.
        </p>
      </div>
      
      <div className="mt-8">
        <ApplicationForm unassignedBodyNumbers={unassignedBodyNumbers} />
      </div>
    </div>
  );
}
