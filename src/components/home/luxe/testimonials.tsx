import { getGoogleReviews } from "@/lib/reviews/google";
import { TestimonialsBody } from "./testimonials-body";

/**
 * "What our guests say" — live Google reviews.
 *
 * Server-rendered so the review text and the 4.3 / 535 aggregate are in the
 * HTML (crawlable, and they double as the visible counterpart to the
 * `aggregateRating` in the Restaurant JSON-LD). `getGoogleReviews` is the same
 * helper `/api/reviews` and the JSON-LD use, so this costs no extra upstream
 * call. The marquee animation stays in the client child.
 */
export async function Testimonials() {
  const data = await getGoogleReviews();
  if (!data || data.reviews.length === 0) return null;

  return <TestimonialsBody data={data} />;
}
