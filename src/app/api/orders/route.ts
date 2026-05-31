import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries } from "@/db/schema";
import { createOrder } from "@/lib/orders/create-order";
import { acceptQuote } from "@/lib/doordash/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.name || !body?.phone) return NextResponse.json({ error: "name and phone required" }, { status: 400 });
  if (body.fulfillment === "delivery" && !body.address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const { orderId } = await createOrder(body);

  if (body.fulfillment === "delivery" && body.externalDeliveryId) {
    try {
      const d = await acceptQuote(body.externalDeliveryId);
      await db.insert(deliveries).values({
        orderId,
        externalDeliveryId: d.externalDeliveryId,
        status: d.status,
        feeCents: d.feeCents,
        trackingUrl: d.trackingUrl,
        dropoffAddress: body.address,
      });
    } catch (e) {
      return NextResponse.json({ orderId, deliveryError: e instanceof Error ? e.message : "dispatch failed" });
    }
  }
  return NextResponse.json({ orderId });
}
