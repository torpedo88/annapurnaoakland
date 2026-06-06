import { createDriveJwt } from "./jwt";
import { env } from "@/lib/env";
import type { QuoteInput, QuoteResult, AcceptResult } from "./types";

const BASE = "https://openapi.doordash.com";

export class DriveApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`DoorDash Drive API ${status}: ${body}`);
    this.name = "DriveApiError";
  }
}

async function driveFetch(path: string, init: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${createDriveJwt()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new DriveApiError(res.status, text);
  return text ? JSON.parse(text) : {};
}

export async function quoteDelivery(input: QuoteInput): Promise<QuoteResult> {
  const r = await driveFetch("/drive/v2/quotes", {
    method: "POST",
    body: JSON.stringify({
      external_delivery_id: input.externalDeliveryId,
      pickup_address: env.restaurant().pickupAddress,
      pickup_phone_number: env.restaurant().pickupPhone,
      dropoff_address: input.dropoffAddress,
      dropoff_phone_number: input.dropoffPhone,
      order_value: input.orderValueCents,
    }),
  });
  return {
    externalDeliveryId: r.external_delivery_id,
    feeCents: r.fee ?? 0,
    currency: r.currency ?? "USD",
    durationSeconds: r.duration ?? null,
  };
}

export async function acceptQuote(externalDeliveryId: string): Promise<AcceptResult> {
  const r = await driveFetch(`/drive/v2/quotes/${encodeURIComponent(externalDeliveryId)}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return {
    externalDeliveryId: r.external_delivery_id ?? externalDeliveryId,
    feeCents: r.fee ?? 0,
    trackingUrl: r.tracking_url ?? null,
    status: r.delivery_status ?? "created",
  };
}

export async function getDelivery(externalDeliveryId: string) {
  return driveFetch(`/drive/v2/deliveries/${encodeURIComponent(externalDeliveryId)}`, { method: "GET" });
}

/** Cancels a delivery. Safe to call only before pickup; DoorDash 4xx after. */
export async function cancelDelivery(externalDeliveryId: string): Promise<{ status: string }> {
  const r = await driveFetch(`/drive/v2/deliveries/${encodeURIComponent(externalDeliveryId)}/cancel`, {
    method: "PUT",
    body: JSON.stringify({}),
  });
  return { status: r.delivery_status ?? "cancelled" };
}
