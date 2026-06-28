import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyPrintToken } from "@/lib/print/auth";

export const runtime = "nodejs";

// The bridge acks a print job. Success (no `error`) stamps kitchen_printed_at
// once (idempotent — a re-ack is a no-op). A failed attempt records the error +
// bumps the attempt counter without marking the order printed, so it stays in
// the pending queue for retry.
export async function POST(req: Request) {
  if (!verifyPrintToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { orderId?: unknown; error?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : null;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const errMsg = typeof body.error === "string" ? body.error.slice(0, 500) : null;

  if (errMsg) {
    await db
      .update(orders)
      .set({
        kitchenPrintError: errMsg,
        kitchenPrintAttempts: sql`${orders.kitchenPrintAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    return NextResponse.json({ ok: true, printed: false });
  }

  const updated = await db
    .update(orders)
    .set({ kitchenPrintedAt: new Date(), kitchenPrintError: null, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.kitchenPrintedAt)))
    .returning({ id: orders.id });

  return NextResponse.json({ ok: true, printed: true, alreadyPrinted: updated.length === 0 });
}
