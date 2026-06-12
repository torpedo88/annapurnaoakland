import "server-only";
import { env } from "@/lib/env";

// Uber Direct API (white-label delivery). Mirrors the DoorDash Drive client:
//   OAuth token -> create quote -> create delivery -> cancel.
// Docs: https://developer.uber.com/docs/deliveries/api-reference/daas

const AUTH_URL = "https://auth.uber.com/oauth/v2/token";
const API = "https://api.uber.com/v1/customers";

export class UberApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Uber Direct API ${status}: ${body}`);
    this.name = "UberApiError";
  }
}

// Token is valid for ~30 days; cache per server instance, refresh a minute early.
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.exp > now + 60_000) return tokenCache.token;
  const { clientId, clientSecret } = env.uber();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "eats.deliveries",
  });
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new UberApiError(res.status, text);
  const j = JSON.parse(text) as { access_token: string; expires_in?: number };
  tokenCache = { token: j.access_token, exp: now + (j.expires_in ?? 2_592_000) * 1000 };
  return tokenCache.token;
}

async function uberFetch(path: string, init: RequestInit) {
  const token = await getToken();
  const res = await fetch(`${API}/${env.uber().customerId}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new UberApiError(res.status, text);
  return text ? JSON.parse(text) : {};
}

export interface UberQuote {
  quoteId: string;
  feeCents: number;
  durationSeconds: number | null;
}

/** Get a delivery quote (fee + ETA). The quote_id is consumed by createUberDelivery. */
export async function createUberQuote(input: {
  dropoffAddress: string;
  dropoffPhone: string;
  orderValueCents: number;
}): Promise<UberQuote> {
  const r = await uberFetch(`/delivery_quotes`, {
    method: "POST",
    body: JSON.stringify({
      pickup_address: env.restaurant().pickupAddress,
      dropoff_address: input.dropoffAddress,
      pickup_phone_number: env.restaurant().pickupPhone,
      dropoff_phone_number: input.dropoffPhone,
      manifest_total_value: input.orderValueCents,
    }),
  });
  return {
    quoteId: r.id,
    feeCents: r.fee ?? 0,
    durationSeconds: r.duration ?? r.dropoff_eta ?? null,
  };
}

export interface UberDelivery {
  id: string;
  status: string;
  trackingUrl: string | null;
  feeCents: number;
}

/** Dispatch a courier for a quote. Returns the delivery id + tracking url. */
export async function createUberDelivery(input: {
  quoteId: string;
  dropoffName: string;
  dropoffAddress: string;
  dropoffPhone: string;
  items: { name: string; quantity: number }[];
  orderValueCents: number;
  tipCents?: number;
  externalId?: string;
}): Promise<UberDelivery> {
  const r = await uberFetch(`/deliveries`, {
    method: "POST",
    body: JSON.stringify({
      quote_id: input.quoteId,
      pickup_name: "Annapurna Restaurant & Bar",
      pickup_address: env.restaurant().pickupAddress,
      pickup_phone_number: env.restaurant().pickupPhone,
      dropoff_name: input.dropoffName || "Customer",
      dropoff_address: input.dropoffAddress,
      dropoff_phone_number: input.dropoffPhone,
      manifest_items: input.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      manifest_total_value: input.orderValueCents,
      ...(input.tipCents ? { tip: input.tipCents } : {}),
      ...(input.externalId ? { external_id: input.externalId } : {}),
    }),
  });
  return {
    id: r.id,
    status: r.status ?? "pending",
    trackingUrl: r.tracking_url ?? null,
    feeCents: r.fee ?? 0,
  };
}

/** Cancel a delivery (only valid before the courier picks up). */
export async function cancelUberDelivery(deliveryId: string): Promise<void> {
  await uberFetch(`/deliveries/${encodeURIComponent(deliveryId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
