import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, verifyWebhookAuth, parseEvent, mapDeliveryStatus } from "@/lib/doordash/webhook";
import { canTransition } from "@/lib/orders/status";

export const runtime = "nodejs";

const ack = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  const raw = await req.text();
  // Accept either the portal's Authorization-header token or an HMAC body
  // signature, so it works regardless of how the DoorDash webhook is configured.
  const authed =
    verifyWebhookAuth(req.headers.get("authorization")) ||
    verifyWebhookSignature(raw, req.headers.get("x-doordash-signature"));
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const evt = parseEvent(parsed);
  if (!evt.externalDeliveryId) return ack();

  const [existing] = await db
    .select({
      orderId: deliveries.orderId,
      lastEventId: deliveries.lastEventId,
      orderStatus: orders.status,
      orderType: orders.orderType,
    })
    .from(deliveries)
    .innerJoin(orders, eq(orders.id, deliveries.orderId))
    .where(eq(deliveries.externalDeliveryId, evt.externalDeliveryId))
    .limit(1);

  if (!existing) return ack(); // unknown delivery — ack so DoorDash stops retrying
  if (evt.eventId && existing.lastEventId === evt.eventId) return ack(); // replay/dup

  await db
    .update(deliveries)
    .set({
      status: evt.status ?? undefined,
      trackingUrl: evt.trackingUrl ?? undefined,
      lastEventId: evt.eventId ?? undefined,
      raw: parsed,
      updatedAt: new Date(),
    })
    .where(eq(deliveries.externalDeliveryId, evt.externalDeliveryId));

  const mapped = mapDeliveryStatus(evt.status);
  if (
    mapped &&
    existing.orderType === "delivery" &&
    canTransition("delivery", existing.orderStatus ?? "received", mapped, "webhook")
  ) {
    await db
      .update(orders)
      .set({ status: mapped, updatedAt: new Date() })
      .where(eq(orders.id, existing.orderId));
  }

  return ack();
}
