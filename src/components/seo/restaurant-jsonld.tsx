// Server component: emits schema.org Restaurant structured data for rich
// results + local SEO (Google Maps / "near me"). Hours are derived from the
// canonical ordering window (src/lib/orders/hours.ts) so they never drift.

import { openDayNames, OPENS_HHMM, CLOSES_HHMM } from "@/lib/orders/hours";

const SITE = "https://annapurnaoakland.com";

// Verified same-entity profiles (all list 948 Clay St · (510) 250-9696). `sameAs`
// lets Google tie this site to the business's Google/Yelp/Facebook/Grubhub
// listings in the knowledge graph — key for local ("near me") ranking. Only add
// URLs confirmed to be this restaurant; a wrong link hurts entity resolution.
const SAME_AS = [
  "https://www.google.com/maps?cid=12301210349358800714",
  "https://www.yelp.com/biz/annapurna-restaurant-and-bar-oakland-3",
  "https://www.facebook.com/annapurnarestaurantandbar/",
  "https://www.instagram.com/annapurnarestaurant510/",
  "https://www.grubhub.com/restaurant/annapurna-restaurant--bar-948-clay-st-oakland/333338",
];

export function RestaurantJsonLd() {
  const phone = process.env.RESTAURANT_PICKUP_PHONE || undefined;

  // No aggregateRating / review here. Google's review-snippet guidelines treat
  // ratings a business marks up about itself, or copies from Google/Yelp, as
  // self-serving: not eligible for stars and a manual-action risk. The reviews
  // stay visible on the page; they just aren't in structured data.
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Annapurna Restaurant & Bar",
    description:
      "Family-run Indian & Nepalese kitchen in Oakland since 2010. Momos, butter chicken, biryani, tandoori. Pickup & delivery.",
    url: SITE,
    ...(phone ? { telephone: phone } : {}),
    image: `${SITE}/images/annapurna-logo.png`,
    logo: `${SITE}/images/annapurna-logo.png`,
    priceRange: "$$",
    servesCuisine: ["Indian", "Nepalese", "Himalayan"],
    acceptsReservations: "True",
    menu: `${SITE}/menu`,
    sameAs: SAME_AS,
    address: {
      "@type": "PostalAddress",
      streetAddress: "948 Clay Street",
      addressLocality: "Oakland",
      addressRegion: "CA",
      postalCode: "94607",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.8022905,
      longitude: -122.2751986,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: openDayNames(), // Mon–Sat (closed Sunday) — from hours.ts
        opens: OPENS_HHMM,
        closes: CLOSES_HHMM,
      },
    ],
    potentialAction: {
      "@type": "OrderAction",
      target: `${SITE}/menu`,
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escape `<` so no value can break out of the <script> tag (XSS-safe).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
