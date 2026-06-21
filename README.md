# Annapurna Oakland

Online ordering site, kitchen/admin panel, and courier delivery dispatch
(DoorDash Drive / Uber Direct / self-delivery) for Annapurna restaurant — an
Indian & Nepalese kitchen in Oakland, CA.

- **Public site** — menu, cart, checkout, live order tracking, table
  reservations, and catering requests.
- **Admin panel** (`/admin`) — live orders board (auto-prints 80mm kitchen
  tickets to a thermal printer), menu/promos/reservations/catering/staff
  management, settings. Role-gated (owner / manager / staff).
- **Delivery** — selectable courier (DoorDash Drive, Uber Direct, or
  self-delivery) via admin settings: quote → dispatch a driver → status
  webhooks → live tracking. See ARCHITECTURE §9.

## Quick start

```bash
git clone <repo>
cp .env.example .env.local        # fill in values — see docs/ARCHITECTURE.md §12
npm install
npm run db:seed:staff             # first owner (needs ADMIN_BOOTSTRAP_* set)
npm run dev                       # http://localhost:3000
```

Admin panel: http://localhost:3000/admin

## Prerequisites

- Node.js 20+
- A Supabase Postgres database (`DATABASE_URL`)
- DoorDash Drive credentials for delivery (sandbox is fine for dev)

## Commands

```bash
npm run dev          # dev server
npm test             # vitest
npm run build        # production build
npm run db:push      # sync schema.ts → DB (preferred; see ARCHITECTURE §5)
npm run db:studio    # drizzle studio
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Drizzle ORM · Supabase
Postgres · Tailwind · Vercel · DoorDash Drive · Uber Direct.

> **Heads-up:** this Next.js version has breaking changes vs. older docs. The
> middleware/route guard is `src/proxy.ts` (not `middleware.ts`), and route
> handler params are async. Read `AGENTS.md`.

## Documentation

- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — the single source of
  truth: architecture, data model, auth/RBAC, ordering + payments, delivery
  providers, env vars, gotchas, **developer onboarding (§18)**, a **support &
  operations runbook (§19)**, and the **Uber go-live runbook (§20)**.
- **[docs/DOORDASH.md](./docs/DOORDASH.md)** — optional deep-dive on the DoorDash
  provider (fallback courier; prod runs Uber).
- **[docs/KITCHEN-PRINTING.md](./docs/KITCHEN-PRINTING.md)** — auto-printing
  kitchen tickets to the Star TSP100 (kiosk setup + troubleshooting).
- **[docs/SEO.md](./docs/SEO.md)** — SEO status checklist: what's fixed in code
  vs. owner action items (Google Business Profile + Search Console).
- `docs/superpowers/specs|plans/` — historical design specs and build plans.

## Deployment

Vercel (`annapurnaoakland.vercel.app`). Environment variables are managed with
`vercel env`; new vars require a redeploy. See ARCHITECTURE §13.
