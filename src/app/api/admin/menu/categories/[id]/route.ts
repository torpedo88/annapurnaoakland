import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuCategories, menuItems } from "@/db/schema";
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
  if (typeof body.description === "string") patch.description = body.description.trim() || null;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
  if (body.sortOrder === null) patch.sortOrder = null;
  if (typeof body.isCatering === "boolean") patch.isCatering = body.isCatering;

  const [updated] = await db
    .update(menuCategories)
    .set(patch)
    .where(eq(menuCategories.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  return NextResponse.json({ category: updated });
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

  const [hasItem] = await db
    .select({ id: menuItems.id })
    .from(menuItems)
    .where(eq(menuItems.categoryId, id))
    .limit(1);

  if (hasItem) {
    return NextResponse.json({ error: "Category has items" }, { status: 409 });
  }

  const [deleted] = await db
    .delete(menuCategories)
    .where(eq(menuCategories.id, id))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
