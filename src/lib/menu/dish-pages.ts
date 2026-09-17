import "server-only";
import { unstable_cache } from "next/cache";
import { getMenuCatalog, type CatalogItem } from "@/lib/menu/catalog";
import { hasDishPage } from "@/lib/menu/dish-page-rules";

// The eligibility rule itself lives in dish-page-rules.ts so the client-side
// menu grid can apply it too (see the comment there). This module is the
// server-side data access built on top of it.
export { hasDishPage };

/**
 * The catalog, cached across renders.
 *
 * `getMenuCatalog` is wrapped in React `cache()`, which dedupes within a single
 * render but not between them. With ~85 prerendered dish pages that meant ~85
 * separate round trips during `next build`, which saturated the Supabase pooler
 * and tripped Next's 60s per-page timeout (the build only finished because it
 * retries). `unstable_cache` persists the result across renders, so the whole
 * build reads the menu once and every page after that is served from cache.
 *
 * Cache Components (`cacheComponents` / `"use cache"`) are not enabled on this
 * project, so `unstable_cache` is the documented option here — see
 * node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md.
 *
 * 30s matches `/api/menu` and the `revalidate` on `/menu` and `/menu/[slug]`.
 */
const getCachedItems = unstable_cache(
  async (): Promise<CatalogItem[]> => (await getMenuCatalog()).items,
  ["dish-page-catalog"],
  { revalidate: 30, tags: ["menu"] },
);

/** Every dish that should be crawlable, in menu order. Used by the route and the sitemap. */
export async function getDishPageItems(): Promise<CatalogItem[]> {
  const items = await getCachedItems();
  return items.filter(hasDishPage);
}

/** One dish by slug, or null when it has no page (catering, packaged drink, unknown). */
export async function getDishBySlug(slug: string): Promise<CatalogItem | null> {
  const items = await getCachedItems();
  const item = items.find((i) => i.id === slug);
  return item && hasDishPage(item) ? item : null;
}

/**
 * Other dishes from the same category, for the "More from …" rail. This is the
 * internal linking that lets a crawler walk sideways across the menu instead of
 * having to come back through `/menu` for every dish.
 */
export async function getRelatedDishes(item: CatalogItem, limit = 6): Promise<CatalogItem[]> {
  const items = await getCachedItems();
  const sameCategory = items.filter(
    (i) => hasDishPage(i) && i.category === item.category && i.id !== item.id,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  // Thin category — top it up with other dishes that have a real photo.
  const filler = items.filter(
    (i) => hasDishPage(i) && i.category !== item.category && Boolean(i.image),
  );
  return [...sameCategory, ...filler].slice(0, limit);
}
