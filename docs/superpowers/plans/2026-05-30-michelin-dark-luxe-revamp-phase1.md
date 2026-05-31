# Michelin Dark-Luxe Revamp — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Annapurna site from warm/rustic to a dark fine-dining "Michelin" aesthetic (near-black espresso + gold, Jost + Inter), retire the playful bento drag-hero, and present dual Pickup/Delivery order CTAs (Delivery stubbed until Phase 3).

**Architecture:** Centralize the new palette in one `luxe` constants module (DRY). Set Jost/Inter as CSS-variable fonts in `layout.tsx` and flip the global theme + `<body>` to dark. Decompose the monolithic `page.tsx` homepage into focused `home/luxe/*` section components, then compose them in a thin `page.tsx`. Re-skin the live shell (`TerracottaShell`) and the menu page in place. Verification is `next build` + browser visual checks (this is visual frontend work, not unit-testable).

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4 (`@theme` in `globals.css`), `next/font/google`, `motion` (already installed), `lucide-react`, `next/image`.

---

## Conventions for every task

- **Colors/fonts:** import from `@/lib/theme` (`luxe`) for inline `style` colors; use Tailwind utilities for layout. Fonts via `style={{ fontFamily: "var(--font-display)" }}` (headings) / inherited Inter body.
- **Images:** keep `next/image`; both CDN hosts already in `next.config.ts` remotePatterns. Hero/above-fold images get `priority`.
- **Motion:** `motion/react`, gate all motion behind `useReducedMotion()`.
- **Next docs gate (AGENTS.md):** before editing `layout.tsx` fonts, skim `node_modules/next/dist/docs/` for the current `next/font/google` API. Follow it verbatim.
- **Per-task verification baseline:** `npm run build` must stay green and `/` must stay statically prerendered (`○ /` in the route table).

---

### Task 1: Luxe palette constants (DRY foundation)

**Files:**
- Create: `src/lib/theme.ts`

- [ ] **Step 1: Create the palette module**

```ts
// src/lib/theme.ts
// Single source of truth for the dark fine-dining palette.
// Use for inline style colors; layout utilities stay in Tailwind classes.
export const luxe = {
  bg: "#14100D",        // page background — espresso near-black
  surface: "#1C1712",   // raised cards / sections
  ink: "#F3E9D6",       // primary text — warm cream
  muted: "#8A8276",     // secondary text
  gold: "#C9A24B",      // primary accent / CTAs / active state
  ember: "#B9742F",     // sparing warm secondary (hover)
  line: "rgba(201,162,75,0.15)", // hairline borders / dividers
} as const;

export type LuxeColor = keyof typeof luxe;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat: add luxe dark palette constants"
```

---

### Task 2: Global theme tokens → dark luxe

**Files:**
- Modify: `src/app/globals.css` (the `@theme { … }` block near the top)

- [ ] **Step 1: Replace the color tokens in the `@theme` block**

Find the existing color custom properties in `@theme` and replace their values (keep the radius/font lines that follow):

```css
@theme {
  --color-primary: #C9A24B;
  --color-primary-dark: #B9742F;
  --color-secondary: #C9A24B;
  --color-background: #14100D;
  --color-surface: #1C1712;
  --color-foreground: #F3E9D6;
  --color-muted: #8A8276;
  --color-accent: #C9A24B;
  --color-gold: #C9A24B;
  --color-primary-foreground: #14100D;
  --color-secondary-foreground: #14100D;
  --color-accent-foreground: #14100D;

  --font-sans: var(--font-body);
  --font-serif: var(--font-display);
  --font-mono: var(--font-body);

  --radius-lg: 0.5rem;
  --radius-md: 0.25rem;
  --radius-sm: 0.125rem;
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS, `○ /` still static.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: dark-luxe global theme tokens"
```

---

### Task 3: Fonts (Jost + Inter) and dark body

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Skim the Next font docs**

Run: `ls node_modules/next/dist/docs/ && grep -rl "next/font" node_modules/next/dist/docs/ | head`
Read the matched `next/font` guide to confirm the `next/font/google` import + `variable` usage for this Next version.

- [ ] **Step 2: Replace font imports, variables, and body styling**

Replace the font import block and the `<html>`/`<body>` wrapper:

```tsx
import type { Metadata } from "next";
import { Jost, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/preview-cart";
import { TerracottaShell } from "@/components/preview/terracotta/shell";

const display = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annapurna — A tasting of the Himalayas · Oakland",
  description:
    "Family-run Himalayan kitchen at 948 Clay Street, Oakland, since 2010. Order pickup or delivery. Open daily 11:00–21:30.",
  keywords: [
    "Nepali food Oakland",
    "Himalayan restaurant Oakland",
    "Annapurna",
    "momos",
    "butter chicken",
    "biryani",
    "948 Clay Street",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
    >
      <body
        style={{
          backgroundColor: "#14100D",
          color: "#F3E9D6",
          fontFamily: "var(--font-body), sans-serif",
        }}
        className="antialiased min-h-screen"
      >
        <CartProvider>
          <TerracottaShell>{children}</TerracottaShell>
        </CartProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS. (Page will look broken/mixed until later tasks — that's fine.)

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: Jost + Inter fonts, dark body shell"
```

---

### Task 4: Shared Order CTA (Pickup + Delivery stub)

**Files:**
- Create: `src/components/home/luxe/order-cta.tsx`

Reusable dual CTA used by hero and order band. Pickup links to `/menu`; Delivery is a stub that reveals an inline "launching soon" notice (no dead link, no fake success) — to be wired to the real delivery flow in Phase 3.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { luxe } from "@/lib/theme";

const BTN =
  "font-medium uppercase tracking-[0.18em] text-[11px] px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition";

export function OrderCTA({ align = "left" }: { align?: "left" | "center" }) {
  const [showDelivery, setShowDelivery] = useState(false);

  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div
        className={`flex flex-wrap gap-3 ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        <Link
          href="/menu"
          className={BTN}
          style={{ backgroundColor: luxe.gold, color: luxe.bg }}
        >
          Order Pickup
        </Link>
        <button
          type="button"
          onClick={() => setShowDelivery((v) => !v)}
          aria-expanded={showDelivery}
          className={BTN}
          style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}
        >
          Order Delivery
        </button>
      </div>
      {showDelivery && (
        <p
          role="status"
          className="mt-3 text-[12px] tracking-wide"
          style={{ color: luxe.muted }}
        >
          Delivery is launching soon via DoorDash. For now, order pickup or call{" "}
          <a href="tel:+15102509696" style={{ color: luxe.gold }}>
            (510)&nbsp;250-9696
          </a>
          .
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/luxe/order-cta.tsx
git commit -m "feat: dual Pickup/Delivery order CTA with delivery stub"
```

---

### Task 5: Luxe Hero (replaces bento drag-hero)

**Files:**
- Create: `src/components/home/luxe/hero.tsx`

Full-bleed cinematic hero with dark vignette, top info strip, wordmark, tagline, and the OrderCTA. Subtle reduced-motion-aware fade-in.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "./order-cta";

export function LuxeHero() {
  const reduce = useReducedMotion();
  const rise = reduce
    ? { initial: false as const, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section className="relative min-h-[88vh] lg:min-h-[92vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=2200&q=90&auto=format&fit=crop"
          alt="Butter chicken, plated"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.5 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 95% at 70% 22%, rgba(0,0,0,0.05), #14100D 86%)",
          }}
        />
      </div>

      {/* Top info strip */}
      <div className="absolute top-5 left-0 right-0 z-10">
        <div
          className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em]"
          style={{ color: luxe.muted }}
        >
          <span className="hidden sm:inline">Oakland · Est. 2010</span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#7C9A6B" }}
            />
            Open · til 21:30
          </span>
          <span className="hidden sm:inline">948 Clay St</span>
        </div>
      </div>

      <motion.div
        {...rise}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mx-auto max-w-7xl w-full px-6 lg:px-10 pb-16 lg:pb-24"
      >
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-5"
          style={{ color: luxe.gold }}
        >
          A Himalayan Kitchen
        </p>
        <h1
          className="uppercase leading-[0.95]"
          style={{
            color: luxe.ink,
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            letterSpacing: "0.14em",
            fontSize: "clamp(3rem, 11vw, 8.5rem)",
          }}
        >
          Annapurna
        </h1>
        <p
          className="mt-5 max-w-xl text-[15px] lg:text-base leading-relaxed"
          style={{ color: "#D8C9A6" }}
        >
          Momo, live tandoor, and slow-cooked biryani — served by the family
          that has run the kitchen since 2010.
        </p>
        <div className="mt-9">
          <OrderCTA />
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/luxe/hero.tsx
git commit -m "feat: cinematic dark-luxe hero"
```

---

### Task 6: Kitchen statement section

**Files:**
- Create: `src/components/home/luxe/kitchen-statement.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { luxe } from "@/lib/theme";

export function KitchenStatement() {
  return (
    <section
      className="py-24 lg:py-32"
      style={{ borderTop: `1px solid ${luxe.line}` }}
    >
      <div className="mx-auto max-w-3xl px-6 lg:px-10 text-center">
        <div
          className="mx-auto mb-6 h-px w-9"
          style={{ backgroundColor: luxe.gold }}
        />
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-6"
          style={{ color: luxe.gold }}
        >
          The Kitchen
        </p>
        <h2
          className="leading-[1.15]"
          style={{
            color: luxe.ink,
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            letterSpacing: "0.02em",
            fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
          }}
        >
          A tasting of the Himalayas, plated with patience.
        </h2>
        <p
          className="mt-6 text-[15px] leading-[1.8] max-w-xl mx-auto"
          style={{ color: luxe.muted }}
        >
          Every momo hand-pleated each morning. Paneer pressed by hand. The
          tandoor lit before dawn. Nothing leaves the kitchen unless we would
          serve it at our own table.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/luxe/kitchen-statement.tsx
git commit -m "feat: kitchen statement section"
```

---

### Task 7: Signature dishes grid

**Files:**
- Create: `src/components/home/luxe/signature-grid.tsx`

Still grid (no drag), real menu dishes, gold caption + price, hover zoom (motion-gated).

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import Link from "next/link";
import { menu } from "@/data/menu";
import { luxe } from "@/lib/theme";

const IDS = [
  "appetizer-chicken-momo",
  "vegetarian-dish-palak-paneer",
  "biryani-lamb-biryani",
  "chicken-dish-chicken-nauni-butter-chicken",
];

const dishes = IDS.map((id) => menu.find((m) => m.id === id)).filter(
  (m): m is NonNullable<typeof m> => Boolean(m),
);

export function SignatureGrid() {
  return (
    <section
      className="py-24 lg:py-32"
      style={{ borderTop: `1px solid ${luxe.line}` }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="text-center mb-14">
          <div
            className="mx-auto mb-6 h-px w-9"
            style={{ backgroundColor: luxe.gold }}
          />
          <p
            className="text-[10px] uppercase tracking-[0.34em]"
            style={{ color: luxe.gold }}
          >
            House Signatures
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {dishes.map((d) => (
            <Link
              key={d.id}
              href="/menu"
              className="group relative block aspect-[3/4] overflow-hidden rounded-[3px]"
            >
              <Image
                src={d.image}
                alt={d.name}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(20,16,13,0.92))",
                }}
              />
              <div className="absolute left-4 right-4 bottom-4">
                <h3
                  className="text-[15px] leading-tight"
                  style={{ color: luxe.ink, fontFamily: "var(--font-display)" }}
                >
                  {d.name}
                </h3>
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: luxe.gold }}
                >
                  ${d.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/luxe/signature-grid.tsx
git commit -m "feat: signature dishes grid"
```

---

### Task 8: Craft section ("never speed up")

**Files:**
- Create: `src/components/home/luxe/craft.tsx`

Reuses the existing `craftMoments` data (copy it into this file so the section is self-contained), restyled dark with hairline borders.

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import { luxe } from "@/lib/theme";

const moments = [
  {
    label: "Hand-pleated",
    detail: "Every momo, every morning",
    img: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=1100&q=85&auto=format&fit=crop",
  },
  {
    label: "Live tandoor",
    detail: "650°C clay oven since 2010",
    img: "https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg",
  },
  {
    label: "House-pressed paneer",
    detail: "Monday mornings, by hand",
    img: "https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg",
  },
  {
    label: "Slow-cooked",
    detail: "Rogan josh, six hours",
    img: "https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg",
  },
];

export function Craft() {
  return (
    <section
      className="py-24 lg:py-32"
      style={{ borderTop: `1px solid ${luxe.line}` }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="text-center mb-14">
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-5"
            style={{ color: luxe.gold }}
          >
            The Work
          </p>
          <h2
            className="leading-[1.1] mx-auto max-w-[16ch]"
            style={{
              color: luxe.ink,
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
            }}
          >
            Four things we never speed up.
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {moments.map((m, i) => (
            <figure
              key={i}
              className="relative aspect-[3/4] overflow-hidden rounded-[3px]"
              style={{ border: `1px solid ${luxe.line}` }}
            >
              <Image
                src={m.img}
                alt={m.label}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20,16,13,0.15) 20%, rgba(20,16,13,0.9) 100%)",
                }}
              />
              <figcaption className="absolute bottom-5 left-5 right-5">
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-1.5"
                  style={{ color: luxe.gold }}
                >
                  № {String(i + 1).padStart(2, "0")}
                </p>
                <p
                  className="text-lg leading-tight"
                  style={{ color: luxe.ink, fontFamily: "var(--font-display)" }}
                >
                  {m.label}
                </p>
                <p className="text-[12px] mt-1" style={{ color: luxe.muted }}>
                  {m.detail}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/luxe/craft.tsx
git commit -m "feat: craft section (dark luxe)"
```

---

### Task 9: Story / visit + order band

**Files:**
- Create: `src/components/home/luxe/visit.tsx`

Combines the "come see us" address block with the closing dual-CTA, on a cinematic dark image.

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "./order-cta";

export function Visit() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg"
          alt="Biryani"
          fill
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.4 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #14100D 0%, rgba(20,16,13,0.85) 50%, rgba(20,16,13,0.7) 100%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-5"
            style={{ color: luxe.gold }}
          >
            Come See Us
          </p>
          <h2
            className="leading-[1.05] mb-10"
            style={{
              color: luxe.ink,
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(2rem, 6vw, 4rem)",
            }}
          >
            Ten minutes from Lake Merritt BART.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {[
              { k: "Address", a: "948 Clay Street", b: "Oakland, CA 94607" },
              { k: "Hours", a: "Open daily", b: "11:00 — 21:30" },
              { k: "Call", a: "(510) 250-9696", b: "", href: "tel:+15102509696" },
            ].map((c) => (
              <div key={c.k}>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-2"
                  style={{ color: luxe.muted }}
                >
                  {c.k}
                </p>
                {c.href ? (
                  <a href={c.href} className="text-[15px]" style={{ color: luxe.ink }}>
                    {c.a}
                  </a>
                ) : (
                  <p className="text-[15px]" style={{ color: luxe.ink }}>
                    {c.a}
                  </p>
                )}
                {c.b && (
                  <p className="text-[15px]" style={{ color: luxe.ink }}>
                    {c.b}
                  </p>
                )}
              </div>
            ))}
          </div>
          <OrderCTA />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/luxe/visit.tsx
git commit -m "feat: visit + closing order band"
```

---

### Task 10: Luxe footer

**Files:**
- Create: `src/components/home/luxe/footer.tsx`

Replaces the inline footer + `FooterCol` in `page.tsx`. Links point only at routes that exist (`/menu`, `/about`, `/preview`, tel, maps) — no `/press`, `/careers`, `/reservations`, `/catering` (those routes are not implemented).

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";
import { luxe } from "@/lib/theme";

function Col({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[0.3em] mb-4"
        style={{ color: luxe.gold }}
      >
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[13px] transition hover:opacity-100"
              style={{ color: luxe.muted }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LuxeFooter() {
  return (
    <footer
      className="pt-20 pb-10"
      style={{ borderTop: `1px solid ${luxe.line}`, backgroundColor: luxe.bg }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div>
          <span
            className="uppercase tracking-[0.14em] text-2xl"
            style={{ color: luxe.ink, fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            Annapurna
          </span>
          <p
            className="mt-4 max-w-sm text-[14px] leading-[1.8]"
            style={{ color: luxe.muted }}
          >
            A family-run Himalayan kitchen in downtown Oakland. Open since 2010,
            cooking the recipes we grew up on.
          </p>
        </div>
        <Col
          title="Order"
          links={[
            { href: "/menu", label: "Full menu" },
            { href: "/menu", label: "Pickup" },
          ]}
        />
        <Col
          title="Visit"
          links={[
            { href: "/about", label: "Our story" },
            {
              href: "https://maps.google.com/?q=948+Clay+Street+Oakland+CA",
              label: "Directions",
            },
            { href: "tel:+15102509696", label: "(510) 250-9696" },
          ]}
        />
      </div>
      <div
        className="mx-auto max-w-7xl px-6 lg:px-10 mt-14 pt-6 text-[11px]"
        style={{ borderTop: `1px solid ${luxe.line}`, color: luxe.muted }}
      >
        © 2026 Annapurna · 948 Clay Street, Oakland CA
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/luxe/footer.tsx
git commit -m "feat: dark luxe footer"
```

---

### Task 11: Compose the new homepage

**Files:**
- Modify: `src/app/page.tsx` (full replacement)

Replace the entire file with a thin composition. This deletes the bento hero usage, the warm sections, `Stat`, `BentoCard`, `FooterCol`, the inline footer, and the sticky mobile CTA (the shell already has a persistent Order affordance).

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import { LuxeHero } from "@/components/home/luxe/hero";
import { KitchenStatement } from "@/components/home/luxe/kitchen-statement";
import { SignatureGrid } from "@/components/home/luxe/signature-grid";
import { Craft } from "@/components/home/luxe/craft";
import { Visit } from "@/components/home/luxe/visit";
import { LuxeFooter } from "@/components/home/luxe/footer";

export default function HomePage() {
  return (
    <>
      <LuxeHero />
      <KitchenStatement />
      <SignatureGrid />
      <Craft />
      <Visit />
      <LuxeFooter />
    </>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS, `○ /` static. (The now-unused `bento-hero.tsx` and `interactive-bento-gallery.tsx` remain in the repo but are no longer imported — that is intentional per spec.)

- [ ] **Step 3: Visual check**

Run `npm run dev`, open `http://localhost:3000`, screenshot the homepage. Confirm: dark espresso bg, gold accents, Jost wordmark, dual Order CTAs, all sections render, no warm cream remnants. Click "Order Delivery" → inline "launching soon" notice appears.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: compose dark-luxe homepage, retire bento hero"
```

---

### Task 12: Re-skin the shell (header + cart drawer + toast)

**Files:**
- Modify: `src/components/preview/terracotta/shell.tsx`

Apply the dark-luxe palette to the header, cart drawer, and added-toast. Keep all cart logic unchanged; only colors/fonts/labels change. Mapping to apply throughout the file:

| Old | New |
|---|---|
| `#FDF4E4` (cream bg) | `#1C1712` (surface) for drawer; `#14100D` for header |
| `#2B1E16` (dark) text/btn | `#F3E9D6` text; `#C9A24B` for primary buttons |
| `#C85A3C` accent | `#C9A24B` (gold) |
| `#F2A545` gold | `#C9A24B` (gold) |
| `var(--font-instrument), serif` | `var(--font-display)` (Jost), uppercase tracking for wordmark |
| border `#2B1E16/8`,`/10` | `rgba(201,162,75,0.15)` hairlines |
| "Demo mode · no real charge" | keep (still demo until Phase 2) |

- [ ] **Step 1: Header — replace the `<header>` block**

```tsx
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ backgroundColor: "rgba(20,16,13,0.85)", borderBottom: "1px solid rgba(201,162,75,0.15)" }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          <a
            href="tel:+15102509696"
            className="hidden sm:inline text-[10px] uppercase tracking-[0.25em]"
            style={{ color: "#8A8276" }}
          >
            (510) 250-9696
          </a>

          <Link href="/" className="flex items-center">
            <span
              className="uppercase tracking-[0.16em] text-xl"
              style={{ color: "#C9A24B", fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Annapurna
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[12px] uppercase tracking-[0.14em]">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="transition"
                  style={{ color: active ? "#C9A24B" : "#8A8276" }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {!isHome && (
              <Link
                href="/menu"
                className="hidden sm:inline-flex rounded-[2px] px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-medium transition"
                style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
              >
                Order
              </Link>
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative rounded-full h-10 w-10 flex items-center justify-center transition"
              style={{ border: "1px solid rgba(201,162,75,0.4)", color: "#C9A24B" }}
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
```

- [ ] **Step 2: Update the nav label "Kitchen" → keep as is** (the `nav` array stays: Home / Menu / Kitchen). No change needed.

- [ ] **Step 3: Cart drawer + toast — apply the color mapping table**

In `CartDrawer`, change: backdrop `bg-[#2B1E16]/50` → inline `style={{ backgroundColor: "rgba(0,0,0,0.6)" }}`; panel `bg-[#FDF4E4]` → `style={{ backgroundColor: "#1C1712", color: "#F3E9D6" }}`; all `#2B1E16` borders → `rgba(201,162,75,0.15)`; the serif headings `var(--font-instrument), serif` → `var(--font-display)`; accent `#C85A3C` and `#F2A545` → `#C9A24B`; the empty-state bag circle bg → `rgba(201,162,75,0.15)`; line-item thumbnail keeps raw `<img>` (drawer is fine as-is, not LCP). In `AddedToast`, toast bg `#2B1E16` → `#1C1712` with `border:1px solid rgba(201,162,75,0.3)`; check badge `#F2A545` → `#C9A24B`; "View bag" button `#C85A3C` → `#C9A24B` text `#14100D`.

(Apply mechanically — every hardcoded warm hex in the file maps per the table. No structural/logic changes.)

- [ ] **Step 4: Build + visual check**

Run: `npm run build` (PASS). Then in dev, open the cart (cart icon) on `/menu`, add an item, confirm drawer + toast are dark/gold and readable.

- [ ] **Step 5: Commit**

```bash
git add src/components/preview/terracotta/shell.tsx
git commit -m "feat: re-skin shell header, cart drawer, toast to dark luxe"
```

---

### Task 13: Re-skin the menu page

**Files:**
- Modify: `src/app/menu/page.tsx`

Apply the same color mapping; keep all filtering/cart logic. Specific changes:

- Header: drop the warm radial blur glow (`#F2A545` radial) → replace with subtle `rgba(201,162,75,0.06)` or remove. Eyebrow `var(--font-caveat)` script line "what's cooking today" → replace with uppercase gold label `<p style={{color:"#C9A24B"}} class="text-[10px] uppercase tracking-[0.34em]">The Menu</p>`. `h1` "The full menu." → keep text, `style={{fontFamily:"var(--font-display)", fontWeight:200}}`, color `#F3E9D6`; drop the `<em>` terracotta.
- Body copy `#2B1E16/75` → `#8A8276`.
- Mode switch pill: bg `#2B1E16/8` → `rgba(201,162,75,0.1)`; active `bg-[#2B1E16] text-[#FDF4E4]` → `style={{backgroundColor:"#C9A24B", color:"#14100D"}}`; inactive text `#8A8276`.
- **Search input fix (the 390px overflow):** change `min-w-[220px]` → `min-w-0`, keep `flex-1`, so it no longer overflows on small screens. Input bg `white` → `#1C1712`, border `rgba(201,162,75,0.2)`, text `#F3E9D6`, placeholder `#8A8276`, focus ring gold.
- Veg toggle: active `#4A6B4A` keep (green reads fine on dark); inactive bg `white` → `#1C1712` border hairline.
- Category pills: active `#C85A3C` → `#C9A24B` (`color:#14100D`); inactive bg `white` → `#1C1712`, hairline border, text `#8A8276`.
- `MenuCard`: card `bg-white border-[#2B1E16]/6` → `style={{backgroundColor:"#1C1712", border:"1px solid rgba(201,162,75,0.15)"}}`; image bg `#F2A545/10` → `#14100D`; name serif → `var(--font-display)` color `#F3E9D6`; price chip `#F2A545/25 text-[#C85A3C]` → `style={{backgroundColor:"rgba(201,162,75,0.15)", color:"#C9A24B"}}`; description `#2B1E16/65` → `#8A8276`; "Add to bag" button `#2B1E16→#C85A3C` → `style={{backgroundColor:"#C9A24B", color:"#14100D"}}`; qty stepper bg `#2B1E16/5` → `rgba(201,162,75,0.1)`, hover text gold; "Popular" badge `#FDF4E4 text-[#C85A3C]` → `style={{backgroundColor:"#1C1712", color:"#C9A24B"}}`.
- Empty-state heading serif → `var(--font-display)`; "Clear filters" underline hover gold.

- [ ] **Step 1: Apply the changes above to `src/app/menu/page.tsx`**

(Mechanical palette swap + the `min-w-0` search fix + eyebrow/heading font swap. No logic changes.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS, `○ /menu` static.

- [ ] **Step 3: Visual check at 390px + desktop**

Dev server: open `/menu`. Confirm dark cards, gold prices/CTAs, readable text, search input does **not** overflow at 390px width, tabs/pills dark-gold, add-to-bag works.

- [ ] **Step 4: Commit**

```bash
git add src/app/menu/page.tsx
git commit -m "feat: re-skin menu page to dark luxe, fix mobile search overflow"
```

---

### Task 14: Checkout / admin token sweep + final verification

**Files:**
- Modify: `src/app/checkout/page.tsx` (token-level only)
- Modify: `src/app/admin/dashboard.tsx` (token-level only)
- Review: `src/components/admin/pin-gate.tsx`

These inherit the dark `<body>` already. Sweep any hardcoded warm hex (`#FDF4E4`, `#2B1E16`, `#C85A3C`, `#F2A545`) and `var(--font-instrument)`/`var(--font-caveat)` references to the luxe equivalents (`#14100D`/`#1C1712` surfaces, `#F3E9D6` text, `#C9A24B` accent, `var(--font-display)`), so no light-theme islands remain. No flow changes.

- [ ] **Step 1: Grep for stragglers across the app**

Run:
```bash
grep -rn "#FDF4E4\|#C85A3C\|#F2A545\|font-instrument\|font-caveat\|font-manrope" src/app src/components | grep -v "interactive-bento-gallery\|home/bento-hero"
```
Expected after edits: only the intentionally-orphaned bento files (excluded above) may remain. Fix every other hit per the palette mapping.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS; route table unchanged (`○ /`, `○ /menu`, `○ /checkout`, `ƒ /admin` …).

- [ ] **Step 3: Full visual pass (dev)**

Open `/`, `/menu`, `/checkout`, `/admin` at 1440px and 375px. Confirm: cohesive dark-luxe everywhere, AA contrast (cream text on espresso; gold only for large/accent text, not small body), 0 console errors, hero image carries `priority`, reduced-motion (emulate) disables hero/scroll motion.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/page.tsx src/app/admin/dashboard.tsx src/components/admin/pin-gate.tsx
git commit -m "feat: sweep checkout/admin to dark luxe tokens"
```

---

## Self-Review

**Spec coverage:**
- Tokens/palette → Task 1, 2. Fonts (Jost/Inter, remove Instrument/Caveat) → Task 3, swept in 12–14. Motion + reduced-motion → Tasks 5, 7 (+ existing pattern). Shell header/footer → Task 12 (header), Task 10 (footer; legacy `layout/footer.tsx` is dead code, out of scope per spec). Homepage sections (hero→statement→signatures→craft→story/visit→order band→footer) → Tasks 5–11. Bento hero retired → Task 11. Menu restyle + search overflow fix → Task 13. Dual Pickup/Delivery CTA with Delivery stub → Task 4, used in 5 & 9. Checkout/admin inherit dark → Task 14. Acceptance (build green, static `/`, 0 console errors, priority LCP, 375/768/1024/1440, reduced-motion, AA contrast) → verification steps in Tasks 11, 13, 14.
- Gap intentionally deferred: real ordering/payment = Phase 2 spec; Drive = Phase 3 spec. Not in this plan.

**Placeholder scan:** No "TBD"/"add error handling"/vague steps. Mapping tables in Tasks 12–14 are mechanical palette swaps with exact source→target values, not placeholders.

**Type/name consistency:** `luxe` keys (`bg/surface/ink/muted/gold/ember/line`) used consistently. `OrderCTA` signature (`align?: "left"|"center"`) matches both call sites. Component names match their import paths in Task 11.

## Notes / risks

- `next/font/google` for Jost requires the listed weights to exist (200–600 do). If a weight 404s at build, drop it from the `weight` array.
- Gold `#C9A24B` on `#14100D` ≈ 6:1 — fine for large text/UI, acceptable for small. Keep small body text in cream `#F3E9D6`, not gold.
- Orphaned `bento-hero.tsx` + `interactive-bento-gallery.tsx` stay in repo (spec: component file left, unused). They still typecheck/build since nothing imports them.
- `motion` is already a dependency; no install needed.
