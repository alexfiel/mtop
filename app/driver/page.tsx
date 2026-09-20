import { getDrivers, getAvailableOperatorsAndFranchises } from "./actions";
import { DriverClient } from "./component/driver-client";
import type {
  DriverItem,
  OperatorOptionForDriver,
  FranchiseOptionForDriver,
} from "./types";

export const metadata = {
  title: "Driver Management & Registry | MTOP Portal",
  description:
    "Official motorized tricycle driver registry, biometric photo verification, LTO license management, and operator/franchise body attachment facility for Tagbilaran City.",
};

export default async function DriverPage() {
  const [driverRes, optionsRes] = await Promise.all([
    getDrivers(),
    getAvailableOperatorsAndFranchises(),
  ]);

  const drivers = (driverRes.success && driverRes.drivers ? driverRes.drivers : []) as unknown as DriverItem[];
  const operators = (optionsRes.success && optionsRes.operators ? optionsRes.operators : []) as unknown as OperatorOptionForDriver[];
  const franchises = (optionsRes.success && optionsRes.franchises ? optionsRes.franchises : []) as unknown as FranchiseOptionForDriver[];

  return (
    <DriverClient
      initialDrivers={drivers}
      operators={operators}
      franchises={franchises}
    />
  );
}
