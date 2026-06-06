import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { constructStripeEvent } from "@/lib/stripe/webhook";
import { dispatchPaidOrder } from "@/lib/orders/place-order";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = constructStripeEvent(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    console.error("[stripe webhook] bad signature:", (e as Error).message);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await dispatchPaidOrder({
            orderId,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            checkoutSessionId: session.id,
            externalDeliveryId: session.metadata?.externalDeliveryId || undefined,
          });
        }
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (pi) {
        await db.update(orders).set({ paymentStatus: "refunded", updatedAt: new Date() })
          .where(eq(orders.stripePaymentIntentId, pi));
      }
    }
  } catch (e) {
    console.error("[stripe webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 }); // Stripe retries
  }

  return NextResponse.json({ received: true });
}
