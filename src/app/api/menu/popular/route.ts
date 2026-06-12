import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getMenuCatalog, type CatalogItem } from "@/lib/menu/catalog";

export const runtime = "nodejs";

// Public "Popular right now" feed: the real top-selling items (last 90 days,
// paid orders), resolved against the live DB catalog, topped up with other
// available dishes so the section is never empty.
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
      LIMIT 12
    `)) as unknown as { slug: string | null }[];
    topSlugs = rows.map((r) => r.slug).filter((s): s is string => Boolean(s));
  } catch {
    /* fall back to curated below */
  }

  const picked: CatalogItem[] = [];
  const seen = new Set<string>();
  for (const slug of topSlugs) {
    const it = bySlug.get(slug);
    if (it && !seen.has(slug)) { picked.push(it); seen.add(slug); }
  }
  for (const it of orderable) {
    if (picked.length >= 4) break;
    if (!seen.has(it.id)) { picked.push(it); seen.add(it.id); }
  }

  return NextResponse.json(
    { items: picked.slice(0, 4) },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
