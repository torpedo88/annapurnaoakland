// Server component: schema.org Menu structured data for the /menu page, built
// from the static catalog. Helps Google show menu / dish + price rich results.

import { menuByCategory } from "@/data/menu";

const SITE = "https://annapurnaoakland.com";

export function MenuJsonLd() {
  const sections = menuByCategory(false) // non-catering
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      "@type": "MenuSection",
      name: c.label,
      hasMenuItem: c.items.map((it) => ({
        "@type": "MenuItem",
        name: it.name,
        ...(it.description ? { description: it.description } : {}),
        offers: {
          "@type": "Offer",
          price: it.price.toFixed(2),
          priceCurrency: "USD",
        },
      })),
    }));

  const data = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Annapurna — Indian & Nepalese Menu",
    url: `${SITE}/menu`,
    inLanguage: "en",
    hasMenuSection: sections,
  };

  return (
    <script
      type="application/ld+json"
      // Escape `<` so no value can break out of the <script> tag (XSS-safe).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
