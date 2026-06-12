import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { httpsUrlOrNull } from "@/lib/orders/pricing";

// Uber Direct signs webhooks with X-Uber-Signature = hex HMAC-SHA256(rawBody)
// keyed by the webhook signing key (configured in the Uber dashboard). We accept
// either UBER_SIGNING_KEY or the client secret as the key, depending on setup.
export function verifyUberSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const { signingKey, clientSecret } = env.uber();
  const key = signingKey || clientSecret;
  if (!key) return false;
  const expected = createHmac("sha256", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

// Known Uber Direct delivery statuses. Unknown values are ignored.
const KNOWN_STATUSES = new Set([
  "pending",
  "pickup",
  "pickup_complete",
  "dropoff",
  "delivered",
  "canceled",
  "returned",
]);

export interface UberEvent {
  deliveryId: string | null;
  status: string | null;
  trackingUrl: string | null;
  eventId: string | null;
}

export function parseUberEvent(body: unknown): UberEvent {
  const o = (body ?? {}) as Record<string, unknown>;
  const data = (o.data ?? {}) as Record<string, unknown>;
  const rawStatus = typeof data.status === "string" ? data.status : typeof o.status === "string" ? o.status : null;
  const deliveryId =
    typeof o.delivery_id === "string" ? o.delivery_id :
    typeof data.id === "string" ? data.id : null;
  return {
    deliveryId,
    status: rawStatus && KNOWN_STATUSES.has(rawStatus) ? rawStatus : null,
    trackingUrl: httpsUrlOrNull(data.tracking_url ?? o.tracking_url),
    eventId:
      typeof o.event_id === "string" ? o.event_id :
      typeof o.id === "string" ? o.id : null,
  };
}

// Maps an Uber delivery status to the order status it should drive.
// Early statuses (pending/pickup) map to null (no order-status change).
const DELIVERY_TO_ORDER: Record<string, string> = {
  pickup_complete: "courier_picked_up",
  dropoff: "en_route",
  delivered: "delivered",
  canceled: "cancelled",
  returned: "cancelled",
};

export function mapUberStatus(status: string | null): string | null {
  if (!status) return null;
  return DELIVERY_TO_ORDER[status] ?? null;
}
