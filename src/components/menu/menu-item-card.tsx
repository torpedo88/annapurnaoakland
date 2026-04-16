import { Flame, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DietaryBadge } from "./dietary-badge";
import type { MenuItem } from "@/types/menu";

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <Card className="flex flex-col h-full">
      {/* Gradient image placeholder */}
      <div className="h-40 w-full bg-gradient-to-br from-amber-800/60 to-primary-dark/80 rounded-t-xl flex items-center justify-center">
        <span className="font-serif text-sm font-semibold text-white/60 px-3 text-center">
          {item.name}
        </span>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-serif text-base font-bold text-foreground leading-snug">
            {item.name}
          </CardTitle>
          <span className="font-mono text-sm font-semibold text-primary whitespace-nowrap shrink-0">
            ${item.price}
          </span>
        </div>
        <DietaryBadge
          isVegetarian={item.isVegetarian}
          isVeganOption={item.isVeganOption}
          isGlutenFree={item.isGlutenFree}
        />
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {item.hasSpiceOptions && (
            <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 rounded-full px-2 py-0.5 border border-orange-200">
              <Flame className="size-3" />
              Spice options
            </span>
          )}
          {item.hasRiceChoice && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 border border-amber-200">
              <Wheat className="size-3" />
              Rice choice
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button size="sm" className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
