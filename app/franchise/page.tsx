import {
  getNewFranchises,
  getAvailableOperators,
  getAvailableVehicles,
  getNextAvailableBodyNumber,
  getOperatorsWithoutVehicle,
} from "./actions";
import { FranchiseClient } from "./component/franchise-client";

export const metadata = {
  title: "Franchise Management & Body Assignment | MTOP Portal",
  description: "Manage MTOP franchise body numbers, assign operators, and link motorized tricycle vehicles in Tagbilaran City.",
};

export default async function FranchisePage() {
  const [franchises, availableOperators, availableVehicles, nextSuggestedNumber, operatorsWithoutVehicle] = await Promise.all([
    getNewFranchises(),
    getAvailableOperators(),
    getAvailableVehicles(),
    getNextAvailableBodyNumber(),
    getOperatorsWithoutVehicle(),
  ]);

  return (
    <FranchiseClient
      initialFranchises={franchises}
      availableOperators={availableOperators}
      availableVehicles={availableVehicles}
      nextSuggestedNumber={nextSuggestedNumber}
      operatorsWithoutVehicle={operatorsWithoutVehicle}
    />
  );
}
