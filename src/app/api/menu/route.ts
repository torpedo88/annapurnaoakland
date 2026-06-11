import { NextResponse } from "next/server";
import { getMenuCatalog } from "@/lib/menu/catalog";

export const runtime = "nodejs";

// Public, live menu (categories + items) from the DB. Short edge cache so admin
// edits show up within ~30s without hammering the DB on every page load.
export async function GET() {
  const { categories, items } = await getMenuCatalog();
  return NextResponse.json(
    { categories, items },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}
