import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { TimeSlotsClient } from "./time-slots-client";

export const dynamic = "force-dynamic";

export default async function TimeSlotsPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  return <TimeSlotsClient />;
}
