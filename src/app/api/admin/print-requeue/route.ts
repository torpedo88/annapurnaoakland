import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

// Staff taps "Print" on the admin board (e.g. the iPad) → re-queue the order for
// the kitchen print bridge by clearing its printed stamp. The bridge picks it up
// on its next poll (~5s) and prints it on the Bluetooth printer. Staff-authed.
export async function POST(req: Request) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  let body: { orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : null;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  await db
    .update(orders)
    .set({ kitchenPrintedAt: null, kitchenPrintError: null, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  return NextResponse.json({ ok: true });
}
