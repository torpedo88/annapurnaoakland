import { NextResponse } from "next/server";
import { priceOrder, PricingError } from "@/lib/orders/pricing";
import { validatePromo } from "@/lib/orders/promo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  let subtotalCents: number;
  try { subtotalCents = priceOrder((body?.items as { id: unknown; qty: unknown }[]) ?? []).subtotalCents; }
  catch (e) { return NextResponse.json({ valid: false, reason: e instanceof PricingError ? e.message : "Invalid cart" }, { status: 200 }); }
  const r = await validatePromo(body?.code, subtotalCents);
  return NextResponse.json({ valid: r.ok, discountCents: r.discountCents, label: r.label, code: r.code, reason: r.reason ?? null });
}
