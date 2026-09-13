import { getOperators } from "./actions";
import { OperatorClient } from "./component/operator-client";

export const metadata = {
  title: "Operator Registration & Management | MTOP Portal",
  description: "Enroll new tricycle operators, capture biometric photos, and manage identification credentials.",
};

export default async function OperatorPage() {
  const operators = await getOperators();

  return <OperatorClient initialOperators={operators} />;
}
