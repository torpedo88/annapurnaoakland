import { hasStaffSession } from "./actions";
import { AdminDashboard } from "./dashboard";
import { PinGate } from "@/components/admin/pin-gate";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authorized = await hasStaffSession();
  if (!authorized) return <PinGate />;
  return <AdminDashboard />;
}
