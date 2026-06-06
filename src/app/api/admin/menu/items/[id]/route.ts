import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
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

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.slug === "string") patch.slug = body.slug.trim();
  if (typeof body.categoryId === "string") patch.categoryId = body.categoryId.trim();
  if (typeof body.description === "string") patch.description = body.description.trim() || null;
  if (typeof body.imageUrl === "string") patch.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
  if (body.sortOrder === null) patch.sortOrder = null;
  if (typeof body.isAvailable === "boolean") patch.isAvailable = body.isAvailable;
  if (typeof body.hasSpiceOptions === "boolean") patch.hasSpiceOptions = body.hasSpiceOptions;
  if (typeof body.hasRiceChoice === "boolean") patch.hasRiceChoice = body.hasRiceChoice;
  if (typeof body.isVegetarian === "boolean") patch.isVegetarian = body.isVegetarian;
  if (typeof body.isVeganOption === "boolean") patch.isVeganOption = body.isVeganOption;
  if (typeof body.isGlutenFree === "boolean") patch.isGlutenFree = body.isGlutenFree;

  if (body.price !== undefined) {
    const p = parseFloat(String(body.price));
    if (!isNaN(p) && p >= 0) patch.price = p.toFixed(2);
  }
  if (body.halfTrayPrice !== undefined) {
    if (body.halfTrayPrice === null || body.halfTrayPrice === "") {
      patch.halfTrayPrice = null;
    } else {
      const p = parseFloat(String(body.halfTrayPrice));
      if (!isNaN(p) && p >= 0) patch.halfTrayPrice = p.toFixed(2);
    }
  }
  if (body.fullTrayPrice !== undefined) {
    if (body.fullTrayPrice === null || body.fullTrayPrice === "") {
      patch.fullTrayPrice = null;
    } else {
      const p = parseFloat(String(body.fullTrayPrice));
      if (!isNaN(p) && p >= 0) patch.fullTrayPrice = p.toFixed(2);
    }
  }

  const [updated] = await db
    .update(menuItems)
    .set(patch)
    .where(eq(menuItems.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  return NextResponse.json({ item: updated });
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

  const [deleted] = await db
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
