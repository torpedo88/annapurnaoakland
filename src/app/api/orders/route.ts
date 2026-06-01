import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries } from "@/db/schema";
import { createOrder } from "@/lib/orders/create-order";
import { acceptQuote } from "@/lib/doordash/client";
import { toCents } from "@/lib/orders/money";
import {
  priceOrder,
  validateContact,
  cleanString,
  isValidExternalDeliveryId,
  httpsUrlOrNull,
  PricingError,
} from "@/lib/orders/pricing";
import { getSettings } from "@/lib/settings";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";
  const items = (body?.items as unknown[]) ?? [];
  const tipCents = toCents(Number(body?.tip) || 0);

  const settings = await getSettings();
  if (settings.ordering_paused) {
    return NextResponse.json({ error: "Online ordering is paused. Please call the restaurant." }, { status: 503 });
  }
  if (fulfillment === "delivery" && !settings.delivery_enabled) {
    return NextResponse.json({ error: "Delivery is currently unavailable." }, { status: 503 });
  }
  if (fulfillment === "pickup" && !settings.pickup_enabled) {
    return NextResponse.json({ error: "Pickup is currently unavailable." }, { status: 503 });
  }

  // 1) Validate contact + items BEFORE any external dispatch (no driver for a bad order).
  try {
    validateContact(body as { name: unknown; phone: unknown; email: unknown });
    priceOrder(items as { id: unknown; qty: unknown }[], { tipCents });
    if (fulfillment === "delivery" && !cleanString(body?.address, 200)) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }
  } catch (e) {
    const msg = e instanceof PricingError ? e.message : "Invalid order";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 2) For delivery, accept the server-issued quote to get the authoritative fee.
  let accepted: Awaited<ReturnType<typeof acceptQuote>> | null = null;
  let deliveryFeeCents = 0;
  if (fulfillment === "delivery") {
    if (!isValidExternalDeliveryId(body?.externalDeliveryId)) {
      return NextResponse.json({ error: "Invalid delivery reference" }, { status: 400 });
    }
    try {
      accepted = await acceptQuote(body.externalDeliveryId as string);
      const subtotalCents = priceOrder(items as { id: unknown; qty: unknown }[]).subtotalCents;
      try {
        assertDeliverable({ subtotalCents }, settings.delivery);
      } catch (e) {
        if (e instanceof MinOrderError) {
          return NextResponse.json(
            { error: `Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.` },
            { status: 400 },
          );
        }
        throw e;
      }
      deliveryFeeCents = computeDeliveryFee(
        { doordashFeeCents: accepted.feeCents ?? 0, subtotalCents },
        settings.delivery,
      ).feeCents;
    } catch (e) {
      console.error("[orders] Drive acceptQuote failed:", e);
      return NextResponse.json(
        { error: "Could not arrange delivery right now. Please try again." },
        { status: 502 },
      );
    }
  }

  // 3) Persist the order (money recomputed server-side again, incl. the real fee).
  let result: { orderId: string; accessToken: string };
  try {
    result = await createOrder({
      name: body.name,
      phone: body.phone,
      email: body.email,
      fulfillment,
      address: body.address,
      items: items as { id: unknown; qty: unknown }[],
      tipCents,
      deliveryFeeCents,
    });
  } catch (e) {
    // A driver may have been dispatched in step 2 — surface for manual cancel.
    if (accepted)
      console.error(
        "[orders] persist failed AFTER dispatch; orphaned delivery:",
        accepted.externalDeliveryId,
        e,
      );
    else console.error("[orders] persist failed:", e);
    const msg = e instanceof PricingError ? e.message : "Could not place order";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 4) Record the delivery row.
  if (accepted) {
    try {
      await db.insert(deliveries).values({
        orderId: result.orderId,
        externalDeliveryId: accepted.externalDeliveryId,
        status: accepted.status,
        feeCents: accepted.feeCents,
        trackingUrl: httpsUrlOrNull(accepted.trackingUrl),
        dropoffAddress: cleanString(body.address, 200),
      });
    } catch (e) {
      console.error("[orders] delivery row insert failed for order", result.orderId, e);
      // Order is saved; tracking will populate via webhook. Don't fail the request.
    }
  }

  return NextResponse.json({ orderId: result.orderId, accessToken: result.accessToken });
}
