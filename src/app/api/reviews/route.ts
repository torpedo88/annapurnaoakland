import { NextResponse } from "next/server";
import { getGoogleReviews } from "@/lib/reviews/google";

export const runtime = "nodejs";

// Live Google reviews (aggregate rating + up to 5 reviews). Shared logic in
// src/lib/reviews/google.ts is also used by the server-rendered JSON-LD.
export async function GET() {
  const data = await getGoogleReviews();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
  });
}
