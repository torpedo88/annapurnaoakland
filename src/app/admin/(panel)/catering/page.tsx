import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CateringClient } from "./catering-client";

export const dynamic = "force-dynamic";

export default async function CateringPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  return <CateringClient />;
}
