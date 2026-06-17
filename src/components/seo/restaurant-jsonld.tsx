// Server component: emits schema.org Restaurant structured data for rich
// results + local SEO (Google Maps / "near me"). Hours are derived from the
// canonical ordering window (src/lib/orders/hours.ts) so they never drift.

import { openDayNames, OPENS_HHMM, CLOSES_HHMM } from "@/lib/orders/hours";

const SITE = "https://annapurnaoakland.com";

export function RestaurantJsonLd() {
  const phone = process.env.RESTAURANT_PICKUP_PHONE || undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Annapurna Restaurant & Bar",
    description:
      "Family-run Himalayan & Nepali kitchen in Oakland since 2010. Momos, butter chicken, biryani, tandoori. Pickup & delivery.",
    url: SITE,
    ...(phone ? { telephone: phone } : {}),
    image: `${SITE}/images/annapurna-logo.png`,
    logo: `${SITE}/images/annapurna-logo.png`,
    priceRange: "$$",
    servesCuisine: ["Nepalese", "Himalayan", "Indian"],
    acceptsReservations: "True",
    menu: `${SITE}/menu`,
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
      // JSON-LD is static, server-rendered, and not user-controlled.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
