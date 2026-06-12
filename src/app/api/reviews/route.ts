import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Live Google reviews for the restaurant. Google's Places API returns the
// aggregate rating + up to 5 reviews (its hard limit). Cached ~6h.
export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const empty = { rating: null, total: null, mapsUri: null, reviews: [] as unknown[] };
  if (!key || !placeId) return NextResponse.json(empty);

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "rating,userRatingCount,googleMapsUri,reviews.rating,reviews.text,reviews.authorAttribution,reviews.relativePublishTimeDescription",
      },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return NextResponse.json(empty);
    const d = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: {
        rating?: number;
        text?: { text?: string };
        relativePublishTimeDescription?: string;
        authorAttribution?: { displayName?: string; photoUri?: string };
      }[];
    };
    const reviews = (d.reviews ?? [])
      .map((r) => ({
        rating: r.rating ?? 5,
        text: r.text?.text ?? "",
        name: r.authorAttribution?.displayName ?? "Google user",
        photo: r.authorAttribution?.photoUri ?? "",
        when: r.relativePublishTimeDescription ?? "",
      }))
      .filter((r) => r.text);

    return NextResponse.json(
      { rating: d.rating ?? null, total: d.userRatingCount ?? null, mapsUri: d.googleMapsUri ?? null, reviews },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json(empty);
  }
}
