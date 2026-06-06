import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { dishImage } from "@/lib/dish-images";

(async () => {
  const rows = await db.select().from(menuItems);
  console.log("menu_items rows:", rows.length);
  let updated = 0;
  for (const r of rows) {
    const url = dishImage(r.name, "");
    if (r.imageUrl !== url) {
      await db.update(menuItems).set({ imageUrl: url, updatedAt: new Date() }).where(eq(menuItems.id, r.id));
      updated++;
    }
  }
  console.log("imageUrl backfilled:", updated);
  process.exit(0);
})();
