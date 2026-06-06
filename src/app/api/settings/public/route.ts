import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { menu } from "@/data/menu";
import { db } from "@/db";
import { menuItems } from "@/db/schema";

export const runtime = "nodejs";

const LOGO = "/images/annapurna-logo.png";

export async function GET() {
  const s = await getSettings();
  // Name/price come from the catalog; the IMAGE is DB-driven (uploaded photo) and
  // falls back to the logo — we don't rely on repo images.
  const dish = s.dish_of_day.itemId ? menu.find((m) => m.id === s.dish_of_day.itemId) : undefined;
  let dishImage = LOGO;
  if (dish) {
    const [row] = await db
      .select({ url: menuItems.imageUrl })
      .from(menuItems)
      .where(eq(menuItems.slug, dish.id))
      .limit(1);
    if (row?.url) dishImage = row.url;
  }
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
