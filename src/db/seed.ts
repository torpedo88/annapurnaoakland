/**
 * Seed script — populates menu_categories, menu_items, restaurant_settings,
 * and time_slots from the static catalog + known business info.
 *
 * Run: npm run db:seed   (loads .env.local via --env-file)
 * Idempotent: re-running upserts; no duplicates.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  menuCategories,
  menuItems,
  restaurantSettings,
  timeSlots,
} from "@/db/schema";
import { categories, menu } from "@/data/menu";

async function seedCategories() {
  const rows = categories.map((c, i) => ({
    name: c.label,
    slug: c.slug,
    isCatering: c.isCatering,
    sortOrder: i,
  }));
  await db
    .insert(menuCategories)
    .values(rows)
    .onConflictDoUpdate({
      target: menuCategories.slug,
      set: {
        name: sql`excluded.name`,
        isCatering: sql`excluded.is_catering`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    });

  // Build slug -> id map from what's now in the table.
  const all = await db
    .select({ id: menuCategories.id, slug: menuCategories.slug })
    .from(menuCategories);
  return new Map(all.map((r) => [r.slug, r.id]));
}

async function seedItems(catIdBySlug: Map<string, string>) {
  const rows = menu.map((m, i) => {
    const categoryId = catIdBySlug.get(m.category);
    if (!categoryId) throw new Error(`No category for item ${m.id} (${m.category})`);
    return {
      categoryId,
      name: m.name,
      slug: m.id,
      description: m.description?.trim() ? m.description.trim() : null,
      price: m.price.toFixed(2),
      imageUrl: m.image,
      isVegetarian: m.tags.includes("vegetarian"),
      isAvailable: true,
      sortOrder: i,
    };
  });
  // Chunk to keep parameter count well under postgres limits.
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db
      .insert(menuItems)
      .values(rows.slice(i, i + CHUNK))
      .onConflictDoUpdate({
        target: menuItems.slug,
        set: {
          name: sql`excluded.name`,
          categoryId: sql`excluded.category_id`,
          description: sql`excluded.description`,
          price: sql`excluded.price`,
          imageUrl: sql`excluded.image_url`,
          isVegetarian: sql`excluded.is_vegetarian`,
          isAvailable: sql`excluded.is_available`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: sql`now()`,
        },
      });
  }
  return rows.length;
}

async function seedSettings() {
  const entries: { key: string; value: unknown }[] = [
    { key: "restaurant_name", value: "Annapurna" },
    { key: "tagline", value: "A tasting of the Himalayas" },
    { key: "address", value: "948 Clay Street, Oakland, CA 94607" },
    { key: "phone", value: "(510) 250-9696" },
    { key: "hours", value: { note: "Open daily", open: "11:00", close: "21:30" } },
    { key: "tax_rate", value: 0.0925 },
    { key: "currency", value: "USD" },
    { key: "pickup_enabled", value: true },
    { key: "delivery_enabled", value: true },
    { key: "delivery_provider", value: "doordash_drive" },
  ];
  await db
    .insert(restaurantSettings)
    .values(entries)
    .onConflictDoUpdate({
      target: restaurantSettings.key,
      set: { value: sql`excluded.value`, updatedAt: sql`now()` },
    });
  return entries.length;
}

async function seedTimeSlots() {
  // Reservation slots: open daily 11:00–21:30, last seating 21:00, every 30 min.
  const slots: { dayOfWeek: number; time: string; maxCapacity: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let h = 11; h <= 21; h++) {
      for (const m of [0, 30]) {
        if (h === 21 && m === 30) continue; // last seating 21:00
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
        slots.push({ dayOfWeek: day, time, maxCapacity: 8 });
      }
    }
  }
  await db.insert(timeSlots).values(slots).onConflictDoNothing();
  return slots.length;
}

async function main() {
  console.log("Seeding…");
  const catMap = await seedCategories();
  console.log(`  categories: ${catMap.size}`);
  const items = await seedItems(catMap);
  console.log(`  menu items: ${items}`);
  const settings = await seedSettings();
  console.log(`  settings:   ${settings}`);
  const ts = await seedTimeSlots();
  console.log(`  time slots: ${ts}`);
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
