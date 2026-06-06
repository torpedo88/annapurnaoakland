import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ReservationsClient } from "./reservations-client";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  return <ReservationsClient />;
}
