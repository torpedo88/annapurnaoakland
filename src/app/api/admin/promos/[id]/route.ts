import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { promos } from "@/db/schema";
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
    .select({ id: promos.id })
    .from(promos)
    .where(eq(promos.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Promo not found" }, { status: 404 });
  }

  // Build patch object — only update fields explicitly provided
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.code === "string" && body.code.trim()) {
    patch.code = body.code.trim().toUpperCase();
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    patch.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }
  if (typeof body.discountType === "string") {
    patch.discountType = body.discountType === "fixed" ? "fixed" : "percent";
  }
  if (body.discountValue !== undefined && body.discountValue !== "") {
    const raw = Number(body.discountValue);
    if (!isNaN(raw)) {
      const type =
        typeof patch.discountType === "string"
          ? patch.discountType
          : body.discountType;
      patch.discountValue =
        type === "percent"
          ? String(Math.min(100, Math.max(0, raw)))
          : String(raw);
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, "minOrder")) {
    patch.minOrder =
      body.minOrder !== "" && body.minOrder !== null && body.minOrder !== undefined
        ? String(Number(body.minOrder))
        : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "maxRedemptions")) {
    patch.maxRedemptions =
      body.maxRedemptions !== "" && body.maxRedemptions !== null && body.maxRedemptions !== undefined
        ? Number(body.maxRedemptions)
        : null;
  }
  if (typeof body.isActive === "boolean") {
    patch.isActive = body.isActive;
  }
  if (Object.prototype.hasOwnProperty.call(body, "startsAt")) {
    patch.startsAt =
      typeof body.startsAt === "string" && body.startsAt ? new Date(body.startsAt) : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "expiresAt")) {
    patch.expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt ? new Date(body.expiresAt) : null;
  }

  try {
    const [updated] = await db
      .update(promos)
      .set(patch)
      .where(eq(promos.id, id))
      .returning();

    return NextResponse.json({ promo: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("promos_code_unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
    }
    console.error("[admin promos PATCH]", e);
    return NextResponse.json({ error: "Could not update promo" }, { status: 500 });
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
    .select({ id: promos.id })
    .from(promos)
    .where(eq(promos.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Promo not found" }, { status: 404 });
  }

  await db.delete(promos).where(eq(promos.id, id));
  return NextResponse.json({ ok: true });
}
