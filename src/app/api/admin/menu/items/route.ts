import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
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

  const rows = await db.select().from(menuItems).orderBy(asc(menuItems.sortOrder), asc(menuItems.name));

  return NextResponse.json({ items: rows });
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

  const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  if (!categoryId) return NextResponse.json({ error: "categoryId is required" }, { status: 400 });

  const priceRaw = typeof body.price === "string" ? body.price : String(body.price ?? "");
  const price = parseFloat(priceRaw);
  if (isNaN(price) || price < 0) return NextResponse.json({ error: "price is required" }, { status: 400 });

  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : slugify(name);

  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null;
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : null;
  const hasSpiceOptions = typeof body.hasSpiceOptions === "boolean" ? body.hasSpiceOptions : false;
  const hasRiceChoice = typeof body.hasRiceChoice === "boolean" ? body.hasRiceChoice : false;
  const isVegetarian = typeof body.isVegetarian === "boolean" ? body.isVegetarian : false;
  const isVeganOption = typeof body.isVeganOption === "boolean" ? body.isVeganOption : false;
  const isGlutenFree = typeof body.isGlutenFree === "boolean" ? body.isGlutenFree : false;
  const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : true;

  const halfTrayPriceRaw = typeof body.halfTrayPrice === "string" ? body.halfTrayPrice : String(body.halfTrayPrice ?? "");
  const halfTrayPrice = halfTrayPriceRaw && !isNaN(parseFloat(halfTrayPriceRaw)) ? halfTrayPriceRaw : null;

  const fullTrayPriceRaw = typeof body.fullTrayPrice === "string" ? body.fullTrayPrice : String(body.fullTrayPrice ?? "");
  const fullTrayPrice = fullTrayPriceRaw && !isNaN(parseFloat(fullTrayPriceRaw)) ? fullTrayPriceRaw : null;

  const [created] = await db
    .insert(menuItems)
    .values({
      categoryId,
      name,
      slug,
      description,
      price: price.toFixed(2),
      imageUrl,
      hasSpiceOptions,
      hasRiceChoice,
      isVegetarian,
      isVeganOption,
      isGlutenFree,
      isAvailable,
      sortOrder,
      halfTrayPrice,
      fullTrayPrice,
    })
    .returning();

  return NextResponse.json({ item: created }, { status: 201 });
}
