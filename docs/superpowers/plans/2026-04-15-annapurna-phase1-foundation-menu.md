# Annapurna Phase 1: Foundation + Menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js project with Supabase, seed the full Annapurna menu, and build the public-facing homepage and menu page.

**Architecture:** Next.js 15 App Router with Server Components for menu display. Drizzle ORM for type-safe DB queries against Supabase PostgreSQL. Tailwind + shadcn/ui customized with Annapurna's warm saffron/cream brand palette. Mobile-first responsive design.

**Tech Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, shadcn/ui, Drizzle ORM, Supabase (PostgreSQL + Auth), Zod, Playfair Display + Inter + DM Mono fonts.

**Spec:** `docs/superpowers/specs/2026-04-15-annapurna-redesign-design.md`

---

## File Structure

```
annapurnaoakland/
├── .env.local                          # Supabase + Stripe keys (gitignored)
├── .env.example                        # Template for env vars
├── drizzle.config.ts                   # Drizzle ORM config
├── next.config.ts                      # Next.js config
├── tailwind.config.ts                  # Tailwind with Annapurna theme
├── tsconfig.json                       # TypeScript strict config
├── package.json
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout: fonts, metadata, nav, footer
│   │   ├── page.tsx                    # Homepage
│   │   ├── menu/
│   │   │   ├── page.tsx               # Menu page (server component)
│   │   │   └── menu-page-client.tsx   # Client-side tab interaction
│   │   ├── about/
│   │   │   └── page.tsx               # Our Story page
│   │   └── globals.css                # Tailwind directives + CSS variables
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (button, card, badge, etc.)
│   │   ├── layout/
│   │   │   ├── header.tsx             # Nav bar with logo, links, cart icon
│   │   │   └── footer.tsx             # Footer with hours, contact, mountain silhouette
│   │   ├── menu/
│   │   │   ├── menu-category-tabs.tsx # Category tab navigation
│   │   │   ├── menu-item-card.tsx     # Individual menu item display
│   │   │   ├── menu-grid.tsx          # Grid of menu items for a category
│   │   │   └── dietary-badge.tsx      # Veg/Vegan/GF colored pills
│   │   └── home/
│   │       ├── hero-section.tsx       # Full-bleed hero with CTAs
│   │       ├── featured-dishes.tsx    # 3-4 signature dishes
│   │       ├── story-section.tsx      # Brief restaurant narrative
│   │       └── info-section.tsx       # Hours, map, contact
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema definitions
│   │   ├── index.ts                   # Drizzle client + connection
│   │   └── seed.ts                    # Full menu seed data
│   ├── lib/
│   │   ├── utils.ts                   # cn() utility
│   │   └── env.ts                     # Zod-validated env vars
│   └── types/
│       └── menu.ts                    # Menu-related TypeScript types
├── drizzle/
│   └── migrations/                    # Generated SQL migrations
```

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Create Next.js project**

Run from `/Users/abhishekmaharjan/annapurna/annapurnaoakland/`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Note: Since the directory already has a `.git` and `README.md`, the installer will scaffold around them. Select defaults when prompted.

- [ ] **Step 2: Verify project runs**

```bash
npm run dev
```

Expected: Dev server starts at `http://localhost:3000`, shows Next.js default page.

- [ ] **Step 3: Clean up default content**

Replace `src/app/page.tsx` with:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Annapurna</h1>
    </main>
  );
}
```

Remove the default Next.js SVG imports and boilerplate from `src/app/globals.css` -- keep only:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Enable strict TypeScript**

In `tsconfig.json`, ensure these are set under `compilerOptions`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Configure Annapurna Brand Theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Google Fonts to layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter, DM_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annapurna -- Taste of the Himalayas",
  description:
    "Family-owned Nepali-Indian restaurant in Oakland, CA. Authentic momos, tikka masala, tandoori, and more. Order online for pickup or delivery.",
  keywords: ["Nepali food Oakland", "Indian restaurant Oakland", "momos", "tikka masala", "Annapurna"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${dmMono.variable}`}
    >
      <body className="font-sans bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Configure CSS variables and Tailwind theme**

Replace `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #D4731A;
  --color-primary-dark: #8B4513;
  --color-secondary: #8B1A1A;
  --color-background: #FAF7F2;
  --color-surface: #F5F0E8;
  --color-foreground: #2D2A26;
  --color-muted: #6B6560;
  --color-accent: #4A7C59;
  --color-gold: #C5963A;
  --color-primary-foreground: #FFFFFF;
  --color-secondary-foreground: #FFFFFF;
  --color-accent-foreground: #FFFFFF;

  --font-sans: var(--font-inter);
  --font-serif: var(--font-playfair);
  --font-mono: var(--font-dm-mono);

  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}
```

- [ ] **Step 3: Verify fonts and colors render**

```bash
npm run dev
```

Open `http://localhost:3000` -- confirm warm white background (`#FAF7F2`), charcoal text, Inter font on body.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: configure Annapurna brand theme with colors, fonts, and Tailwind"
```

---

### Task 3: Install and Configure shadcn/ui

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `components.json`

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 2: Install required components**

```bash
npx shadcn@latest add button card badge tabs separator sheet scroll-area
```

- [ ] **Step 3: Verify components import correctly**

Update `src/app/page.tsx` to test:

```tsx
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-4">
      <h1 className="font-serif text-4xl font-bold">Annapurna</h1>
      <Button>Order Now</Button>
    </main>
  );
}
```

```bash
npm run dev
```

Expected: Page shows heading in Playfair Display, button renders with theme styling.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: install and configure shadcn/ui components"
```

---

### Task 4: Set Up Supabase + Drizzle ORM

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/db/index.ts`
- Create: `src/db/schema.ts`
- Create: `drizzle.config.ts`
- Modify: `package.json` (add deps)

- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm postgres zod
npm install -D drizzle-kit @types/pg
```

- [ ] **Step 2: Create env validation**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 3: Create .env.example**

Create `.env.example`:

```
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Create .env.local with real Supabase credentials**

Create `.env.local` with your Supabase project credentials (from Supabase dashboard -> Settings -> API):

```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

Ensure `.env.local` is in `.gitignore` (Next.js adds this by default).

- [ ] **Step 5: Create Drizzle schema**

Create `src/db/schema.ts`:

```ts
import {
  pgTable,
  uuid,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  date,
  time,
  serial,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

// --- Menu ---

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isCatering: boolean("is_catering").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  hasSpiceOptions: boolean("has_spice_options").default(false),
  hasRiceChoice: boolean("has_rice_choice").default(false),
  isVegetarian: boolean("is_vegetarian").default(false),
  isVeganOption: boolean("is_vegan_option").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isAvailable: boolean("is_available").default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  halfTrayPrice: decimal("half_tray_price", { precision: 10, scale: 2 }),
  fullTrayPrice: decimal("full_tray_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Orders ---

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: serial("order_number"),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  orderType: text("order_type").notNull(),
  status: text("status").notNull().default("confirmed"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  loyaltyPointsEarned: integer("loyalty_points_earned").default(0),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed").default(0),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  scheduledTime: timestamp("scheduled_time", { withTimezone: true }),
  deliveryAddress: text("delivery_address"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  itemName: text("item_name").notNull(),
  itemPrice: decimal("item_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  spiceLevel: text("spice_level"),
  riceChoice: text("rice_choice"),
  specialInstructions: text("special_instructions"),
  traySize: text("tray_size"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- Customers ---

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  defaultAddress: text("default_address"),
  loyaltyPoints: integer("loyalty_points").default(0),
  lifetimeSpend: decimal("lifetime_spend", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  birthday: date("birthday"),
  referralCode: text("referral_code").unique(),
  referredBy: uuid("referred_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Reservations ---

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  date: date("date").notNull(),
  timeSlot: time("time_slot").notNull(),
  partySize: integer("party_size").notNull(),
  status: text("status").notNull().default("confirmed"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const timeSlots = pgTable(
  "time_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dayOfWeek: integer("day_of_week").notNull(),
    time: time("time").notNull(),
    maxCapacity: integer("max_capacity").notNull().default(8),
    isActive: boolean("is_active").default(true),
  },
  (table) => [unique("day_time_unique").on(table.dayOfWeek, table.time)]
);

// --- Loyalty ---

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  pointsRequired: integer("points_required").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }),
  maxItemValue: decimal("max_item_value", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  orderId: uuid("order_id").references(() => orders.id),
  type: text("type").notNull(),
  points: integer("points").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- Catering ---

export const cateringRequests = pgTable("catering_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  eventDate: date("event_date").notNull(),
  partySize: integer("party_size").notNull(),
  budgetRange: text("budget_range"),
  dietaryNeeds: text("dietary_needs"),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  quotedTotal: decimal("quoted_total", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Settings ---

export const restaurantSettings = pgTable("restaurant_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 6: Create Drizzle client**

Create `src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

- [ ] **Step 7: Create Drizzle config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 8: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Expected: Tables created in Supabase. Verify in Supabase dashboard -> Table Editor.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: set up Supabase + Drizzle ORM with full database schema"
```

---

### Task 5: Seed Menu Data

**Files:**
- Create: `src/db/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create seed script**

Create `src/db/seed.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { menuCategories, menuItems } from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const categories = [
  { name: "Appetizers", slug: "appetizers", sortOrder: 0 },
  { name: "Vegetarian Dishes", slug: "vegetarian", sortOrder: 1 },
  { name: "Chicken Dishes", slug: "chicken", sortOrder: 2 },
  { name: "Lamb Dishes", slug: "lamb", sortOrder: 3 },
  { name: "Tandoori Dishes", slug: "tandoori", sortOrder: 4 },
  { name: "Seafood", slug: "seafood", sortOrder: 5 },
  { name: "Biryani", slug: "biryani", sortOrder: 6 },
  { name: "House Special", slug: "house-special", sortOrder: 7 },
  { name: "Breads", slug: "breads", sortOrder: 8 },
  { name: "Side Orders", slug: "sides", sortOrder: 9 },
  { name: "Desserts", slug: "desserts", sortOrder: 10 },
  { name: "Beverages", slug: "beverages", sortOrder: 11 },
  { name: "Catering - Appetizers", slug: "catering-appetizers", sortOrder: 12, isCatering: true },
  { name: "Catering - Vegetarian", slug: "catering-vegetarian", sortOrder: 13, isCatering: true },
  { name: "Catering - Chicken", slug: "catering-chicken", sortOrder: 14, isCatering: true },
  { name: "Catering - Lamb/Goat", slug: "catering-lamb-goat", sortOrder: 15, isCatering: true },
  { name: "Catering - Tandoori", slug: "catering-tandoori", sortOrder: 16, isCatering: true },
  { name: "Catering - Biryani", slug: "catering-biryani", sortOrder: 17, isCatering: true },
  { name: "Catering - Breads", slug: "catering-breads", sortOrder: 18, isCatering: true },
  { name: "Catering - Sides", slug: "catering-sides", sortOrder: 19, isCatering: true },
  { name: "Catering - Desserts", slug: "catering-desserts", sortOrder: 20, isCatering: true },
];

async function seed() {
  console.log("Seeding menu categories...");

  await db.delete(menuItems);
  await db.delete(menuCategories);

  const insertedCategories = await db
    .insert(menuCategories)
    .values(categories)
    .returning({ id: menuCategories.id, slug: menuCategories.slug });

  const catMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  console.log("Seeding menu items...");

  const items = [
    // --- Appetizers ---
    { categoryId: catMap.get("appetizers")!, name: "Veg. Momo", slug: "veg-momo", description: "Steamed dumplings filled with minced cabbage, spinach, mushroom, cashew nuts, cheese, onion, and cilantro. Served with tomato chutney. (8 pcs)", price: "13.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("appetizers")!, name: "Chicken Momo", slug: "chicken-momo", description: "Steamed dumplings filled with minced chicken, onion, garlic, ginger, and cilantro.", price: "14.99", hasSpiceOptions: false, sortOrder: 1 },
    { categoryId: catMap.get("appetizers")!, name: "Lamb Momo", slug: "lamb-momo", description: "Steamed dumplings filled with minced lamb, onion, garlic, ginger, and cilantro.", price: "15.99", hasSpiceOptions: false, sortOrder: 2 },
    { categoryId: catMap.get("appetizers")!, name: "Mixed Momo", slug: "mixed-momo", description: "Steamed dumplings: 3 pieces of Chicken, 3 pieces of Veg and 2 pieces of Lamb.", price: "15.99", hasSpiceOptions: false, sortOrder: 3 },
    { categoryId: catMap.get("appetizers")!, name: "Veg Samosa", slug: "veg-samosa", description: "Fried triangular dough stuffed with spinach, potatoes, peppers, and cilantro seeds. Served with tamarind chutney.", price: "7.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 4 },
    { categoryId: catMap.get("appetizers")!, name: "Veg. Pakora", slug: "veg-pakora", description: "Mixed golden-fried vegetable fritters. Served with mint sauce.", price: "9.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 5 },
    { categoryId: catMap.get("appetizers")!, name: "Chicken Chhoila", slug: "chicken-chhoila", description: "Overnight marinated pieces of chicken baked in tandoor oven and mixed with onion, bell pepper and herbs, spices and lemon juice.", price: "14.99", hasSpiceOptions: true, sortOrder: 6 },
    { categoryId: catMap.get("appetizers")!, name: "Paneer Pakora", slug: "paneer-pakora", description: "Homemade paneer cubes golden fried in garbanzo flour. Served with mint sauce.", price: "11.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 7 },
    { categoryId: catMap.get("appetizers")!, name: "Pumpkin Pakora", slug: "pumpkin-pakora", description: "Golden-fried pumpkin. Served with mint sauce.", price: "11.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 8 },
    { categoryId: catMap.get("appetizers")!, name: "Fish Pakora", slug: "fish-pakora", description: "Golden fried fish fillet served with mint sauce.", price: "12.99", hasSpiceOptions: false, sortOrder: 9 },
    { categoryId: catMap.get("appetizers")!, name: "Veg Jhol Momo", slug: "veg-jhol-momo", description: "Steamed dumplings served with spicy homemade momo soup.", price: "14.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 10 },
    { categoryId: catMap.get("appetizers")!, name: "Chicken Jhol Momo", slug: "chicken-jhol-momo", description: "Steamed dumplings served with spicy homemade momo soup.", price: "14.99", hasSpiceOptions: false, sortOrder: 11 },
    { categoryId: catMap.get("appetizers")!, name: "Lamb Jhol Momo", slug: "lamb-jhol-momo", description: "Steamed dumplings served with spicy homemade momo soup.", price: "16.99", hasSpiceOptions: false, sortOrder: 12 },

    // --- Vegetarian ---
    { categoryId: catMap.get("vegetarian")!, name: "Aloo Matar", slug: "aloo-matar", description: "Green snow peas and potato cooked with onion and tomato sauce.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("vegetarian")!, name: "Aloo Cauli Ko Tarkari", slug: "aloo-cauli", description: "Potatoes and cauliflower sauteed with garlic, and cooked with onion and tomato sauce.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 1 },
    { categoryId: catMap.get("vegetarian")!, name: "Chana Masala", slug: "chana-masala", description: "Garbanzo beans cooked with special herbs and spices in Taste of the Himalayas gravy.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 2 },
    { categoryId: catMap.get("vegetarian")!, name: "Bhindi Karahi", slug: "bhindi-karahi", description: "Himalayan style cut okras cooked in special curry sauce.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 3 },
    { categoryId: catMap.get("vegetarian")!, name: "Matar Paneer", slug: "matar-paneer", description: "Green peas cooked in creamy gravy of onion and tomatoes along with herbs and spices with homemade cheese cubes.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 4 },
    { categoryId: catMap.get("vegetarian")!, name: "Palak Paneer", slug: "palak-paneer", description: "Minced spinach with fried cheese cubes in a light creamy sauce.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 5 },
    { categoryId: catMap.get("vegetarian")!, name: "Malai Kofta", slug: "malai-kofta", description: "Ball of mashed homemade cheese, potatoes, nuts and spices cooked with specially prepared creamy sauce.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 6 },
    { categoryId: catMap.get("vegetarian")!, name: "Mix Vegetable", slug: "mix-vegetable", description: "Seasonal mixed vegetables sauteed with garlic and cooked with special herbs and spices, onion and tomato base sauce.", price: "17.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 7 },
    { categoryId: catMap.get("vegetarian")!, name: "Aloo Bhanta", slug: "aloo-bhanta", description: "Eggplant and potato cooked with onion and tomato base special sauce.", price: "17.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 8 },
    { categoryId: catMap.get("vegetarian")!, name: "Potato Spinach", slug: "potato-spinach", description: "Potato and fresh spinach sauteed with garlic cooked with special herbs, spices in onion and tomato base sauce.", price: "17.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 9 },
    { categoryId: catMap.get("vegetarian")!, name: "Pumpkin Masala", slug: "pumpkin-masala", description: "Organic pumpkin cubes cooked in a special creamy sauce. (We can make vegan also)", price: "17.99", hasSpiceOptions: false, isVegetarian: true, isVeganOption: true, sortOrder: 10 },
    { categoryId: catMap.get("vegetarian")!, name: "Paneer Tikka Masala", slug: "paneer-tikka-masala", description: "Fried homemade paneer cubes cooked in special creamy sauce with herbs and spices.", price: "17.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 11 },
    { categoryId: catMap.get("vegetarian")!, name: "Vegetable Korma", slug: "vegetable-korma", description: "Seasonal mixed vegetables cooked in special creamy sauce with coconut milk.", price: "16.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 12 },
    { categoryId: catMap.get("vegetarian")!, name: "Daal Makhani", slug: "daal-makhani", description: "Black lentils, ginger, and garlic fried with tomatoes, onion, and herbs.", price: "17.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 13 },
    { categoryId: catMap.get("vegetarian")!, name: "Dal Tadka", slug: "dal-tadka", description: "Slow cooked yellow split daal tempered with garlic, ginger, red onions, jalapeno chilies, cumin and spices.", price: "16.99", hasSpiceOptions: false, isVegetarian: true, sortOrder: 14 },

    // --- Chicken ---
    { categoryId: catMap.get("chicken")!, name: "Chicken Curry", slug: "chicken-curry", description: "Boneless chicken cooked in house special sauce with herbs and spices.", price: "17.99", hasSpiceOptions: true, sortOrder: 0 },
    { categoryId: catMap.get("chicken")!, name: "Chicken Chili", slug: "chicken-chili", description: "Pan-fried chicken strips cooked with tomato sauce, green chili, onion, peppers.", price: "17.99", hasSpiceOptions: true, sortOrder: 1 },
    { categoryId: catMap.get("chicken")!, name: "Chicken Spinach", slug: "chicken-spinach", description: "Boneless chicken cooked with fresh chopped spinach and curry sauce.", price: "17.99", hasSpiceOptions: true, sortOrder: 2 },
    { categoryId: catMap.get("chicken")!, name: "Chicken Vindaloo", slug: "chicken-vindaloo", description: "Premium chicken cooked with potatoes in specially prepared vindaloo sauce and herbs.", price: "17.99", hasSpiceOptions: true, sortOrder: 3 },
    { categoryId: catMap.get("chicken")!, name: "Chicken Tikka Masala", slug: "chicken-tikka-masala", description: "Broiled boneless cubes of chicken breast cooked in a special creamy sauce with herbs and spices.", price: "18.99", hasSpiceOptions: true, sortOrder: 4 },
    { categoryId: catMap.get("chicken")!, name: "Chicken Nauni (Butter Chicken)", slug: "butter-chicken", description: "Premium chicken cooked in the Tandoor and then cooked in a creamy butter sauce.", price: "18.99", hasSpiceOptions: true, sortOrder: 5 },
    { categoryId: catMap.get("chicken")!, name: "Chicken Korma", slug: "chicken-korma", description: "Boneless chicken pieces cooked in a special creamy sauce with coconut milk.", price: "17.99", hasSpiceOptions: true, sortOrder: 6 },
    { categoryId: catMap.get("chicken")!, name: "Coconut Chicken", slug: "coconut-chicken", description: "Premium chicken cooked with coconut flakes in creamy sauce, herbs, and spices.", price: "18.99", hasSpiceOptions: false, sortOrder: 7 },

    // --- Lamb ---
    { categoryId: catMap.get("lamb")!, name: "Lamb Curry", slug: "lamb-curry", description: "Boneless lamb pieces cooked in house special sauce with different herbs and spices.", price: "18.99", hasSpiceOptions: true, sortOrder: 0 },
    { categoryId: catMap.get("lamb")!, name: "Lamb Tikka Masala", slug: "lamb-tikka-masala", description: "Marinated and broiled cubes of lamb cooked in a special creamy sauce with herbs and spices.", price: "19.99", hasSpiceOptions: true, sortOrder: 1 },
    { categoryId: catMap.get("lamb")!, name: "Lamb Spinach", slug: "lamb-spinach", description: "Boneless lamb pieces cooked with fresh spinach along with different herbs and spices.", price: "18.99", hasSpiceOptions: true, sortOrder: 2 },
    { categoryId: catMap.get("lamb")!, name: "Lamb Mushroom", slug: "lamb-mushroom", description: "Boneless lamb pieces cooked with fresh mushroom along with house special sauce.", price: "18.99", hasSpiceOptions: true, sortOrder: 3 },
    { categoryId: catMap.get("lamb")!, name: "Lamb Vindaloo", slug: "lamb-vindaloo", description: "Boneless lamb pieces cooked with potatoes in specially prepared vindaloo sauce.", price: "18.99", hasSpiceOptions: true, sortOrder: 4 },
    { categoryId: catMap.get("lamb")!, name: "Pumpkin Lamb", slug: "pumpkin-lamb", description: "Premium boneless lamb cubes and pumpkin cooked with special onion tomato sauce.", price: "18.99", hasSpiceOptions: false, sortOrder: 5 },
    { categoryId: catMap.get("lamb")!, name: "Lamb Korma", slug: "lamb-korma", description: "Boneless lamb cooked in a special creamy sauce with coconut milk.", price: "18.99", hasSpiceOptions: false, sortOrder: 6 },

    // --- Tandoori ---
    { categoryId: catMap.get("tandoori")!, name: "Chicken Tandoori", slug: "chicken-tandoori", description: "Chicken marinated in yogurt and spices, broiled in the Tandoor oven. Served sizzling with sauteed veggies.", price: "22.99", hasSpiceOptions: true, hasRiceChoice: true, sortOrder: 0 },
    { categoryId: catMap.get("tandoori")!, name: "Chicken Tandoori Tikka", slug: "chicken-tandoori-tikka", description: "Boneless chicken breast marinated with special herbs, spices and yogurt then baked in the Tandoor oven. Served sizzling with sauteed veggies.", price: "23.99", hasSpiceOptions: true, hasRiceChoice: true, sortOrder: 1 },
    { categoryId: catMap.get("tandoori")!, name: "Mixed Tandoor", slug: "mixed-tandoor", description: "Platter of Tandoor Chicken, Boti Kabab (Lamb), Shrimp Tandoor, and Chicken Tikka. Marinated and cooked in Tandoor oven. Served sizzling with sauteed veggies.", price: "25.99", hasSpiceOptions: false, hasRiceChoice: true, sortOrder: 2 },
    { categoryId: catMap.get("tandoori")!, name: "Atlantic Salmon Tandoor", slug: "salmon-tandoor", description: "Salmon fillet overnight marinated and broiled in Tandoor oven served to sizzle with vegetables.", price: "25.99", hasSpiceOptions: false, hasRiceChoice: true, sortOrder: 3 },
    { categoryId: catMap.get("tandoori")!, name: "Shrimp Tandoor", slug: "shrimp-tandoor", description: "Marinated jumbo shrimp with special herbs and spices, broiled in Tandoor oven, served sizzling with vegetables.", price: "25.99", hasSpiceOptions: false, hasRiceChoice: true, sortOrder: 4 },

    // --- Seafood ---
    { categoryId: catMap.get("seafood")!, name: "Salmon Curry", slug: "salmon-curry", description: "Salmon fillets cooked with house special sauce, different herbs and spices.", price: "18.99", hasSpiceOptions: true, sortOrder: 0 },
    { categoryId: catMap.get("seafood")!, name: "Salmon Vindaloo", slug: "salmon-vindaloo", description: "Salmon fish fillets cooked with potato, onion based specially prepared vindaloo sauce and herbs.", price: "18.99", hasSpiceOptions: true, sortOrder: 1 },
    { categoryId: catMap.get("seafood")!, name: "Salmon Tikka Masala", slug: "salmon-tikka-masala", description: "Salmon fish cooked in a creamy sauce with Indian spices.", price: "19.99", hasSpiceOptions: true, sortOrder: 2 },
    { categoryId: catMap.get("seafood")!, name: "Shrimp Korma", slug: "shrimp-korma", description: "Jumbo shrimps cooked with tomatoes and onion based korma sauce; sauteed with ginger, garlic and herbs.", price: "18.99", hasSpiceOptions: true, sortOrder: 3 },
    { categoryId: catMap.get("seafood")!, name: "Shrimp Vindaloo", slug: "shrimp-vindaloo", description: "Jumbo shrimps cooked with potatoes in specially prepared vindaloo sauce and herbs.", price: "18.99", hasSpiceOptions: true, sortOrder: 4 },
    { categoryId: catMap.get("seafood")!, name: "Shrimp Tikka Masala", slug: "shrimp-tikka-masala", description: "Shrimp cooked in a creamy sauce with Indian spices.", price: "19.99", hasSpiceOptions: true, sortOrder: 5 },

    // --- Biryani ---
    { categoryId: catMap.get("biryani")!, name: "Veg. Biryani", slug: "veg-biryani", description: "Tender pieces of homemade cheese and bell peppers cooked with basmati rice.", price: "17.99", hasSpiceOptions: true, isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("biryani")!, name: "Chicken Biryani", slug: "chicken-biryani", description: "Premium chicken cooked with basmati rice, mix of special herbs and spices.", price: "18.99", hasSpiceOptions: true, sortOrder: 1 },
    { categoryId: catMap.get("biryani")!, name: "Lamb Biryani", slug: "lamb-biryani", description: "Premium lamb cooked with basmati rice, mix of special herbs and spices.", price: "19.99", hasSpiceOptions: true, sortOrder: 2 },

    // --- House Special ---
    { categoryId: catMap.get("house-special")!, name: "Goat Curry", slug: "goat-curry", description: "Bone-in goat meat cooked in authentic Nepali style in house special sauce, herbs and spices. Served with rice and lentil soup.", price: "19.99", hasSpiceOptions: true, sortOrder: 0 },

    // --- Breads ---
    { categoryId: catMap.get("breads")!, name: "Plain Naan", slug: "plain-naan", description: "Traditionally baked in Tandoor oven.", price: "4.99", isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("breads")!, name: "Garlic Naan", slug: "garlic-naan", description: "Garlic and cilantro topping. Baked in Tandoor oven.", price: "5.99", isVegetarian: true, sortOrder: 1 },
    { categoryId: catMap.get("breads")!, name: "Onion Naan", slug: "onion-naan", description: "Onion stuffing. Baked in Tandoor oven.", price: "5.99", isVegetarian: true, sortOrder: 2 },
    { categoryId: catMap.get("breads")!, name: "Tandoori Roti", slug: "tandoori-roti", description: "Whole wheat prepared in Tandoor oven.", price: "4.99", isVegetarian: true, sortOrder: 3 },
    { categoryId: catMap.get("breads")!, name: "Coconut Naan", slug: "coconut-naan", description: "Coconut stuffed naan baked in Tandoor oven.", price: "5.99", isVegetarian: true, sortOrder: 4 },
    { categoryId: catMap.get("breads")!, name: "Herbal Naan", slug: "herbal-naan", description: "Fresh herbs baked in Tandoor oven.", price: "5.99", isVegetarian: true, sortOrder: 5 },
    { categoryId: catMap.get("breads")!, name: "Rosemary Naan", slug: "rosemary-naan", description: "Rosemary infused naan baked in Tandoor oven.", price: "5.99", isVegetarian: true, sortOrder: 6 },
    { categoryId: catMap.get("breads")!, name: "Paneer Paratha", slug: "paneer-paratha", description: "Paneer stuffed flatbread.", price: "6.99", isVegetarian: true, sortOrder: 7 },
    { categoryId: catMap.get("breads")!, name: "Plain Paratha", slug: "plain-paratha", description: "Layered whole wheat flatbread.", price: "5.99", isVegetarian: true, sortOrder: 8 },
    { categoryId: catMap.get("breads")!, name: "Onion Paratha", slug: "onion-paratha", description: "Onion stuffed flatbread.", price: "6.99", isVegetarian: true, sortOrder: 9 },
    { categoryId: catMap.get("breads")!, name: "Aloo Paratha", slug: "aloo-paratha", description: "Potato stuffed flatbread.", price: "6.99", isVegetarian: true, sortOrder: 10 },

    // --- Sides ---
    { categoryId: catMap.get("sides")!, name: "Basmati Rice", slug: "basmati-rice", description: "Steamed basmati rice.", price: "3.50", isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("sides")!, name: "Brown Rice", slug: "brown-rice", description: "Steamed brown rice.", price: "3.99", isVegetarian: true, sortOrder: 1 },
    { categoryId: catMap.get("sides")!, name: "Papad", slug: "papad", description: "Baked crispy thin lentil wafers.", price: "4.99", isVegetarian: true, sortOrder: 2 },
    { categoryId: catMap.get("sides")!, name: "Mango Chutney", slug: "mango-chutney", description: "Sweet mango chutney.", price: "6.99", isVegetarian: true, sortOrder: 3 },
    { categoryId: catMap.get("sides")!, name: "Mixed Pickle", slug: "mixed-pickle", description: "Spicy mixed pickle.", price: "6.99", isVegetarian: true, sortOrder: 4 },
    { categoryId: catMap.get("sides")!, name: "Raita", slug: "raita", description: "Yogurt with cucumber and spices.", price: "6.99", isVegetarian: true, sortOrder: 5 },
    { categoryId: catMap.get("sides")!, name: "Lentil Soup", slug: "lentil-soup", description: "16 oz. lentil soup.", price: "10.99", isVegetarian: true, sortOrder: 6 },

    // --- Desserts ---
    { categoryId: catMap.get("desserts")!, name: "Gulab Jamun", slug: "gulab-jamun", description: "Deep fried cheese balls in honey syrup.", price: "7.99", isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("desserts")!, name: "Rice Pudding (Kheer)", slug: "kheer", description: "Traditional rice pudding -- a sweet delight.", price: "7.99", isVegetarian: true, sortOrder: 1 },
    { categoryId: catMap.get("desserts")!, name: "Mango Kulfi", slug: "mango-kulfi", description: "Sweet Nepalese frozen dessert.", price: "7.99", isVegetarian: true, sortOrder: 2 },
    { categoryId: catMap.get("desserts")!, name: "Rasmalai", slug: "rasmalai", description: "Soft cheese patties soaked in sweetened milk.", price: "8.99", isVegetarian: true, sortOrder: 3 },

    // --- Beverages ---
    { categoryId: catMap.get("beverages")!, name: "Tea (Chai)", slug: "chai", description: "Authentic spiced Nepali tea.", price: "4.99", isVegetarian: true, sortOrder: 0 },
    { categoryId: catMap.get("beverages")!, name: "Mango Lassi", slug: "mango-lassi", description: "Sweet mango yogurt drink.", price: "4.99", isVegetarian: true, sortOrder: 1 },
    { categoryId: catMap.get("beverages")!, name: "Plain/Salt/Sweet Lassi", slug: "lassi", description: "Traditional yogurt drink -- plain, salted, or sweet.", price: "5.99", isVegetarian: true, sortOrder: 2 },
    { categoryId: catMap.get("beverages")!, name: "Soda", slug: "soda", description: "Coke, Diet Coke, or Sprite.", price: "3.99", isVegetarian: true, sortOrder: 3 },
    { categoryId: catMap.get("beverages")!, name: "Sparkling Water", slug: "sparkling-water", description: "Sparkling mineral water.", price: "4.99", isVegetarian: true, sortOrder: 4 },
    { categoryId: catMap.get("beverages")!, name: "Regular Water", slug: "regular-water", description: "Bottled water.", price: "2.99", isVegetarian: true, sortOrder: 5 },
    { categoryId: catMap.get("beverages")!, name: "Iced Tea", slug: "iced-tea", description: "Chilled tea.", price: "4.99", isVegetarian: true, sortOrder: 6 },
  ];

  await db.insert(menuItems).values(items);

  console.log(`Seeded ${categories.length} categories and ${items.length} menu items.`);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add seed script to package.json**

Add to `package.json` under `"scripts"`:

```json
"db:seed": "npx tsx src/db/seed.ts",
"db:generate": "npx drizzle-kit generate",
"db:push": "npx drizzle-kit push",
"db:studio": "npx drizzle-kit studio"
```

Also install tsx:

```bash
npm install -D tsx
```

- [ ] **Step 3: Run seed**

```bash
npm run db:seed
```

Expected: `Seeded 21 categories and 87 menu items.`

Verify in Supabase dashboard -> Table Editor -> `menu_items` table shows 87 rows.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add full Annapurna menu seed data with 87 items across 21 categories"
```

---

### Task 6: Build Layout Components (Header + Footer)

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create Header**

Create `src/components/layout/header.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reservations", label: "Reservations" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "Our Story" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-bold text-primary-dark">
          Annapurna
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
          <Link href="/menu">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-dark">
              Order Now
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm" aria-label="Open menu">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-background">
            <nav className="mt-8 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-surface" />
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Log In
                </Button>
              </Link>
              <Link href="/menu" onClick={() => setOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark">
                  Order Now
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create Footer**

Create `src/components/layout/footer.tsx`:

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-surface bg-primary-dark text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-serif text-2xl font-bold">Annapurna</h3>
            <p className="mt-2 text-sm text-primary-foreground/80">Taste of the Himalayas</p>
            <p className="mt-4 text-sm text-primary-foreground/70">
              Family-owned Nepali-Indian restaurant serving authentic Himalayan cuisine in the heart of Oakland.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/menu" className="hover:text-primary-foreground">Menu</Link></li>
              <li><Link href="/reservations" className="hover:text-primary-foreground">Reservations</Link></li>
              <li><Link href="/catering" className="hover:text-primary-foreground">Catering</Link></li>
              <li><Link href="/about" className="hover:text-primary-foreground">Our Story</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Hours</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
              <li>Open Daily</li>
              <li>11:00 AM -- 9:30 PM</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
              <li>948 Clay Street</li>
              <li>Oakland, CA 94607</li>
              <li>
                <a href="tel:510-250-9696" className="hover:text-primary-foreground">(510) 250-9696</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Annapurna. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Wire into root layout**

Update `src/app/layout.tsx` -- add Header and Footer to the body:

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter, DM_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annapurna -- Taste of the Himalayas",
  description:
    "Family-owned Nepali-Indian restaurant in Oakland, CA. Authentic momos, tikka masala, tandoori, and more. Order online for pickup or delivery.",
  keywords: ["Nepali food Oakland", "Indian restaurant Oakland", "momos", "tikka masala", "Annapurna"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${dmMono.variable}`}
    >
      <body className="font-sans bg-background text-foreground antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify layout renders**

```bash
npm run dev
```

Expected: Header with logo, nav links, "Order Now" button. Footer with hours, contact, links. Warm white background. Mobile hamburger menu works on small viewport.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add header and footer layout components with responsive nav"
```

---

### Task 7: Build Homepage

**Files:**
- Create: `src/components/home/hero-section.tsx`
- Create: `src/components/home/featured-dishes.tsx`
- Create: `src/components/home/story-section.tsx`
- Create: `src/components/home/info-section.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create Hero Section**

Create `src/components/home/hero-section.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center bg-primary-dark text-primary-foreground">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/90 to-primary-dark/70" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h1 className="font-serif text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
          Taste of the Himalayas
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/85 sm:text-xl">
          Authentic Nepali &amp; Indian cuisine made with love in Oakland.
          From handcrafted momos to sizzling tandoori -- every dish tells a story from the mountains.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/menu">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-base">
              Order Now
            </Button>
          </Link>
          <Link href="/reservations">
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 px-8 text-base"
            >
              Reserve a Table
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path
            d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 67.5C1200 60 1320 45 1380 37.5L1440 30V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create Featured Dishes**

Create `src/components/home/featured-dishes.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const featured = [
  {
    name: "Chicken Tikka Masala",
    description: "Broiled boneless cubes of chicken breast in a special creamy sauce with herbs and spices.",
    price: "$18.99",
    tag: "Most Popular",
  },
  {
    name: "Chicken Momo",
    description: "Steamed dumplings filled with minced chicken, onion, garlic, ginger, and cilantro.",
    price: "$14.99",
    tag: "Nepali Classic",
  },
  {
    name: "Mixed Tandoor",
    description: "Platter of Tandoor Chicken, Boti Kabab, Shrimp Tandoor, and Chicken Tikka. Served sizzling.",
    price: "$25.99",
    tag: "Chef's Pick",
  },
];

export function FeaturedDishes() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-primary-dark sm:text-4xl">Signature Dishes</h2>
        <p className="mt-3 text-muted">From the Himalayas to your table -- our most beloved creations.</p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((dish) => (
          <Card key={dish.name} className="overflow-hidden border-surface bg-surface/50 transition-shadow hover:shadow-lg">
            <div className="h-48 bg-gradient-to-br from-primary/20 to-gold/20" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-serif text-xl font-semibold">{dish.name}</h3>
                <span className="font-mono text-lg font-medium text-primary">{dish.price}</span>
              </div>
              <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">{dish.tag}</Badge>
              <p className="mt-3 text-sm text-muted">{dish.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create Story Section**

Create `src/components/home/story-section.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StorySection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="h-80 rounded-lg bg-gradient-to-br from-primary-dark/30 to-primary/20 lg:h-96" />
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary-dark sm:text-4xl">
              From the Himalayas to Oakland
            </h2>
            <p className="mt-6 text-muted leading-relaxed">
              Named after the majestic Annapurna mountain range -- the 10th highest peak in the world -- our family-owned restaurant brings the authentic flavors of Nepal and India to the heart of Oakland.
            </p>
            <p className="mt-4 text-muted leading-relaxed">
              Every dish is prepared with recipes passed down through generations, using fresh ingredients and traditional spices. From our handcrafted momos to our tandoor-fired specialties, we invite you to experience a taste of the Himalayas.
            </p>
            <Link href="/about" className="mt-8 inline-block">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Read Our Story
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create Info Section**

Create `src/components/home/info-section.tsx`:

```tsx
export function InfoSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary-dark">Visit Us</h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground">Hours</h3>
              <p className="mt-1 text-muted">Open Daily: 11:00 AM -- 9:30 PM</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Address</h3>
              <p className="mt-1 text-muted">948 Clay Street<br />Oakland, CA 94607</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Phone</h3>
              <p className="mt-1">
                <a href="tel:510-250-9696" className="text-primary hover:text-primary-dark">(510) 250-9696</a>
              </p>
            </div>
          </div>
        </div>

        <div className="h-80 overflow-hidden rounded-lg bg-surface">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3152.8!2d-122.27!3d37.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z948+Clay+St%2C+Oakland%2C+CA+94607!5e0!3m2!1sen!2sus!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Annapurna location"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Assemble homepage**

Replace `src/app/page.tsx`:

```tsx
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedDishes } from "@/components/home/featured-dishes";
import { StorySection } from "@/components/home/story-section";
import { InfoSection } from "@/components/home/info-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedDishes />
      <StorySection />
      <InfoSection />
    </>
  );
}
```

- [ ] **Step 6: Verify homepage renders**

```bash
npm run dev
```

Expected: Full homepage with hero (mountain silhouette, CTAs), featured dishes cards, story section, hours/map section. Mobile responsive. Warm saffron/cream color palette.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: build homepage with hero, featured dishes, story, and info sections"
```

---

### Task 8: Build Menu Page

**Files:**
- Create: `src/types/menu.ts`
- Create: `src/components/menu/dietary-badge.tsx`
- Create: `src/components/menu/menu-item-card.tsx`
- Create: `src/components/menu/menu-category-tabs.tsx`
- Create: `src/components/menu/menu-grid.tsx`
- Create: `src/app/menu/page.tsx`
- Create: `src/app/menu/menu-page-client.tsx`

- [ ] **Step 1: Create menu types**

Create `src/types/menu.ts`:

```ts
export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  hasSpiceOptions: boolean | null;
  hasRiceChoice: boolean | null;
  isVegetarian: boolean | null;
  isVeganOption: boolean | null;
  isGlutenFree: boolean | null;
  isAvailable: boolean | null;
  halfTrayPrice: string | null;
  fullTrayPrice: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isCatering: boolean | null;
  items: MenuItem[];
}
```

- [ ] **Step 2: Create DietaryBadge**

Create `src/components/menu/dietary-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";

interface DietaryBadgeProps {
  isVegetarian: boolean | null;
  isVeganOption: boolean | null;
  isGlutenFree: boolean | null;
}

export function DietaryBadge({ isVegetarian, isVeganOption, isGlutenFree }: DietaryBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {isVegetarian && (
        <Badge variant="outline" className="border-accent text-accent text-xs">Vegetarian</Badge>
      )}
      {isVeganOption && (
        <Badge variant="outline" className="border-yellow-600 text-yellow-600 text-xs">Vegan Option</Badge>
      )}
      {isGlutenFree && (
        <Badge variant="outline" className="border-blue-600 text-blue-600 text-xs">Gluten-Free</Badge>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create MenuItemCard**

Create `src/components/menu/menu-item-card.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DietaryBadge } from "./dietary-badge";
import type { MenuItem } from "@/types/menu";

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden border-surface bg-surface/50 transition-shadow hover:shadow-md">
      {item.imageUrl ? (
        <div className="h-40 bg-gradient-to-br from-primary/10 to-gold/10" />
      ) : null}

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold leading-tight">{item.name}</h3>
          <span className="shrink-0 font-mono text-base font-medium text-primary">${item.price}</span>
        </div>

        <DietaryBadge
          isVegetarian={item.isVegetarian}
          isVeganOption={item.isVeganOption}
          isGlutenFree={item.isGlutenFree}
        />

        {item.description && (
          <p className="mt-2 text-sm text-muted leading-relaxed">{item.description}</p>
        )}

        {item.hasSpiceOptions && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted">
            <span>Spice level:</span>
            <span className="text-foreground">Mild - Medium - Spicy</span>
          </div>
        )}

        {item.hasRiceChoice && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <span>Rice:</span>
            <span className="text-foreground">Basmati - Brown</span>
          </div>
        )}

        <Button className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary-dark" size="sm">
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create MenuCategoryTabs**

Create `src/components/menu/menu-category-tabs.tsx`:

```tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MenuCategoryTabsProps {
  categories: { slug: string; name: string }[];
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export function MenuCategoryTabs({ categories, activeCategory, onCategoryChange }: MenuCategoryTabsProps) {
  return (
    <Tabs value={activeCategory} onValueChange={onCategoryChange}>
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList className="inline-flex h-auto gap-2 bg-transparent p-0">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.slug}
              value={cat.slug}
              className="rounded-full border border-surface px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
```

- [ ] **Step 5: Create MenuGrid**

Create `src/components/menu/menu-grid.tsx`:

```tsx
import { MenuItemCard } from "./menu-item-card";
import type { MenuItem } from "@/types/menu";

interface MenuGridProps {
  items: MenuItem[];
}

export function MenuGrid({ items }: MenuGridProps) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-muted">No items in this category.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create Menu Page (server + client)**

Create `src/app/menu/page.tsx`:

```tsx
import { db } from "@/db";
import { menuCategories, menuItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { MenuPageClient } from "./menu-page-client";
import type { MenuCategory } from "@/types/menu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu -- Annapurna",
  description: "Explore our full menu of authentic Nepali and Indian dishes.",
};

export default async function MenuPage() {
  const categories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.isCatering, false))
    .orderBy(asc(menuCategories.sortOrder));

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true))
    .orderBy(asc(menuItems.sortOrder));

  const categoriesWithItems: MenuCategory[] = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.categoryId === cat.id),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-primary-dark">Our Menu</h1>
        <p className="mt-3 text-muted">Authentic Nepali &amp; Indian cuisine -- made fresh daily.</p>
      </div>
      <div className="mt-10">
        <MenuPageClient categories={categoriesWithItems} />
      </div>
    </div>
  );
}
```

Create `src/app/menu/menu-page-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MenuCategoryTabs } from "@/components/menu/menu-category-tabs";
import { MenuGrid } from "@/components/menu/menu-grid";
import type { MenuCategory } from "@/types/menu";

interface MenuPageClientProps {
  categories: MenuCategory[];
}

export function MenuPageClient({ categories }: MenuPageClientProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug ?? "");
  const activeCat = categories.find((c) => c.slug === activeCategory);

  return (
    <>
      <MenuCategoryTabs
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div className="mt-8">
        <MenuGrid items={activeCat?.items ?? []} />
      </div>
    </>
  );
}
```

- [ ] **Step 7: Verify menu page renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/menu`. Expected: Category tabs at top (scrollable on mobile), grid of menu items for selected category, prices in mono font, dietary badges, spice/rice options noted.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: build menu page with category tabs, item cards, and dietary badges"
```

---

### Task 9: Build About Page

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Create About page**

Create `src/app/about/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story -- Annapurna",
  description: "The story of Annapurna -- a family-owned Nepali-Indian restaurant named after the majestic Himalayan mountain.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-bold text-primary-dark sm:text-5xl">Our Story</h1>

      <div className="mt-10 space-y-8 text-muted leading-relaxed">
        <div className="h-64 rounded-lg bg-gradient-to-br from-primary-dark/20 to-primary/10 sm:h-80" />

        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Named After the Mountains</h2>
          <p>
            Annapurna -- the 10th highest mountain in the world, standing at 26,545 feet in the heart of the Himalayas. In Hindu mythology, Annapurna is also the goddess of food and nourishment. Our restaurant carries both meanings: the grandeur of the mountains and the sacred art of feeding others.
          </p>

          <h2 className="font-serif text-2xl font-semibold text-foreground">From Nepal to Oakland</h2>
          <p>
            We are a family-owned restaurant bringing the authentic flavors of Nepal and India to the heart of Oakland. Every recipe has been passed down through generations -- from the handcrafted momos that remind us of home to the tandoori specialties that fill our kitchen with the aromas of our ancestors.
          </p>

          <h2 className="font-serif text-2xl font-semibold text-foreground">Our Kitchen, Your Table</h2>
          <p>
            At Annapurna, we believe food is more than sustenance -- it is a bridge between cultures, a way to share stories, and a gift of love. We use fresh ingredients, traditional spices, and time-honored techniques to create dishes that honor our heritage while welcoming our Oakland community to the table.
          </p>
          <p>
            Whether you are joining us for a quick lunch, a family dinner, or ordering your favorite momos for delivery -- we are grateful to share a taste of the Himalayas with you.
          </p>
        </div>

        <div className="rounded-lg bg-surface p-8 text-center">
          <h3 className="font-serif text-xl font-semibold text-foreground">Come Visit Us</h3>
          <p className="mt-2 text-muted">948 Clay Street, Oakland, CA 94607</p>
          <p className="text-muted">Open Daily: 11:00 AM -- 9:30 PM</p>
          <p className="mt-2">
            <a href="tel:510-250-9696" className="font-medium text-primary hover:text-primary-dark">(510) 250-9696</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify about page**

```bash
npm run dev
```

Navigate to `http://localhost:3000/about`. Expected: Clean storytelling page with Annapurna narrative, warm tones, contact CTA.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Our Story page with Annapurna narrative"
```

---

### Task 10: Type-check and Final Verification

**Files:** None new -- verification only.

- [ ] **Step 1: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Manual smoke test**

```bash
npm run start
```

Check:
- Homepage: Hero, featured dishes, story, info/map all render
- Menu: Categories load from DB, tabs work, items display with prices and badges
- About: Story content renders
- Header: All nav links work, mobile menu works
- Footer: Hours, address, phone visible
- Responsive: Check on mobile viewport (375px width)

- [ ] **Step 5: Commit any fixes if needed**

```bash
git add .
git commit -m "fix: resolve type-check and build issues"
```

---

## Phase 1 Complete

At this point you have:
- Next.js 15 project with TypeScript strict
- Supabase PostgreSQL with full schema (all tables for future phases)
- 87 menu items seeded across 12 dine-in + 9 catering categories
- Branded homepage with hero, featured dishes, story, and info sections
- Interactive menu page with category tabs and item cards
- About page with restaurant narrative
- Responsive header + footer
- Warm saffron/cream Annapurna brand theme

**Next:** Phase 2 -- Cart + Ordering (Stripe Checkout integration)
