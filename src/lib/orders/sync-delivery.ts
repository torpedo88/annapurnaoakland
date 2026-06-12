import "server-only";
import { and, eq, ne, notInArray, like, not } from "drizzle-orm";
import { db } from "@/db";
import { orders, deliveries } from "@/db/schema";
import { getUberDelivery } from "@/lib/uber/client";
import { mapUberStatus } from "@/lib/uber/webhook";
import { canTransition } from "@/lib/orders/status";
import { httpsUrlOrNull } from "@/lib/orders/pricing";

const DELIVERY_TERMINAL = ["delivered", "canceled", "returned", "cancelled"];

/**
 * Webhook-independent status sync. Uber's delivery webhooks have proven
 * unreliable, so we poll the GET-delivery API for every active Uber delivery
 * and advance the order status ourselves. Idempotent + safe to run on a cron.
 * (DoorDash deliveries — external id "anp-…" — are skipped; they use webhooks.)
 */
export async function syncActiveUberDeliveries(): Promise<{ checked: number; updated: number }> {
  const rows = await db
    .select({
      orderId: orders.id,
      orderStatus: orders.status,
      deliveryId: deliveries.externalDeliveryId,
      deliveryStatus: deliveries.status,
    })
    .from(deliveries)
    .innerJoin(orders, eq(orders.id, deliveries.orderId))
    .where(
      and(
        eq(orders.orderType, "delivery"),
        notInArray(orders.status, ["delivered", "completed", "cancelled"]),
        notInArray(deliveries.status, DELIVERY_TERMINAL),
        not(like(deliveries.externalDeliveryId, "anp-%")), // skip DoorDash
      ),
    );

  let updated = 0;
  for (const row of rows) {
    let remote;
    try {
      remote = await getUberDelivery(row.deliveryId);
    } catch (e) {
      console.error("[sync] getUberDelivery failed for", row.deliveryId, e);
      continue;
    }
    // Update the delivery row if the courier status changed.
    if (remote.status !== row.deliveryStatus || remote.trackingUrl) {
      await db
        .update(deliveries)
        .set({
          status: remote.status,
          trackingUrl: httpsUrlOrNull(remote.trackingUrl) ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(deliveries.externalDeliveryId, row.deliveryId));
    }
    // Advance the order status if Uber's state maps forward.
    const mapped = mapUberStatus(remote.status);
    if (mapped && canTransition("delivery", row.orderStatus ?? "received", mapped, "webhook")) {
      await db.update(orders).set({ status: mapped, updatedAt: new Date() }).where(eq(orders.id, row.orderId));
      updated++;
    }
  }
  return { checked: rows.length, updated };
}
