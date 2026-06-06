import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public menu overlay. menuItems.slug === the static menu item id, so the client
// joins on it. Returns: which items an admin marked unavailable ("86"), and any
// admin-uploaded photos (imageUrl) to override the static catalog image with.
export async function GET() {
  const rows = await db
    .select({ slug: menuItems.slug, isAvailable: menuItems.isAvailable, imageUrl: menuItems.imageUrl })
    .from(menuItems);

  const unavailable = rows.filter((r) => r.isAvailable === false).map((r) => r.slug);
  const images: Record<string, string> = {};
  for (const r of rows) {
    if (r.imageUrl) images[r.slug] = r.imageUrl;
  }

  return NextResponse.json(
    { unavailable, images },
    { headers: { "Cache-Control": "public, max-age=15, s-maxage=15" } },
  );
}
