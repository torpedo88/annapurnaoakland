import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { timeSlots } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const rows = await db
    .select()
    .from(timeSlots)
    .orderBy(asc(timeSlots.dayOfWeek), asc(timeSlots.time));

  return NextResponse.json({ timeSlots: rows });
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

  // dayOfWeek — integer 0..6
  const dayOfWeek = Number(body.dayOfWeek);
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: "dayOfWeek must be an integer between 0 and 6" }, { status: 400 });
  }

  // time — required, e.g. "18:00"
  const time = typeof body.time === "string" ? body.time.trim() : "";
  if (!time) {
    return NextResponse.json({ error: "time is required" }, { status: 400 });
  }

  // maxCapacity — integer >= 1
  const maxCapacity = Number(body.maxCapacity);
  if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
    return NextResponse.json({ error: "maxCapacity must be an integer of at least 1" }, { status: 400 });
  }

  const isActive = body.isActive !== false && body.isActive !== "false";

  try {
    const [row] = await db
      .insert(timeSlots)
      .values({
        dayOfWeek,
        time,
        maxCapacity,
        isActive,
      })
      .returning();

    return NextResponse.json({ timeSlot: row }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("time_slots_day_of_week_time_unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slot already exists" }, { status: 409 });
    }
    console.error("[admin time-slots POST]", e);
    return NextResponse.json({ error: "Could not create time slot" }, { status: 500 });
  }
}
