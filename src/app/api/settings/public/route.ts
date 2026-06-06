import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { menu } from "@/data/menu";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSettings();
  const dish = s.dish_of_day.itemId ? menu.find((m) => m.id === s.dish_of_day.itemId) : undefined;
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
          image: dish.image,
          discountPercent: s.dish_of_day.discountPercent,
          discountedPrice:
            s.dish_of_day.discountPercent > 0
              ? +(dish.price * (1 - s.dish_of_day.discountPercent / 100)).toFixed(2)
              : null,
        }
      : null,
  });
}
