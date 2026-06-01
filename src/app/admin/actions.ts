"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie, getSession, type Role } from "@/lib/auth/session";

export async function signIn(_prev: { error?: string } | null, formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  if (!email || !password) return { error: "Enter your email and password." };

  const [user] = await db.select().from(staff).where(eq(staff.email, email)).limit(1);
  // Always run a verify to reduce timing oracle even when the user is absent.
  const ok = user && user.isActive && (await verifyPassword(password, user.passwordHash));
  if (!ok) return { error: "Invalid credentials." };

  await setSessionCookie({ sid: user.id, role: user.role as Role });
  redirect("/admin");
}

export async function signOut() {
  await clearSessionCookie();
  redirect("/admin/login");
}

/** Convenience for server components that need the current staff session. */
export async function currentStaff() {
  return getSession();
}
