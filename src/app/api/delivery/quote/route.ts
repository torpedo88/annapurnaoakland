import { NextResponse } from "next/server";
import { quoteDelivery } from "@/lib/doordash/client";
import { toCents } from "@/lib/orders/money";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { address, phone, subtotal } = await req.json();
  if (!address || !phone) return NextResponse.json({ error: "address and phone required" }, { status: 400 });
  const externalDeliveryId = `anp-${randomUUID()}`;
  try {
    const q = await quoteDelivery({
      externalDeliveryId, dropoffAddress: address, dropoffPhone: phone,
      orderValueCents: toCents(Number(subtotal) || 0),
    });
    return NextResponse.json({ externalDeliveryId, feeCents: q.feeCents, durationSeconds: q.durationSeconds });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "quote failed" }, { status: 502 });
  }
}
