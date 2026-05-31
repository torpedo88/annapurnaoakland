import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { quoteDelivery } from "@/lib/doordash/client";
import { priceOrder, cleanString, PricingError } from "@/lib/orders/pricing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const address = cleanString(body?.address, 200);
  const phone = cleanString(body?.phone, 30);
  if (!address || !phone) {
    return NextResponse.json({ error: "Address and phone required" }, { status: 400 });
  }

  // Order value comes from the catalog, never the client.
  let orderValueCents: number;
  try {
    orderValueCents = priceOrder((body?.items as { id: unknown; qty: unknown }[]) ?? []).subtotalCents;
  } catch (e) {
    const msg = e instanceof PricingError ? e.message : "Invalid cart";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const externalDeliveryId = `anp-${randomUUID()}`;
  try {
    const q = await quoteDelivery({
      externalDeliveryId,
      dropoffAddress: address,
      dropoffPhone: phone,
      orderValueCents,
    });
    return NextResponse.json({
      externalDeliveryId,
      feeCents: q.feeCents,
      durationSeconds: q.durationSeconds,
    });
  } catch (e) {
    console.error("[quote] Drive quote failed:", e);
    return NextResponse.json({ error: "Could not get a delivery quote" }, { status: 502 });
  }
}
