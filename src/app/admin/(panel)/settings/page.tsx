import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth/session";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  const settings = await getSettings();
  return <SettingsForm initial={settings} role={session.role} />;
}
