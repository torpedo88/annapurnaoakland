import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth/session";
import { processRefund, RefundError } from "@/lib/orders/refund";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole(["owner", "manager"]); }
  catch (e) { return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 }); }

  const { id } = await params;

  // Body is optional: empty = refund the full remaining balance.
  let body: { items?: { orderItemId: string; quantity: number }[]; amountCents?: number; reason?: string } = {};
  try { body = await req.json(); } catch { /* full refund */ }

  try {
    const result = await processRefund(id, {
      items: Array.isArray(body.items) ? body.items : undefined,
      amountCents: typeof body.amountCents === "number" ? body.amountCents : undefined,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof RefundError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[refund] unexpected:", e);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
