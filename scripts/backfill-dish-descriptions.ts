import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema";

/**
 * Fill in `menu_items.description` for the items that shipped empty.
 *
 * 21 items (all breads, sides and drinks) had no description at all, which made
 * them useless as dish pages — a photo and a price is the thin content Google
 * ignores. Copy lives in scripts/dish-descriptions.json so it is reviewable in
 * a diff rather than typed straight into the DB.
 *
 * Only writes rows whose description is currently NULL/blank, so re-running is
 * safe and it will never clobber wording the kitchen has edited in the admin.
 * Pass --force to overwrite anyway.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-dish-descriptions.ts
 *   npx tsx --env-file=.env.prod  scripts/backfill-dish-descriptions.ts
 */

type Entry = { source: string; text: string };

const force = process.argv.includes("--force");
const file = new URL("./dish-descriptions.json", import.meta.url);
const { descriptions } = JSON.parse(readFileSync(file, "utf8")) as {
  descriptions: Record<string, Entry>;
};

(async () => {
  const rows = await db.select().from(menuItems);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  let updated = 0;
  const skipped: string[] = [];
  const missing: string[] = [];

  for (const [slug, entry] of Object.entries(descriptions)) {
    const row = bySlug.get(slug);
    if (!row) { missing.push(slug); continue; }

    const current = (row.description ?? "").trim();
    if (current && !force) { skipped.push(slug); continue; }

    await db
      .update(menuItems)
      .set({ description: entry.text, updatedAt: new Date() })
      .where(eq(menuItems.id, row.id));
    updated++;
    console.log(`  ✓ ${slug}  [${entry.source}]`);
  }

  console.log(`\nupdated: ${updated}`);
  if (skipped.length) console.log(`already had copy (left alone): ${skipped.length} — ${skipped.join(", ")}`);
  if (missing.length) console.log(`NOT FOUND in this DB: ${missing.length} — ${missing.join(", ")}`);
  process.exit(0);
})();
