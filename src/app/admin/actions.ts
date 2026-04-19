"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "annapurna_staff";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function getExpectedPin(): string {
  // Default for local/dev only. Set STAFF_PIN in production.
  return process.env.STAFF_PIN ?? "1234";
}

export async function signIn(_prev: { error?: string } | null, formData: FormData) {
  const pin = (formData.get("pin") as string | null)?.trim() ?? "";
  if (!pin) return { error: "Enter your PIN." };
  if (pin !== getExpectedPin()) return { error: "Wrong PIN. Try again." };

  const store = await cookies();
  store.set({
    name: COOKIE,
    value: "ok",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: MAX_AGE,
  });
  redirect("/admin");
}

export async function signOut() {
  const store = await cookies();
  store.delete(COOKIE);
  redirect("/admin");
}

export async function hasStaffSession(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "ok";
}
