// Server component: fetch the live menu from the DB and render it into the
// initial HTML, then hand off to the interactive client menu. This keeps the
// dish list crawlable (the page was a JS-only client render, which Google
// flagged as a soft 404) while the client still refreshes live availability.
import { getMenuCatalog } from "@/lib/menu/catalog";
import { MenuClient } from "./menu-client";

// Re-render the server HTML at most every 30s (matches /api/menu's cache) so
// the DB isn't hit on every crawl/visit; the client refreshes availability.
export const revalidate = 30;

export default async function MenuPage() {
  const { categories, items } = await getMenuCatalog();
  return <MenuClient initialCategories={categories} initialItems={items} />;
}
