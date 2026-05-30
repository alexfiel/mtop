import { DriversClient } from "./components/drivers-client";
import { getDrivers } from "./actions";

export default async function DriversPage() {
  const drivers = await getDrivers();

  return <DriversClient initialDrivers={drivers} />;
}
