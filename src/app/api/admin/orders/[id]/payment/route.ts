import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const PAYMENT_STATUSES = new Set(["unpaid", "paid", "refunded"]);
const PAYMENT_METHODS = new Set(["cash", "card", "online"]);

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

  const set: { paymentStatus?: string; paymentMethod?: string | null; updatedAt: Date } = { updatedAt: new Date() };
  if ("payment_status" in body) {
    if (!PAYMENT_STATUSES.has(String(body.payment_status))) {
      return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 });
    }
    set.paymentStatus = String(body.payment_status);
  }
  if ("payment_method" in body) {
    const m = body.payment_method;
    if (m !== null && !PAYMENT_METHODS.has(String(m))) {
      return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 });
    }
    set.paymentMethod = m === null ? null : String(m);
  }

  const [updated] = await db.update(orders).set(set).where(eq(orders.id, id)).returning({ id: orders.id });
  if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
