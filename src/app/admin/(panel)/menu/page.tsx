import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MenuClient } from "./menu-client";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  return <MenuClient />;
}
