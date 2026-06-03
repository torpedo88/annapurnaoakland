import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["confirmed", "seated", "completed", "cancelled", "no_show"] as const;

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const rows = await db
    .select()
    .from(reservations)
    .orderBy(desc(reservations.date), desc(reservations.createdAt));

  return NextResponse.json({ reservations: rows });
}

export async function POST(req: Request) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";

  if (!customerName) return NextResponse.json({ error: "customerName is required" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const statusRaw = typeof body.status === "string" ? body.status : "confirmed";
  const status = (ALLOWED_STATUSES as readonly string[]).includes(statusRaw) ? statusRaw : "confirmed";

  const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot : null;
  const partySize = typeof body.partySize === "number" ? body.partySize : null;

  const [row] = await db
    .insert(reservations)
    .values({
      customerName,
      customerPhone: typeof body.customerPhone === "string" ? body.customerPhone : null,
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : null,
      date,
      timeSlot,
      partySize,
      status,
      specialRequests: typeof body.specialRequests === "string" ? body.specialRequests : null,
    })
    .returning();

  return NextResponse.json({ reservation: row }, { status: 201 });
}
