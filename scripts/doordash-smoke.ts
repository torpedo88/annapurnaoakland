/**
 * Sandbox smoke test for DoorDash Drive dispatch.
 * Quote -> Accept (dispatch) -> Get delivery. Prints only non-secret fields.
 * Run: npx tsx --env-file=.env.local scripts/doordash-smoke.ts [--accept]
 */
import { randomUUID } from "node:crypto";
import { quoteDelivery, acceptQuote, getDelivery } from "@/lib/doordash/client";

(async () => {
  const doAccept = process.argv.includes("--accept");
  const externalDeliveryId = `anp-smoke-${randomUUID()}`;
  const dropoffAddress = "1 Frank H Ogawa Plaza, Oakland, CA 94612";
  const dropoffPhone = "+15105550123";
  const orderValueCents = 2500;

  console.log("→ quoting delivery…", { externalDeliveryId });
  const q = await quoteDelivery({ externalDeliveryId, dropoffAddress, dropoffPhone, orderValueCents });
  console.log("✓ quote:", { feeCents: q.feeCents, currency: q.currency, durationSeconds: q.durationSeconds });

  if (!doAccept) {
    console.log("\n(quote only — re-run with --accept to dispatch a simulated driver)");
    process.exit(0);
  }

  console.log("\n→ accepting (dispatching driver)…");
  const a = await acceptQuote(externalDeliveryId);
  console.log("✓ accepted:", { status: a.status, feeCents: a.feeCents, trackingUrl: a.trackingUrl });

  console.log("\n→ fetching delivery status…");
  const d = await getDelivery(externalDeliveryId);
  console.log("✓ delivery:", { status: d.delivery_status, dasher: d.dasher_status ?? null, tracking: d.tracking_url ?? null });
  process.exit(0);
})().catch((e) => {
  console.error("✗ smoke test failed:", e?.message ?? e);
  process.exit(1);
});
