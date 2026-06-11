import "server-only";
import { asc } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { menuItems, menuCategories } from "@/db/schema";
import type { MenuItem, MenuCategory } from "@/data/menu";

const LOGO = "/images/annapurna-logo.png";

/** A menu item plus its live availability flag (the public catalog needs both). */
export type CatalogItem = MenuItem & { available: boolean };

function tagsFor(it: { isVegetarian: boolean | null; isVeganOption: boolean | null; isGlutenFree: boolean | null }): string[] {
  const tags: string[] = [];
  if (it.isVegetarian) tags.push("vegetarian");
  if (it.isVeganOption) tags.push("vegan");
  if (it.isGlutenFree) tags.push("gluten-free");
  return tags;
}

/**
 * The live menu, read from the DB (menu_items + menu_categories). This is the
 * single source of truth for the public site and admin — replacing the static
 * `src/data/menu.ts` catalog. Memoized per request.
 */
export const getMenuCatalog = cache(async (): Promise<{ categories: MenuCategory[]; items: CatalogItem[] }> => {
  const [cats, items] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
    db.select().from(menuItems).orderBy(asc(menuItems.sortOrder), asc(menuItems.name)),
  ]);
  const catById = new Map(cats.map((c) => [c.id, c]));

  const categories: MenuCategory[] = cats.map((c) => ({
    slug: c.slug,
    label: c.name,
    isCatering: Boolean(c.isCatering),
  }));

  const mapped: CatalogItem[] = items.map((it) => {
    const cat = catById.get(it.categoryId);
    return {
      id: it.slug,
      name: it.name,
      description: it.description ?? "",
      price: Number(it.price),
      category: cat?.slug ?? "",
      categoryLabel: cat?.name ?? "",
      image: it.imageUrl || LOGO,
      isCatering: Boolean(cat?.isCatering),
      tags: tagsFor(it),
      available: it.isAvailable !== false,
    };
  });

  return { categories, items: mapped };
});

export type PriceCatalog = Map<string, { name: string; priceCents: number }>;

/**
 * slug -> { name, priceCents } for server-authoritative order pricing. Memoized
 * per request so a single order computation hits the DB once.
 */
export const getPriceCatalog = cache(async (): Promise<PriceCatalog> => {
  const rows = await db
    .select({ slug: menuItems.slug, name: menuItems.name, price: menuItems.price })
    .from(menuItems);
  return new Map(rows.map((r) => [r.slug, { name: r.name, priceCents: Math.round(Number(r.price) * 100) }]));
});
