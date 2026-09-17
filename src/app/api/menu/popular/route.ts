import { NextResponse } from "next/server";
import { getPopularItems } from "@/lib/menu/popular";

export const runtime = "nodejs";

// Public "Popular right now" feed. The selection logic lives in
// src/lib/menu/popular.ts because the homepage server-renders the same four
// dishes; this route stays for any client that wants them on demand.
export async function GET() {
  const items = await getPopularItems();
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
