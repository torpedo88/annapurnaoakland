import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { getMenuCatalog } from "@/lib/menu/catalog";

export const runtime = "nodejs";

const LOGO = "/images/annapurna-logo.png";

export async function GET() {
  const [s, catalog] = await Promise.all([getSettings(), getMenuCatalog()]);
  // Dish-of-the-day name/price/image all come from the live DB catalog.
  const dish = s.dish_of_day.itemId ? catalog.items.find((m) => m.id === s.dish_of_day.itemId) : undefined;
  const dishImage = dish?.image || LOGO;
  return NextResponse.json({
    tax_rate: s.tax_rate,
    ordering_paused: s.ordering_paused,
    pickup_enabled: s.pickup_enabled,
    delivery_enabled: s.delivery_enabled,
    delivery: {
      freeThresholdCents: s.delivery.freeThresholdCents,
      minOrderCents: s.delivery.minOrderCents,
    },
    dish_of_day: dish
      ? {
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          image: dishImage,
          discountPercent: s.dish_of_day.discountPercent,
          discountedPrice:
            s.dish_of_day.discountPercent > 0
              ? +(dish.price * (1 - s.dish_of_day.discountPercent / 100)).toFixed(2)
              : null,
        }
      : null,
  });
}
