import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";

export const runtime = "nodejs";

// Public table-reservation request. Inserts a reservation the staff see on the
// admin board (status "confirmed" — staff adjust/cancel as needed). Mirrors the
// admin create validation; never trusts client status.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const customerName = str(body.customerName);
  const customerPhone = str(body.customerPhone);
  const date = str(body.date);

  if (!customerName) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!customerPhone) return NextResponse.json({ error: "Please enter a phone number." }, { status: 400 });
  if (!date) return NextResponse.json({ error: "Please choose a date." }, { status: 400 });

  const partySizeRaw = Number(body.partySize);
  const partySize = Number.isFinite(partySizeRaw) && partySizeRaw > 0 ? Math.floor(partySizeRaw) : null;

  await db.insert(reservations).values({
    customerName,
    customerPhone,
    customerEmail: str(body.customerEmail) || null,
    date,
    timeSlot: str(body.timeSlot) || null,
    partySize,
    status: "confirmed",
    specialRequests: str(body.specialRequests) || null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
