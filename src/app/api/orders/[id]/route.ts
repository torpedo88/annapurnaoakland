import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, deliveries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.orderId, id))
    .limit(1);

  return NextResponse.json({ order, items, delivery: delivery ?? null });
}
