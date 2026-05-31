import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env.doordash().webhookSecret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface DriveEvent {
  externalDeliveryId: string | null;
  status: string | null;
  trackingUrl: string | null;
  eventName: string | null;
}
export function parseEvent(body: unknown): DriveEvent {
  const o = (body ?? {}) as Record<string, unknown>;
  return {
    externalDeliveryId: (o.external_delivery_id as string) ?? null,
    status: (o.delivery_status as string) ?? (o.event_category as string) ?? null,
    trackingUrl: (o.tracking_url as string) ?? null,
    eventName: (o.event_name as string) ?? null,
  };
}
