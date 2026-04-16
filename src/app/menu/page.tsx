import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { menuCategories, menuItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { MenuPageClient } from "./menu-page-client";
import type { MenuCategory, MenuItem } from "@/types/menu";

export const metadata: Metadata = {
  title: "Menu — Annapurna",
  description:
    "Explore our full menu of authentic Nepali and Indian dishes — momos, curries, tandoori, and more.",
};

export default async function MenuPage() {
  const [categories, items] = await Promise.all([
    db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.isCatering, false))
      .orderBy(asc(menuCategories.sortOrder)),
    db
      .select()
      .from(menuItems)
      .where(eq(menuItems.isAvailable, true))
      .orderBy(asc(menuItems.sortOrder)),
  ]);

  // Group items by category
  const itemsByCategory = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const catId = item.categoryId;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: String(item.price),
      imageUrl: item.imageUrl,
      hasSpiceOptions: item.hasSpiceOptions,
      hasRiceChoice: item.hasRiceChoice,
      isVegetarian: item.isVegetarian,
      isVeganOption: item.isVeganOption,
      isGlutenFree: item.isGlutenFree,
      isAvailable: item.isAvailable,
      halfTrayPrice: item.halfTrayPrice ? String(item.halfTrayPrice) : null,
      fullTrayPrice: item.fullTrayPrice ? String(item.fullTrayPrice) : null,
    });
    return acc;
  }, {});

  const menuData: MenuCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    isCatering: cat.isCatering,
    items: itemsByCategory[cat.id] ?? [],
  }));

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground">
            Our Menu
          </h1>
          <p className="mt-3 text-muted-foreground">
            Handcrafted dishes rooted in Nepali and Indian tradition.
          </p>
        </div>

        {menuData.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Menu is currently unavailable. Please check back soon.
          </p>
        ) : (
          <MenuPageClient categories={menuData} />
        )}
      </div>
    </div>
  );
}
