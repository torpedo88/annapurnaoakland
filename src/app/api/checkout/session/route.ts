import { NextResponse } from "next/server";
import { toCents } from "@/lib/orders/money";
import { createPendingOrder, OrderError } from "@/lib/orders/place-order";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";

  let pending;
  try {
    pending = await createPendingOrder({
      name: body.name, phone: body.phone, email: body.email,
      fulfillment, address: body.address,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "online",
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout/session] pending order failed:", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }

  const base = env.baseUrl();
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
      },
      return_url: `${base}/order/${pending.orderId}?t=${pending.accessToken}&session_id={CHECKOUT_SESSION_ID}`,
    });
    return NextResponse.json({ clientSecret: session.client_secret, orderId: pending.orderId });
  } catch (e) {
    console.error("[checkout/session] stripe session failed:", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}
