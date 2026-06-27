import { NextResponse } from "next/server";
import { and, asc, eq, isNull, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { verifyPrintToken } from "@/lib/print/auth";
import { serializePrintOrder } from "@/lib/print/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cap a single poll so a cold bridge can't pull an unbounded backlog at once.
const MAX = 50;

// The Android print bridge polls this for new kitchen tickets. Returns received
// orders not yet printed (kitchen_printed_at IS NULL), oldest first. Every new
// order needs a ticket regardless of payment/source, matching the existing
// window.print board behavior.
export async function GET(req: Request) {
  if (!verifyPrintToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.status, "received"), isNull(orders.kitchenPrintedAt)))
    .orderBy(asc(orders.createdAt))
    .limit(MAX);

  const ids = rows.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];

  const result = rows.map((o) => serializePrintOrder(o, items.filter((i) => i.orderId === o.id)));

  return NextResponse.json({ orders: result });
}
