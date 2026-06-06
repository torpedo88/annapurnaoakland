import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { promos } from "@/db/schema";

export interface PromoResult {
  ok: boolean;
  discountCents: number;
  code: string;
  label: string;   // e.g. "20% off" or "$5.00 off"
  reason?: string; // why invalid (for the UI)
}

/** Validate a promo code against a subtotal (cents). Pure read; does not redeem. */
export async function validatePromo(rawCode: unknown, subtotalCents: number): Promise<PromoResult> {
  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
  const fail = (reason: string): PromoResult => ({ ok: false, discountCents: 0, code, label: "", reason });
  if (!code) return fail("Enter a code");
  const [p] = await db.select().from(promos).where(eq(promos.code, code)).limit(1);
  if (!p) return fail("Invalid code");
  if (!p.isActive) return fail("This code is inactive");
  const now = Date.now();
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return fail("This code isn't active yet");
  if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return fail("This code has expired");
  if (p.maxRedemptions != null && p.timesRedeemed >= p.maxRedemptions) return fail("This code is fully redeemed");
  if (p.minOrder != null && subtotalCents < Math.round(Number(p.minOrder) * 100)) {
    return fail(`Minimum order is $${Number(p.minOrder).toFixed(2)}`);
  }
  let discountCents = p.discountType === "percent"
    ? Math.round(subtotalCents * (Number(p.discountValue) / 100))
    : Math.round(Number(p.discountValue) * 100);
  discountCents = Math.max(0, Math.min(discountCents, subtotalCents)); // never exceed subtotal
  const label = p.discountType === "percent"
    ? `${Number(p.discountValue)}% off`
    : `$${Number(p.discountValue).toFixed(2)} off`;
  return { ok: true, discountCents, code, label };
}

/** Atomically increment redemption count (call once per finalized order). */
export async function redeemPromo(code: string): Promise<void> {
  const c = code.trim().toUpperCase();
  if (!c) return;
  await db.update(promos)
    .set({ timesRedeemed: sql`${promos.timesRedeemed} + 1`, updatedAt: new Date() })
    .where(eq(promos.code, c));
}
