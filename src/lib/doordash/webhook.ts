import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { httpsUrlOrNull } from "@/lib/orders/pricing";

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env.doordash().webhookSecret)
    .update(rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Only known DoorDash Drive delivery_status values are honored. Unknown values
// (or event_category strings) are ignored rather than written to the status column.
const KNOWN_STATUSES = new Set([
  "created",
  "confirmed",
  "enroute_to_pickup",
  "arrived_at_pickup",
  "picked_up",
  "enroute_to_dropoff",
  "arrived_at_dropoff",
  "delivered",
  "cancelled",
]);

export interface DriveEvent {
  externalDeliveryId: string | null;
  status: string | null;
  trackingUrl: string | null;
  eventName: string | null;
  eventId: string | null;
}

export function parseEvent(body: unknown): DriveEvent {
  const o = (body ?? {}) as Record<string, unknown>;
  const rawStatus = typeof o.delivery_status === "string" ? o.delivery_status : null;
  return {
    externalDeliveryId:
      typeof o.external_delivery_id === "string" ? o.external_delivery_id : null,
    status: rawStatus && KNOWN_STATUSES.has(rawStatus) ? rawStatus : null,
    trackingUrl: httpsUrlOrNull(o.tracking_url),
    eventName: typeof o.event_name === "string" ? o.event_name : null,
    eventId:
      typeof o.event_id === "string"
        ? o.event_id
        : typeof o.id === "string"
        ? o.id
        : null,
  };
}

// Maps a terminal Drive status to the order status it should set.
export const TERMINAL_STATUS: Record<string, "completed" | "cancelled"> = {
  delivered: "completed",
  cancelled: "cancelled",
};
