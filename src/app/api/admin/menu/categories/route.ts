import { NextResponse } from "next/server";
import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { menuCategories } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const rows = await db
    .select()
    .from(menuCategories)
    .orderBy(asc(sql`coalesce(${menuCategories.sortOrder}, 9999)`), asc(menuCategories.name));

  return NextResponse.json({ categories: rows });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : slugify(name);

  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : null;
  const isCatering = typeof body.isCatering === "boolean" ? body.isCatering : false;

  const [created] = await db
    .insert(menuCategories)
    .values({ name, slug, description, sortOrder, isCatering })
    .returning();

  return NextResponse.json({ category: created }, { status: 201 });
}
