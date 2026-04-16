"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuCategory } from "@/types/menu";

interface MenuCategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export function MenuCategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: MenuCategoryTabsProps) {
  return (
    <Tabs value={activeCategory}>
      <ScrollArea className="w-full">
        <TabsList className="h-auto w-max gap-1 bg-transparent p-0">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.slug}
              value={cat.slug}
              className="rounded-full border border-border px-4 py-1.5 text-sm data-active:bg-primary data-active:text-primary-foreground data-active:border-primary"
              onClick={() => onCategoryChange(cat.slug)}
            >
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}
