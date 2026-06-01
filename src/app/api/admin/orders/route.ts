import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, deliveries } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";
import { toCents } from "@/lib/orders/money";
import { placeOrder, OrderError } from "@/lib/orders/place-order";

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

  // Strip accessToken — it's the per-order IDOR capability token for public
  // order tracking and must never leave the server, even to authed staff.
  const result = rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, ...o } = row;
    return {
      ...o,
      items: items.filter((i) => i.orderId === o.id),
      delivery: dels.find((d) => d.orderId === o.id) ?? null,
    };
  });

  return NextResponse.json({ orders: result });
}

export async function POST(req: Request) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";
  const payMethodRaw = body?.payment_method;
  const paymentMethod =
    payMethodRaw === "cash" || payMethodRaw === "card" || payMethodRaw === "online" ? payMethodRaw : null;
  const paymentStatus: "paid" | "unpaid" = body?.payment_status === "paid" ? "paid" : "unpaid";

  try {
    const { orderId } = await placeOrder({
      name: body.name, phone: body.phone, email: body.email,
      fulfillment,
      address: body.address,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "phone",
      paymentStatus,
      paymentMethod,
    });
    return NextResponse.json({ orderId });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[admin orders] unexpected:", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
