import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["confirmed", "seated", "completed", "cancelled", "no_show"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["owner", "manager"]);
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

  const [existing] = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(eq(reservations.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  // Validate status when present
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !(ALLOWED_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
  }

  type PatchFields = {
    customerName?: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    date?: string;
    timeSlot?: string | null;
    partySize?: number | null;
    specialRequests?: string | null;
    status?: string;
    updatedAt: Date;
  };

  const patch: PatchFields = { updatedAt: new Date() };

  if (typeof body.customerName === "string") patch.customerName = body.customerName;
  if (typeof body.customerPhone === "string") patch.customerPhone = body.customerPhone;
  if (body.customerPhone === null) patch.customerPhone = null;
  if (typeof body.customerEmail === "string") patch.customerEmail = body.customerEmail;
  if (body.customerEmail === null) patch.customerEmail = null;
  if (typeof body.date === "string") patch.date = body.date;
  if (typeof body.timeSlot === "string") patch.timeSlot = body.timeSlot;
  if (body.timeSlot === null) patch.timeSlot = null;
  if (typeof body.partySize === "number") patch.partySize = body.partySize;
  if (body.partySize === null) patch.partySize = null;
  if (typeof body.specialRequests === "string") patch.specialRequests = body.specialRequests;
  if (body.specialRequests === null) patch.specialRequests = null;
  if (typeof body.status === "string") patch.status = body.status;

  const [updated] = await db
    .update(reservations)
    .set(patch)
    .where(eq(reservations.id, id))
    .returning();

  return NextResponse.json({ reservation: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(eq(reservations.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  await db.delete(reservations).where(eq(reservations.id, id));
  return NextResponse.json({ ok: true });
}
