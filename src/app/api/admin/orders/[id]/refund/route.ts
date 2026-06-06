import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, deliveries } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe/client";
import { cancelDelivery } from "@/lib/doordash/client";

export const runtime = "nodejs";

// Delivery statuses at/after which the driver already has the food — too late to cancel.
const PICKED_UP = new Set(["courier_picked_up", "picked_up", "enroute_to_dropoff", "arrived_at_dropoff", "en_route", "delivered"]);

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole(["owner", "manager"]); }
  catch (e) { return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 }); }

  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus !== "paid" || !order.stripePaymentIntentId) {
    return NextResponse.json({ error: "Order is not refundable" }, { status: 409 });
  }

  try {
    await stripe().refunds.create({ payment_intent: order.stripePaymentIntentId });
  } catch (e) {
    console.error("[refund] stripe refund failed:", e);
    return NextResponse.json({ error: "Refund failed" }, { status: 502 });
  }

  let cancelledDelivery = false;
  if (order.orderType === "delivery") {
    const [d] = await db.select().from(deliveries).where(eq(deliveries.orderId, id)).limit(1);
    if (d && !PICKED_UP.has(d.status ?? "")) {
      try { await cancelDelivery(d.externalDeliveryId); cancelledDelivery = true; }
      catch (e) { console.error("[refund] delivery cancel failed (continuing):", e); }
    }
  }

  await db.update(orders).set({
    paymentStatus: "refunded",
    status: cancelledDelivery ? "cancelled" : order.status,
    updatedAt: new Date(),
  }).where(eq(orders.id, id));

  return NextResponse.json({ ok: true, refunded: true, cancelledDelivery });
}
