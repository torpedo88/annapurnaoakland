import { NextResponse } from "next/server";
import { db } from "@/db";
import { cateringRequests } from "@/db/schema";

export const runtime = "nodejs";

// Public catering request. Lands in the admin catering inbox (status "pending").
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
  const customerEmail = str(body.customerEmail);

  if (!customerName) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!customerPhone && !customerEmail) {
    return NextResponse.json({ error: "Please enter a phone number or email." }, { status: 400 });
  }

  const partySizeRaw = Number(body.partySize);
  const partySize = Number.isFinite(partySizeRaw) && partySizeRaw > 0 ? Math.floor(partySizeRaw) : null;

  await db.insert(cateringRequests).values({
    customerName,
    customerPhone: customerPhone || null,
    customerEmail: customerEmail || null,
    eventDate: str(body.eventDate) || null,
    partySize,
    budgetRange: str(body.budgetRange) || null,
    dietaryNeeds: str(body.dietaryNeeds) || null,
    details: str(body.details) || null,
    status: "pending",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
