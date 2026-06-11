import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { timeSlots } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    .select({ id: timeSlots.id })
    .from(timeSlots)
    .where(eq(timeSlots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Time slot not found" }, { status: 404 });
  }

  // Build patch object — only update fields explicitly provided
  const patch: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(body, "dayOfWeek")) {
    const dayOfWeek = Number(body.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: "dayOfWeek must be an integer between 0 and 6" }, { status: 400 });
    }
    patch.dayOfWeek = dayOfWeek;
  }

  if (Object.prototype.hasOwnProperty.call(body, "time")) {
    const time = typeof body.time === "string" ? body.time.trim() : "";
    if (!time) {
      return NextResponse.json({ error: "time is required" }, { status: 400 });
    }
    patch.time = time;
  }

  if (Object.prototype.hasOwnProperty.call(body, "maxCapacity")) {
    const maxCapacity = Number(body.maxCapacity);
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
      return NextResponse.json({ error: "maxCapacity must be an integer of at least 1" }, { status: 400 });
    }
    patch.maxCapacity = maxCapacity;
  }

  if (typeof body.isActive === "boolean") {
    patch.isActive = body.isActive;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(timeSlots)
      .set(patch)
      .where(eq(timeSlots.id, id))
      .returning();

    return NextResponse.json({ timeSlot: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("time_slots_day_of_week_time_unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slot already exists" }, { status: 409 });
    }
    console.error("[admin time-slots PATCH]", e);
    return NextResponse.json({ error: "Could not update time slot" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: timeSlots.id })
    .from(timeSlots)
    .where(eq(timeSlots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Time slot not found" }, { status: 404 });
  }

  await db.delete(timeSlots).where(eq(timeSlots.id, id));
  return NextResponse.json({ ok: true });
}
