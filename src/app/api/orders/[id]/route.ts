import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { orders, orderItems, deliveries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function tokenMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("t");

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

  // Require the per-order access token. Wrong/missing token → 404 (don't confirm existence).
  if (!order || !tokenMatches(token, order.accessToken)) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.orderId, id))
    .limit(1);

  // Never leak the access token back to the client.
  const { accessToken: _omit, ...safeOrder } = order;
  void _omit;
  return NextResponse.json({ order: safeOrder, items, delivery: delivery ?? null });
}
