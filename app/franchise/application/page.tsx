import {
  getNewFranchises,
  getAvailableOperators,
  getAvailableVehicles,
  getOperatorsWithoutVehicle,
} from "@/app/franchise/actions";
import { getUnassignedBodyNumbers } from "@/app/(dashboard)/franchises/actions";
import { FranchiseApplicationClient } from "@/app/(dashboard)/franchise-application/components/franchise-application-client";

export const metadata = {
  title: "Franchise Application Workflow Engine | MTOP Portal",
  description:
    "Multi-domain municipal pipeline for motorized tricycle franchise applications, featuring BPLO intake, Treasury billing, Zoning clearance, SP council approval, and Mayor permit issuance.",
};

export default async function FranchiseApplicationPage() {
  const [
    franchises,
    availableOperators,
    availableVehicles,
    operatorsWithoutVehicle,
    unassignedBodyNumbers,
  ] = await Promise.all([
    getNewFranchises(),
    getAvailableOperators(),
    getAvailableVehicles(),
    getOperatorsWithoutVehicle(),
    getUnassignedBodyNumbers(),
  ]);

  return (
    <FranchiseApplicationClient
      initialFranchises={franchises}
      availableOperators={availableOperators}
      availableVehicles={availableVehicles}
      unassignedBodyNumbers={unassignedBodyNumbers}
    />
  );
}
