import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getMenuCatalog, type CatalogItem } from "@/lib/menu/catalog";

export const runtime = "nodejs";

const LOGO = "/images/annapurna-logo.png";

// Public "Popular right now" feed: the real top-selling items (last 90 days,
// paid orders), resolved against the live DB catalog. We surface FOUR DIVERSE
// dishes — ranked by real sales, but preferring one per category and dishes
// that have a real photo — so it reflects demand without showing four of the
// same thing. Falls back to the catalog (still diverse) when there are no
// recent orders (e.g. the isolated dev DB).
export async function GET() {
  const { items } = await getMenuCatalog();
  const orderable = items.filter((i) => !i.isCatering && i.available);
  const bySlug = new Map(orderable.map((i) => [i.id, i]));

  let topSlugs: string[] = [];
  try {
    const rows = (await db.execute(sql`
      SELECT mi.slug AS slug, sum(oi.quantity)::int AS qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.name = oi.item_name
      WHERE o.payment_status = 'paid' AND o.created_at >= now() - interval '90 days'
      GROUP BY mi.slug
      ORDER BY sum(oi.quantity) DESC
      LIMIT 24
    `)) as unknown as { slug: string | null }[];
    topSlugs = rows.map((r) => r.slug).filter((s): s is string => Boolean(s));
  } catch {
    /* fall back to catalog order below */
  }

  // A demand-ranked pool: real best-sellers first, then the rest of the catalog.
  const ranked: CatalogItem[] = [];
  const inPool = new Set<string>();
  for (const slug of topSlugs) {
    const it = bySlug.get(slug);
    if (it && !inPool.has(it.id)) { ranked.push(it); inPool.add(it.id); }
  }
  for (const it of orderable) {
    if (!inPool.has(it.id)) { ranked.push(it); inPool.add(it.id); }
  }

  const hasImg = (it: CatalogItem) => Boolean(it.image) && it.image !== LOGO;
  const picked: CatalogItem[] = [];
  const usedIds = new Set<string>();
  const usedCats = new Set<string>();
  const take = (pred: (it: CatalogItem) => boolean) => {
    for (const it of ranked) {
      if (picked.length >= 4) break;
      if (usedIds.has(it.id) || !pred(it)) continue;
      picked.push(it); usedIds.add(it.id); usedCats.add(it.category);
    }
  };
  take((it) => hasImg(it) && !usedCats.has(it.category)); // diverse + photographed
  take((it) => hasImg(it));                               // photographed, any category
  take(() => true);                                       // never empty

  return NextResponse.json(
    { items: picked.slice(0, 4) },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
