import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: the set of menu item slugs an admin has marked unavailable ("86").
// menuItems.slug === the static menu item id, so the client joins on it.
export async function GET() {
  const rows = await db
    .select({ slug: menuItems.slug })
    .from(menuItems)
    .where(eq(menuItems.isAvailable, false));
  return NextResponse.json(
    { unavailable: rows.map((r) => r.slug) },
    { headers: { "Cache-Control": "public, max-age=15, s-maxage=15" } },
  );
}
