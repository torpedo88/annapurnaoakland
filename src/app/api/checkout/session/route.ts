import { NextResponse } from "next/server";
import { toCents } from "@/lib/orders/money";
import { createPendingOrder, OrderError } from "@/lib/orders/place-order";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Returns a trusted base URL for the Stripe return_url. The Origin/Host headers
// are attacker-controllable, so only honor them when the host is one of ours;
// otherwise fall back to the configured env base. Prevents Host-header injection
// from redirecting the order accessToken to an arbitrary domain (IDOR/PII leak).
function allowedBaseUrl(origin: string | null, host: string | null): string {
  const fallback = env.baseUrl();
  let candidate: URL | null = null;
  try {
    candidate = origin ? new URL(origin) : host ? new URL(`https://${host}`) : null;
  } catch {
    candidate = null;
  }
  if (!candidate) return fallback;
  const h = candidate.host;
  const allowed =
    h === new URL(fallback).host ||
    h === "localhost:3000" ||
    // this project's Vercel deployments/previews only
    /^annapurnaoakland[a-z0-9-]*\.vercel\.app$/.test(h);
  return allowed ? candidate.origin : fallback;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const composedName = `${firstName} ${lastName}`.trim() || (typeof body.name === "string" ? body.name : "");

  let pending;
  try {
    pending = await createPendingOrder({
      name: composedName, firstName, lastName, phone: body.phone, email: body.email,
      fulfillment, address: body.address, addressUnit: body.addressUnit,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "online",
      promoCode: body.promoCode,
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout/session] pending order failed:", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }

  // Base URL for the Stripe return_url. We prefer the request's own origin so
  // the redirect stays on the deployment that served it (prod/preview/local),
  // but the Host/Origin header is attacker-controllable — an unvalidated value
  // would leak the order accessToken to an arbitrary domain. So validate the
  // host against an allowlist and fall back to env.baseUrl() otherwise.
  const base = allowedBaseUrl(req.headers.get("origin"), req.headers.get("host"));
  try {
    const session = await stripe().checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pending.totalCents,
          product_data: { name: "Annapurna order" },
        },
      }],
      payment_intent_data: { metadata: { orderId: pending.orderId } },
      metadata: {
        orderId: pending.orderId,
        externalDeliveryId: typeof body.externalDeliveryId === "string" ? body.externalDeliveryId : "",
        promoCode: pending.promoCode ?? "",
      },
      return_url: `${base}/order/${pending.orderId}?t=${pending.accessToken}&session_id={CHECKOUT_SESSION_ID}`,
    });
    return NextResponse.json({ clientSecret: session.client_secret, orderId: pending.orderId });
  } catch (e) {
    console.error("[checkout/session] stripe session failed:", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}
