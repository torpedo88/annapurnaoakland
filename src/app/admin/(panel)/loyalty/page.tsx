import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoyaltyClient } from "./loyalty-client";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  return <LoyaltyClient />;
}
