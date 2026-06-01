import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, deliveries } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const LANES: Record<string, string[]> = {
  active: ["received", "preparing", "ready", "courier_picked_up", "en_route"],
  completed: ["completed", "delivered"],
  cancelled: ["cancelled"],
};

export async function GET(req: Request) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const lane = new URL(req.url).searchParams.get("lane") ?? "active";
  const statuses = LANES[lane] ?? LANES.active ?? [];

  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, statuses))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const ids = rows.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];
  const dels = ids.length
    ? await db.select().from(deliveries).where(inArray(deliveries.orderId, ids))
    : [];

  const result = rows.map((o) => ({
    ...o,
    items: items.filter((i) => i.orderId === o.id),
    delivery: dels.find((d) => d.orderId === o.id) ?? null,
  }));

  return NextResponse.json({ orders: result });
}
