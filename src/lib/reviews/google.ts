import "server-only";

// Live Google reviews via the Places API (v1). Returns the aggregate rating +
// up to 5 reviews (Google's hard limit). Cached ~6h at the fetch layer, so it's
// cheap to call from both the /api/reviews route and the server-rendered JSON-LD.

export type GoogleReview = { rating: number; text: string; name: string; photo: string; when: string };
export type GoogleReviews = {
  rating: number | null;
  total: number | null;
  mapsUri: string | null;
  reviews: GoogleReview[];
};

const EMPTY: GoogleReviews = { rating: null, total: null, mapsUri: null, reviews: [] };

export async function getGoogleReviews(): Promise<GoogleReviews> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return EMPTY;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "rating,userRatingCount,googleMapsUri,reviews.rating,reviews.text,reviews.authorAttribution,reviews.relativePublishTimeDescription",
      },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return EMPTY;
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
    const reviews: GoogleReview[] = (d.reviews ?? [])
      .map((r) => ({
        rating: r.rating ?? 5,
        text: r.text?.text ?? "",
        name: r.authorAttribution?.displayName ?? "Google user",
        photo: r.authorAttribution?.photoUri ?? "",
        when: r.relativePublishTimeDescription ?? "",
      }))
      .filter((r) => r.text);

    return {
      rating: d.rating ?? null,
      total: d.userRatingCount ?? null,
      mapsUri: d.googleMapsUri ?? null,
      reviews,
    };
  } catch {
    return EMPTY;
  }
}
