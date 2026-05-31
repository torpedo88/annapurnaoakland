"use client";

import { useState } from "react";
import { MenuCategoryTabs } from "@/components/menu/menu-category-tabs";
import { MenuGrid } from "@/components/menu/menu-grid";
import type { MenuCategory } from "@/types/menu";

interface MenuPageClientProps {
  categories: MenuCategory[];
}

export function MenuPageClient({ categories }: MenuPageClientProps) {
  const firstSlug = categories[0]?.slug ?? "";
  const [activeCategory, setActiveCategory] = useState(firstSlug);

  const currentCategory = categories.find((c) => c.slug === activeCategory);
  const items = currentCategory?.items ?? [];

  return (
    <div className="space-y-8">
      <MenuCategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <MenuGrid items={items} />
    </div>
  );
}
