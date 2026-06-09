import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { quoteDelivery } from "@/lib/doordash/client";
import { priceOrder, cleanString, PricingError } from "@/lib/orders/pricing";
import { getSettings } from "@/lib/settings";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";
import { assertWithinDeliveryRadius, OutOfRangeError } from "@/lib/orders/geofence";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const address = cleanString(body?.address, 200);
  const phone = cleanString(body?.phone, 30);
  if (!address || !phone) {
    return NextResponse.json({ error: "Address and phone required" }, { status: 400 });
  }

  // Order value comes from the catalog, never the client.
  let orderValueCents: number;
  try {
    orderValueCents = priceOrder((body?.items as { id: unknown; qty: unknown }[]) ?? []).subtotalCents;
  } catch (e) {
    const msg = e instanceof PricingError ? e.message : "Invalid cart";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const settings = await getSettings();
  if (settings.ordering_paused || !settings.delivery_enabled) {
    return NextResponse.json({ error: "Delivery is currently unavailable." }, { status: 503 });
  }
  try {
    assertDeliverable({ subtotalCents: orderValueCents }, settings.delivery);
  } catch (e) {
    if (e instanceof MinOrderError) {
      return NextResponse.json(
        { error: `Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.` },
        { status: 400 },
      );
    }
    throw e;
  }

  // Geofence: reject addresses beyond the configured radius from the restaurant.
  try {
    await assertWithinDeliveryRadius(address, settings.delivery.maxRadiusMiles);
  } catch (e) {
    if (e instanceof OutOfRangeError) {
      return NextResponse.json(
        { error: `Sorry, that address is outside our ${e.maxMiles}-mile delivery range.` },
        { status: 400 },
      );
    }
    throw e;
  }

  // Self-delivery mode: return the flat fee without calling DoorDash.
  if (settings.delivery.dispatchMode === "self") {
    const { feeCents, freeApplied } = computeDeliveryFee(
      { doordashFeeCents: 0, subtotalCents: orderValueCents },
      { ...settings.delivery, mode: "flat" },
    );
    return NextResponse.json({
      externalDeliveryId: null,
      feeCents,
      freeApplied,
      durationSeconds: null,
    });
  }

  const externalDeliveryId = `anp-${randomUUID()}`;
  try {
    const q = await quoteDelivery({
      externalDeliveryId,
      dropoffAddress: address,
      dropoffPhone: phone,
      orderValueCents,
    });
    const { feeCents, freeApplied } = computeDeliveryFee(
      { doordashFeeCents: q.feeCents, subtotalCents: orderValueCents },
      settings.delivery,
    );
    return NextResponse.json({
      externalDeliveryId,
      feeCents,
      freeApplied,
      durationSeconds: q.durationSeconds,
    });
  } catch (e) {
    console.error("[quote] Drive quote failed:", e);
    return NextResponse.json({ error: "Could not get a delivery quote" }, { status: 502 });
  }
}
