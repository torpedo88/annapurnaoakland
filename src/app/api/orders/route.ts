import { NextResponse } from "next/server";
import { toCents } from "@/lib/orders/money";
import { placeOrder, OrderError } from "@/lib/orders/place-order";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";
  try {
    const { orderId, accessToken } = await placeOrder({
      name: body.name, phone: body.phone, email: body.email,
      fulfillment,
      address: body.address, addressUnit: body.addressUnit,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "online",
    });
    return NextResponse.json({ orderId, accessToken });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[orders] unexpected:", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
