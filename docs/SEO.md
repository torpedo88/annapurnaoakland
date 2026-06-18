# SEO — what's done & what you own

Status of the site's SEO, split into **shipped in code** (done) and **your
action items** (off-site, only the owner can do). Keep this current as things
change.

## ✅ Fixed in code (live in production)

- [x] **Structured-data hours corrected** — JSON-LD said "open 7 days"; the
      restaurant is closed Sundays. Now **Mon–Sat 11:00–21:30**, derived from
      `src/lib/orders/hours.ts` so it can't drift again.
- [x] **`/reservations` + `/catering` pages built** — were 404 (linked from
      `/about`, nav, footer). Real pages with forms → existing admin board /
      catering inbox. Added to nav, footer, sitemap.
- [x] **`/preview/*` + `/flyer` blocked from indexing** (`robots.ts`) — they're
      alternate designs / a print asset; indexing them risked duplicate content.
- [x] **`/order` → `/menu` 308 redirect** — the indexed bare `/order` URL 404'd.
- [x] **Sitemap expanded** — now `/`, `/menu`, `/reservations`, `/catering`,
      `/about` (was only `/` + `/menu`).
- [x] **Meta description trimmed** to ≤160 chars (was 188, truncated in results).
- [x] **Local keywords in titles + copy** — "Nepali & Himalayan restaurant
      Oakland" on the home hero and menu title/description; per-page metadata +
      canonicals.
- [x] **Menu rich-result markup** — `Menu` JSON-LD with dish names + prices on
      `/menu` (`src/components/seo/menu-jsonld.tsx`).
- [x] **Duplicate-canonical fixes** (from Search Console "Duplicate, Google chose
      different canonical" notices): `www` → apex 301 redirect (both hosts served
      200); `/about` now sets its own canonical (it had inherited the homepage's);
      non-production deployments (`dev.*`, `*.vercel.app`) now return
      `Disallow: /` in robots so staging can't be indexed as a duplicate.
- [x] **Review rich-result markup** — real `aggregateRating` + reviews from the
      Google Places API on the home Restaurant schema. Only emitted when real
      data is present; review text is escaped (XSS-safe). *Note: Google may
      still prefer its own rating for the star display ("self-serving" markup),
      but this is real, on-page data — no penalty risk.*

Where these live: see **ARCHITECTURE.md §17 (Redirects & SEO)**.

## ⏳ Your action items (off-site — only the owner can do these)

### Google Business Profile — business.google.com (highest impact)
Google shows hours/photos/category in Search & Maps from here, **not** the
website. This is ~70% of local restaurant SEO.

- [x] **Hours**: verified in GBP — **Sunday Closed**, Mon–Sat 11AM–9:30PM
      (matches the site).
- [ ] **Primary category**: keep **"Nepalese restaurant" as PRIMARY** (it
      already is). Do NOT switch primary to "Indian restaurant" — Nepalese is
      the accurate, less-competitive niche you rank for. Keep "Indian
      restaurant" (and optionally "Indian takeaway") as **secondary** only.
- [ ] Confirm **address** (948 Clay Street, Oakland CA 94607) and **phone**
      ((510) 250-9696) match the website.
- [ ] Add recent **photos** (food, interior, the tandoor).
- [ ] **Reply to reviews** — engagement is a ranking signal.

### Google Search Console — search.google.com/search-console
- [ ] **Submit the sitemap**: Sitemaps → add `sitemap.xml`.
- [ ] **Request indexing** for the new/changed pages: URL Inspection → enter the
      URL → Request indexing, for `/`, `/menu`, `/reservations`, `/catering`.
- [ ] **Read the Pages (Coverage) report** and send the maintainer the exact
      errors/warnings so they can be fixed precisely (not guessed).
- [ ] After Google re-crawls, check **Search Console → Enhancements** for valid
      Menu / Review structured data.

### Validate the structured data
- [ ] Run the home + `/menu` URLs through Google's Rich Results Test
      (search.google.com/test/rich-results) to confirm Restaurant + Menu parse
      with no errors.

## Notes / future ideas
- Public menu now reads the DB (`getMenuCatalog`); the Menu JSON-LD is from the
  static catalog (`src/data/menu.ts`) — keep prices in sync if they diverge.
- Bigger off-site levers beyond GBP: consistent **citations** (Yelp, etc.) and
  **backlinks**; these move local ranking more than further on-page tweaks.
