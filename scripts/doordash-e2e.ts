/**
 * End-to-end Drive dispatch test (sandbox).
 * quote -> placeOrder (dispatch + persist) -> poll DB for webhook-driven status.
 * DoorDash sends webhooks to the PROD endpoint, which updates the shared DB;
 * we poll that same DB here. Run:
 *   NODE_OPTIONS="--require $(pwd)/scripts/_server-only-shim.cjs" \
 *   npx tsx --env-file=.env.local scripts/doordash-e2e.ts
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, deliveries } from "@/db/schema";
import { quoteDelivery } from "@/lib/doordash/client";
import { placeOrder } from "@/lib/orders/place-order";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const externalDeliveryId = `anp-${randomUUID()}`;
  const address = process.env.DROPOFF_ADDRESS ?? "1 Frank H Ogawa Plaza, Oakland, CA 94612";
  const phone = process.env.DROPOFF_PHONE ?? "+15105550123";
  const items = [{ id: "chicken-dish-chicken-curry", qty: 2 }];

  console.log("→ quoting…");
  const q = await quoteDelivery({ externalDeliveryId, dropoffAddress: address, dropoffPhone: phone, orderValueCents: 3000 });
  console.log("  fee:", q.feeCents);

  console.log("→ placing delivery order (dispatch + persist)…");
  const { orderId } = await placeOrder({
    name: "E2E Test", phone, email: "e2e@example.com",
    fulfillment: "delivery", address, items,
    tipCents: 0, externalDeliveryId, source: "online",
  });
  console.log("  orderId:", orderId, "\n  externalDeliveryId:", externalDeliveryId);

  console.log("\n→ polling DB for webhook-driven status (90s)…");
  let last = "";
  for (let i = 0; i < 18; i++) {
    await sleep(5000);
    const [o] = await db.select({ s: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
    const [d] = await db.select({ s: deliveries.status }).from(deliveries).where(eq(deliveries.orderId, orderId)).limit(1);
    const now = `order=${o?.s ?? "?"} delivery=${d?.s ?? "?"}`;
    if (now !== last) { console.log(`  [${(i + 1) * 5}s] ${now}`); last = now; }
  }
  console.log("\n(done — leave running longer if statuses are still early; sandbox can take a few min)");
  process.exit(0);
})().catch((e) => { console.error("✗ e2e failed:", e?.message ?? e); process.exit(1); });
