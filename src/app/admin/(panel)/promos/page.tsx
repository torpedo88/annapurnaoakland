import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PromosClient } from "./promos-client";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  return <PromosClient />;
}
