import type { MetadataRoute } from "next";
import { getDishPageItems } from "@/lib/menu/dish-pages";

const SITE = "https://annapurnaoakland.com";

// The dish pages are DB-backed, so the sitemap is generated rather than static.
// Same cadence as /menu and /menu/[slug].
export const revalidate = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/menu`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/reservations`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/catering`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.6 },
  ];

  // One entry per crawlable dish (non-catering, excluding packaged drinks —
  // see src/lib/menu/dish-pages.ts for why).
  const dishes = await getDishPageItems();
  for (const d of dishes) {
    pages.push({
      url: `${SITE}/menu/${d.id}`,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
