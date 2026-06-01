# Admin Panel Rebuild — P0 + P1 Design

**Date:** 2026-05-31
**Status:** Approved (design); spec under review
**Scope of this document:** Phase 0 (Auth/RBAC + admin shell) and Phase 1 (Settings + pricing-to-DB). Later phases are summarized in the Roadmap section but specced separately.

---

## 1. Background & Problem

The admin area today is minimal and disconnected from the live system:

- **Admin dashboard reads `localStorage`, not the DB.** Real orders flow `POST /api/orders` → Postgres (Drizzle), but `src/app/admin/dashboard.tsx` reads `localStorage["annapurna:orders"]` via `src/lib/preview-order.ts`. The two stores never meet — placed orders are invisible to staff.
- **Tax is hardcoded** at `0.0925` in two places: `src/lib/orders/pricing.ts:7` (server, authoritative) and `src/lib/preview-cart.tsx:14` (client display). The seeded `restaurant_settings.tax_rate` row is never read.
- **Menu is static.** `src/data/menu.ts` is the source of truth for both display and server pricing (`pricing.ts`). The seeded `menu_items` / `menu_categories` tables are write-only — no runtime read.
- **Auth is a single shared PIN** (`STAFF_PIN`, default `1234`), httpOnly cookie value `"ok"`, **no middleware**, no roles, no per-session secret.
- **Delivery fee** is a live DoorDash Drive quote→accept (server-authoritative; correct). No admin control over markup/flat/threshold.
- **No Stripe.** No dependency, no integration; `create-order.ts` notes "no payment step yet." Orders are pay-on-handoff.

**Goal of the overall project:** make the database the source of truth and give staff a role-gated admin panel that controls menu, pricing, tax, delivery charges, hours, orders, promotions, reservations, and (eventually) payments.

**Goal of P0+P1 specifically:** stand up the secure, role-aware admin shell and make **tax + delivery charges** fully admin-controlled and live, by moving those values out of hardcoded constants into the DB and through the pricing engine.

---

## 2. Stack Facts (constraints to follow)

- Next.js **16.2.4**, React **19.2.4**, App Router.
- Drizzle ORM `0.45.2` + `postgres` (postgres.js). **No supabase-js** anywhere — DB access is Drizzle-only.
- shadcn/ui components present: `button`, `card`, `badge`, `tabs`, `separator`, `scroll-area`, `sheet`. Tailwind v4.
- Server actions used in exactly one place (`src/app/admin/actions.ts`); all other mutations are API routes.
- DoorDash JWT signing pattern exists in `src/lib/doordash/jwt.ts` (HS256 via Web Crypto) — reuse for session signing.
- Supabase project `zfnhcuvgvnflduqeiyin` (us-west-1), RLS enabled on all tables with no policies (Drizzle `postgres` role bypasses RLS). New tables must also have RLS enabled.

---

## 3. Decisions (locked during brainstorming)

1. **Full DB-backed** source of truth (menu price migration deferred to P3; tax + delivery in P1).
2. **Delivery model:** live DoorDash + markup, flat-fee override, free-delivery threshold, delivery radius / min order — all admin-configurable.
3. **Live orders:** polling (~10s), no realtime infra (P2).
4. **Roles:** Owner / Manager / Staff.
5. **Ops controls in scope:** 86/availability + store open-close, manual/phone order entry, discounts/promos, reservations + catering inbox (spread across P2–P5).
6. **Payments:** Stripe is greenfield → separate track, **last** (P6). Admin runs on pay-on-handoff with a manual paid/unpaid toggle until then.
7. **Login:** email + password for all staff (no per-staff numeric passcode in P0).
8. **Radius / min-order:** enforced at quote time, leaning on DoorDash's own undeliverable rejection (no separate geocoding service in P1).

---

## 4. P0 — Auth / RBAC + Admin Shell

### 4.1 Data model — `staff` table (migration `0003`)

| column | type | notes |
|---|---|---|
| `id` | uuid pk default gen_random_uuid() | |
| `name` | text not null | display name |
| `email` | text not null unique | login identifier (lowercased) |
| `password_hash` | text not null | scrypt (Node `crypto`, **no new dependency**) |
| `role` | text not null | `owner` \| `manager` \| `staff` |
| `is_active` | boolean not null default true | deactivate without delete |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | |

- RLS enabled, no policies (consistent with all tables; Drizzle bypasses).
- Drizzle table added to `src/db/schema.ts` as `staff`.

### 4.2 Password hashing

- `src/lib/auth/password.ts` — `hashPassword(plain)` / `verifyPassword(plain, hash)` using Node `crypto.scrypt` with a per-hash random salt, stored as `scrypt$N$salt$hash` (or similar self-describing string). Timing-safe compare. No external dependency.

### 4.3 Sessions

- `src/lib/auth/session.ts` — signs/verifies a session token `{ sid, role, exp }` with HMAC-SHA256 via Web Crypto, secret `STAFF_SESSION_SECRET`. Mirrors `src/lib/doordash/jwt.ts`.
- Cookie `annapurna_staff`: httpOnly, `sameSite: lax`, `secure` in production, path `/`, 8h TTL. Value = signed token (replaces the old static `"ok"`).
- Helpers: `getSession()` (reads + verifies cookie → `{sid, role}` | null), `requireSession()`, `requireRole(roles[])`.

### 4.4 Middleware enforcement

- **New `src/middleware.ts`** (first in project). `matcher`: `/admin/:path*`, `/api/admin/:path*` (excluding `/admin/login` and its action).
- Verifies cookie signature + expiry. Invalid/absent → redirect `/admin/login` (for pages) or `401 JSON` (for `/api/admin/*`).
- Middleware does coarse gate (authenticated or not). Fine-grained role checks happen in handlers via `requireRole`.

### 4.5 Role matrix

| Capability | Owner | Manager | Staff |
|---|---|---|---|
| View orders, advance status | ✅ | ✅ | ✅ |
| 86 / toggle item availability | ✅ | ✅ | ✅ |
| Menu CRUD (P3) | ✅ | ✅ | ❌ |
| Hours / pause ordering | ✅ | ✅ | ❌ |
| Promos (P5) | ✅ | ✅ | ❌ |
| Reservations / catering (P4) | ✅ | ✅ | ❌ |
| Tax / delivery / financial config | ✅ | ❌ | ❌ |
| Staff account management | ✅ | ❌ | ❌ |

### 4.6 Login flow & bootstrap

- `/admin/login` page: email+password form via `useActionState` server action (`signIn`), same pattern as the current PIN gate.
- `signIn` looks up active staff by email, verifies password, sets session cookie, redirects to `/admin`.
- `signOut` clears the cookie.
- **Bootstrap owner:** `src/db/seed-staff.ts` + `npm run db:seed:staff`. Creates an `owner` from `ADMIN_BOOTSTRAP_EMAIL` + `ADMIN_BOOTSTRAP_PASSWORD` if no owner exists; otherwise no-op. Run once after migration.
- Old `STAFF_PIN` flow and `src/components/admin/pin-gate.tsx` removed; `src/app/admin/actions.ts` rewritten.

### 4.7 Admin shell

- New `src/app/admin/layout.tsx`: tabbed nav (shadcn `tabs`/links), current-user chip, sign-out. Tabs filtered by role.
- Tabs: **Settings** is the new functional tab in P1. **Orders** keeps the *existing* dashboard view (still localStorage-backed) unchanged until P2 rebuilds it — it is wrapped in the new shell but not reworked here. **Menu, Promos, Reservations, Catering, Staff** render as stubs ("coming soon") so the shell is complete and later phases slot in.
- Staff-management tab (owner only) may ship a minimal create/deactivate staff UI in P0 (nice-to-have; can defer to its own mini-phase if it grows).

---

## 5. P1 — Settings + Pricing-to-DB

### 5.1 Settings service

- `src/lib/settings/index.ts` — typed accessor over `restaurant_settings` (key/jsonb).
  - `getSettings()`: reads all rows, merges over typed defaults, returns a typed object. Wrapped in React `cache()` for per-request memoization.
  - `getSetting(key)` / `updateSetting(key, value)`: upsert single key (owner/role-gated by caller).
- Typed shape (defaults in code; DB rows override):

  ```ts
  type Settings = {
    tax_rate: number;                 // e.g. 0.0925
    delivery: {
      mode: 'live' | 'flat';
      flatFeeCents: number;           // used when mode === 'flat'
      markupCents: number;            // added to live fee
      markupPercent: number;          // added to live fee (% of live fee)
      freeThresholdCents: number;     // 0 = disabled; subtotal ≥ threshold ⇒ free
      minOrderCents: number;          // reject delivery below this
      maxRadiusMiles: number;         // advisory; enforced via DoorDash rejection
    };
    ordering_paused: boolean;
    pickup_enabled: boolean;
    delivery_enabled: boolean;
  };
  ```

### 5.2 Pricing refactor

- `src/lib/orders/pricing.ts`:
  - `priceOrder()` becomes **async**; reads `tax_rate` from `getSettings()` instead of the module-level `TAX_RATE` constant. The constant is removed.
  - Menu item prices continue to come from the static `src/data/menu.ts` map in P1 (migration of menu prices to DB is P3). This is intentional and sequenced.
  - All callers (`src/lib/orders/create-order.ts`, anything invoking `priceOrder`) updated for the async signature.
- New `src/lib/orders/delivery-pricing.ts`:
  - `computeDeliveryFee({ doordashFeeCents, subtotalCents }, settings) → { feeCents, freeApplied }`.
  - Logic: if `mode==='flat'` → `flatFeeCents`; else `doordashFeeCents + markupCents + round(doordashFeeCents * markupPercent/100)`. Then if `freeThresholdCents>0 && subtotalCents>=freeThresholdCents` → `0`.
  - `assertDeliverable({ subtotalCents }, settings)`: throws if `subtotalCents < minOrderCents`. (Radius handled at quote time via DoorDash.)
- `src/app/api/orders/route.ts`:
  - After `acceptQuote()`, run the fee through `computeDeliveryFee` so admin config (markup/flat/threshold) is applied to the authoritative DoorDash fee before storing.
  - Enforce `ordering_paused` (503) and `minOrderCents` for delivery orders.
- `src/app/api/delivery/quote/route.ts`:
  - Enforce `ordering_paused` (503). Apply `computeDeliveryFee` to the quoted fee so the customer sees the same number that will be charged. Surface min-order / undeliverable as a structured error.

### 5.3 Client tax display

- New `GET /api/settings/public` → `{ tax_rate, pickup_enabled, delivery_enabled, ordering_paused, delivery: { freeThresholdCents, minOrderCents } }` (non-sensitive subset only).
- `src/lib/preview-cart.tsx` fetches this on mount instead of the hardcoded `0.0925`; removes the second hardcoded constant. Falls back to a sane default if the fetch fails (display-only; server remains authoritative).

### 5.4 Admin Settings tab UI

- `src/app/admin/settings/` (or a Settings panel within the layout) calling `/api/admin/settings`:
  - **Tax** (owner): rate input with % preview.
  - **Delivery** (owner): mode toggle (live/flat), markup $ + %, flat fee, free-delivery threshold, min order, max radius.
  - **Ordering** (manager+): pause-ordering switch, pickup/delivery enable toggles.
- `POST/PATCH /api/admin/settings` (role-gated via `requireRole`) → `updateSetting`. Validates and stores cents as integers, rate as number.

---

## 6. New / changed env vars

| var | purpose |
|---|---|
| `STAFF_SESSION_SECRET` | HMAC secret for signed session tokens (required) |
| `ADMIN_BOOTSTRAP_EMAIL` | initial owner email for `db:seed:staff` |
| `ADMIN_BOOTSTRAP_PASSWORD` | initial owner password for `db:seed:staff` |
| ~~`STAFF_PIN`~~ | **removed** |

All added to `.env.example` (placeholders only, no real secrets). `src/lib/env.ts` updated to validate `STAFF_SESSION_SECRET`.

---

## 7. Migrations & scripts

- `0003_staff` — create `staff` table + enable RLS.
- `npm run db:seed:staff` — bootstrap owner (idempotent).
- Migrations applied to Supabase `zfnhcuvgvnflduqeiyin` via MCP `apply_migration` (consistent with prior `0000`–`0002`), and the Drizzle journal kept in sync where practical.

---

## 8. Testing

- **Unit:** `delivery-pricing.ts` (flat vs live, markup $/%, free threshold boundary, min-order rejection); `password.ts` (hash/verify round-trip, wrong password); `session.ts` (sign/verify, tamper, expiry).
- **Settings service:** defaults when table empty; DB override precedence; upsert.
- **Pricing:** `priceOrder` uses DB tax rate; total recomputed correctly.
- **Auth integration:** middleware redirects unauthenticated `/admin`; `requireRole` blocks under-privileged roles (manager blocked from tax config; staff blocked from menu).
- **Manual smoke:** bootstrap owner → login → change tax → place test order → verify stored total reflects new tax + delivery config; toggle pause-ordering → checkout blocked.

---

## 9. Out of scope for P0+P1 (Roadmap)

Built in later, separately-specced phases:

- **P2 — Live order management:** dashboard reads DB orders via polling, status workflow, new-order alerts, **manual/phone order entry**, manual paid/unpaid toggle. Removes localStorage path.
- **P3 — Menu CRUD:** category/item editor, 86/availability, image handling; refactor menu display pages + `pricing.ts` to read `menu_items` from DB (completes "full DB-backed").
- **P4 — Hours / closures / reservations / catering:** editable hours + holiday closures, `time_slots` management, reservation management, catering-request quote inbox.
- **P5 — Promos & discounts:** `promos` table, codes/comps, applied in the pricing engine.
- **P6 — Stripe payments + refunds (separate track):** Stripe Checkout/PaymentIntents, webhooks, payment status, refund/void actions in admin. Requires live Stripe account + keys.

---

## 10. Risks / notes

- Making `priceOrder` async ripples to all callers — must update every call site in the same change.
- Middleware is new to this project; verify Next 16 middleware semantics against `node_modules/next/dist/docs/` before implementing (per AGENTS.md, this Next build may differ from training data).
- `restaurant_settings` already seeded with some keys (`tax_rate`, `delivery_provider`, etc.); the settings service must treat seeded values as overrides and not clobber them on read.
- Client `preview-cart` tax is display-only; server stays authoritative, so a stale client value is cosmetic, not a pricing risk.
