import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderRefunds, deliveries } from "@/db/schema";
import { stripe } from "@/lib/stripe/client";
import { cancelDelivery } from "@/lib/doordash/client";
import { cancelUberDelivery } from "@/lib/uber/client";

export class RefundError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "RefundError";
  }
}

// Delivery statuses at/after which the driver already has the food — too late to cancel.
const PICKED_UP = new Set([
  "courier_picked_up", "picked_up", "enroute_to_dropoff",
  "arrived_at_dropoff", "en_route", "delivered",
]);

const toCents = (d: string | null | undefined) => Math.round(Number(d ?? 0) * 100);

export interface RefundRequest {
  items?: { orderItemId: string; quantity: number }[];
  amountCents?: number;
  reason?: string;
}

export interface RefundResult {
  amountCents: number;
  refundedTotalCents: number;
  isFull: boolean;
  cancelledDelivery: boolean;
  stripeRefundId: string | null;
}

type RefundItem = { orderItemId: string; itemName: string | null; quantity: number; amountCents: number };

/**
 * Processes a refund against a Stripe-paid order. Supports three modes:
 *   - itemized: refund selected line items + their proportional sales tax
 *   - amount: refund an explicit cent amount
 *   - full: refund the entire remaining balance (when neither items nor amount given)
 *
 * Server-authoritative: amounts are recomputed from the persisted order, never
 * trusted from the client. Caps at the remaining refundable balance.
 */
export async function processRefund(orderId: string, req: RefundRequest): Promise<RefundResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new RefundError("Order not found", 404);
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded") {
    throw new RefundError("Order is not refundable", 409);
  }
  if (!order.stripePaymentIntentId) {
    throw new RefundError("Only online card orders can be refunded here", 409);
  }

  const totalCents = toCents(order.total);
  const alreadyCents = toCents(order.refundedTotal);
  const remainingCents = totalCents - alreadyCents;
  if (remainingCents <= 0) throw new RefundError("Order is already fully refunded", 409);

  let amountCents: number;
  let itemsPayload: RefundItem[] | null = null;

  if (req.items && req.items.length > 0) {
    const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const byId = new Map(lines.map((l) => [l.id, l]));
    const subtotalCents = toCents(order.subtotal);
    const taxCents = toCents(order.tax);
    let selectedSubtotal = 0;
    const payload: RefundItem[] = [];
    for (const sel of req.items) {
      const line = byId.get(sel.orderItemId);
      if (!line) throw new RefundError("Unknown order item", 400);
      const qty = Math.floor(Number(sel.quantity));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (qty > (line.quantity ?? 0)) {
        throw new RefundError(`Cannot refund more ${line.itemName ?? "items"} than were ordered`, 400);
      }
      const lineCents = toCents(line.itemPrice) * qty;
      selectedSubtotal += lineCents;
      payload.push({ orderItemId: line.id, itemName: line.itemName, quantity: qty, amountCents: lineCents });
    }
    if (selectedSubtotal <= 0) throw new RefundError("Select at least one item to refund", 400);
    // Proportional sales tax on the refunded items.
    const taxRefund = subtotalCents > 0 ? Math.round((taxCents * selectedSubtotal) / subtotalCents) : 0;
    amountCents = selectedSubtotal + taxRefund;
    itemsPayload = payload;
  } else if (typeof req.amountCents === "number" && req.amountCents > 0) {
    amountCents = Math.round(req.amountCents);
  } else {
    amountCents = remainingCents; // full remaining balance
  }

  if (amountCents > remainingCents) amountCents = remainingCents;
  if (amountCents <= 0) throw new RefundError("Nothing to refund", 400);

  // Stripe refund. Idempotency key folds in the prior refunded total so retries
  // of the same request dedupe, but a genuine second refund still goes through.
  let stripeRefundId: string | null = null;
  try {
    const refund = await stripe().refunds.create(
      { payment_intent: order.stripePaymentIntentId, amount: amountCents },
      { idempotencyKey: `refund:${orderId}:${alreadyCents}:${amountCents}` },
    );
    stripeRefundId = refund.id;
  } catch (e) {
    console.error("[refund] stripe refund failed for order", orderId, e);
    throw new RefundError("Refund failed at the payment processor", 502);
  }

  const newTotalCents = alreadyCents + amountCents;
  const isFull = newTotalCents >= totalCents;

  // Cancel the delivery only on a full refund of a not-yet-picked-up delivery.
  let cancelledDelivery = false;
  if (isFull && order.orderType === "delivery") {
    const [d] = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId)).limit(1);
    if (d && !PICKED_UP.has(d.status ?? "")) {
      // DoorDash delivery ids are our-issued ("anp-…"); anything else is an Uber id.
      try {
        if (d.externalDeliveryId.startsWith("anp-")) await cancelDelivery(d.externalDeliveryId);
        else await cancelUberDelivery(d.externalDeliveryId);
        cancelledDelivery = true;
      } catch (e) { console.error("[refund] delivery cancel failed (continuing):", e); }
    }
  }

  await db.insert(orderRefunds).values({
    orderId,
    amountCents,
    reason: req.reason?.slice(0, 300) ?? null,
    items: itemsPayload,
    stripeRefundId,
  });
  await db.update(orders).set({
    refundedTotal: (newTotalCents / 100).toFixed(2),
    paymentStatus: isFull ? "refunded" : "partially_refunded",
    status: cancelledDelivery ? "cancelled" : order.status,
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId));

  return { amountCents, refundedTotalCents: newTotalCents, isFull, cancelledDelivery, stripeRefundId };
}
