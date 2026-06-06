import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { promos } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const rows = await db.select().from(promos).orderBy(desc(promos.createdAt));
  return NextResponse.json({ promos: rows });
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

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const discountType =
    body.discountType === "fixed" ? "fixed" : "percent";

  const rawValue = Number(body.discountValue);
  if (isNaN(rawValue) || rawValue < 0) {
    return NextResponse.json({ error: "discountValue must be a non-negative number" }, { status: 400 });
  }
  const discountValue =
    discountType === "percent"
      ? String(Math.min(100, Math.max(0, rawValue)))
      : String(rawValue);

  const minOrder =
    body.minOrder !== undefined && body.minOrder !== "" && body.minOrder !== null
      ? String(Number(body.minOrder))
      : null;

  const maxRedemptions =
    body.maxRedemptions !== undefined && body.maxRedemptions !== "" && body.maxRedemptions !== null
      ? Number(body.maxRedemptions)
      : null;

  const startsAt =
    typeof body.startsAt === "string" && body.startsAt
      ? new Date(body.startsAt)
      : null;

  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt
      ? new Date(body.expiresAt)
      : null;

  const isActive = body.isActive !== false && body.isActive !== "false";

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  try {
    const [row] = await db
      .insert(promos)
      .values({
        code,
        description,
        discountType,
        discountValue,
        minOrder,
        maxRedemptions,
        isActive,
        startsAt,
        expiresAt,
      })
      .returning();

    return NextResponse.json({ promo: row }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("promos_code_unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
    }
    console.error("[admin promos POST]", e);
    return NextResponse.json({ error: "Could not create promo" }, { status: 500 });
  }
}
