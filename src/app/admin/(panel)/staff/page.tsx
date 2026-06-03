import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { StaffClient } from "./staff-client";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getSession();
  if (!session || session.role !== "owner") redirect("/admin");
  return <StaffClient />;
}
