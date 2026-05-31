import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries, orders } from "@/db/schema";
import { and, eq, notInArray } from "drizzle-orm";
import {
  verifyWebhookSignature,
  parseEvent,
  TERMINAL_STATUS,
} from "@/lib/doordash/webhook";

export const runtime = "nodejs";

const ack = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-doordash-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
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
      status: deliveries.status,
    })
    .from(deliveries)
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

  const orderStatus = evt.status ? TERMINAL_STATUS[evt.status] : undefined;
  if (orderStatus) {
    // Only advance from a non-terminal state — prevents replay from resurrecting
    // or flipping an already-finished order.
    await db
      .update(orders)
      .set({ status: orderStatus, updatedAt: new Date() })
      .where(
        and(eq(orders.id, existing.orderId), notInArray(orders.status, ["completed", "cancelled"])),
      );
  }

  return ack();
}
