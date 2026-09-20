import { getVehicles, getOperatorsWithoutVehicle } from "./actions";
import { VehicleClient } from "./component/vehicle-client";
import { VehicleItem, OperatorOption } from "./types";

export const metadata = {
  title: "Vehicle Registry & Fleet Dashboard | MTOP Portal",
  description: "Official motorized tricycle registry, LTO certification credentials, operator linkage, and franchise assignment status for Tagbilaran City.",
};

export default async function VehiclePage() {
  const [vehicles, operatorsWithoutVehicle] = await Promise.all([
    getVehicles(),
    getOperatorsWithoutVehicle(),
  ]);

  return (
    <VehicleClient
      initialVehicles={vehicles as unknown as VehicleItem[]}
      operatorsWithoutVehicle={operatorsWithoutVehicle as unknown as OperatorOption[]}
    />
  );
}
