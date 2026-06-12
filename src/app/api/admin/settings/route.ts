import { NextResponse } from "next/server";
import { getSettings, updateSetting, type DeliverySettings } from "@/lib/settings";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Forbidden" }, { status: e instanceof AuthError ? 403 : 500 });
  }
  return NextResponse.json(await getSettings());
}

function asCents(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export async function PATCH(req: Request) {
  let session;
  try {
    session = await requireRole(["owner", "manager"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Manager may toggle ordering/availability; only owner may change financial config.
  const ownerOnly = "tax_rate" in body || "delivery" in body;
  if (ownerOnly && session.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can change tax or delivery pricing." }, { status: 403 });
  }

  if ("tax_rate" in body) {
    const n = Number(body.tax_rate);
    if (!Number.isFinite(n) || n < 0 || n >= 1) {
      return NextResponse.json({ error: "tax_rate must be between 0 and 1" }, { status: 400 });
    }
    await updateSetting("tax_rate", n);
  }
  for (const k of ["ordering_paused", "pickup_enabled", "delivery_enabled"] as const) {
    if (k in body) await updateSetting(k, Boolean(body[k]));
  }
  if ("delivery" in body && body.delivery && typeof body.delivery === "object") {
    const d = body.delivery as Partial<DeliverySettings>;
    const clean: DeliverySettings = {
      mode: d.mode === "flat" ? "flat" : "live",
      flatFeeCents: asCents(d.flatFeeCents),
      markupCents: asCents(d.markupCents),
      markupPercent: Number.isFinite(Number(d.markupPercent)) ? Math.max(0, Number(d.markupPercent)) : 0,
      freeThresholdCents: asCents(d.freeThresholdCents),
      minOrderCents: asCents(d.minOrderCents),
      maxRadiusMiles: Number.isFinite(Number(d.maxRadiusMiles)) ? Math.max(0, Number(d.maxRadiusMiles)) : 0,
      dispatchMode: d.dispatchMode === "self" ? "self" : d.dispatchMode === "uber" ? "uber" : "doordash",
    };
    await updateSetting("delivery", clean);
  }
  if ("dish_of_day" in body && body.dish_of_day && typeof body.dish_of_day === "object") {
    const d = body.dish_of_day as { itemId?: unknown; discountPercent?: unknown };
    const pct = Number(d.discountPercent);
    await updateSetting("dish_of_day", {
      itemId: typeof d.itemId === "string" && d.itemId ? d.itemId : null,
      discountPercent: Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0,
    });
  }

  return NextResponse.json(await getSettings());
}
