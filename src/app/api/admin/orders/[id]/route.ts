import { NextResponse, after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";
import { canTransition, type Fulfillment } from "@/lib/orders/status";
import { getSettings } from "@/lib/settings";
import { sendOrderStatusUpdate } from "@/lib/notify";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const to = typeof body.status === "string" ? body.status : "";

  const [[order], settings] = await Promise.all([
    db
      .select({ status: orders.status, orderType: orders.orderType })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1),
    getSettings(),
  ]);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const fulfillment: Fulfillment = order.orderType === "delivery" ? "delivery" : "pickup";
  const selfDelivery = settings.delivery.dispatchMode === "self";
  if (!canTransition(fulfillment, order.status ?? "received", to, "staff", selfDelivery)) {
    return NextResponse.json({ error: "Invalid status change" }, { status: 409 });
  }

  await db.update(orders).set({ status: to, updatedAt: new Date() }).where(eq(orders.id, id));

  // Email the customer about the status change (best-effort, after response).
  after(() => sendOrderStatusUpdate(id, to).catch((e) => console.error("[notify] status PATCH:", e)));

  return NextResponse.json({ ok: true, status: to });
}
