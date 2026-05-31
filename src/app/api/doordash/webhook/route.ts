import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, parseEvent } from "@/lib/doordash/webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-doordash-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  const evt = parseEvent(JSON.parse(raw));
  if (!evt.externalDeliveryId) return NextResponse.json({ ok: true });

  const [row] = await db.update(deliveries)
    .set({ status: evt.status ?? undefined, trackingUrl: evt.trackingUrl ?? undefined, raw: JSON.parse(raw), updatedAt: new Date() })
    .where(eq(deliveries.externalDeliveryId, evt.externalDeliveryId))
    .returning({ orderId: deliveries.orderId });

  if (row && evt.status === "delivered") {
    await db.update(orders).set({ status: "completed" }).where(eq(orders.id, row.orderId));
  }
  return NextResponse.json({ ok: true });
}
