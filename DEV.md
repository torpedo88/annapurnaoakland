# Dev / Staging Environment

Production is live at **annapurnaoakland.com** with real Stripe charges + real
Uber couriers. **Never test against production.** This doc sets up an isolated
staging environment so dev work touches a separate database, test-mode payments,
and test-mode delivery.

## Topology

| | Production | Dev / Staging |
|---|---|---|
| Git branch | `main` | `dev` |
| URL | annapurnaoakland.com | **dev.annapurnaoakland.com** |
| Vercel env | Production | Preview |
| Database | Supabase (prod) | Supabase (separate dev project) |
| Stripe | live keys (`sk_live`) | test keys (`sk_test`) |
| Uber Direct | production creds | test-mode creds |
| DoorDash | (sandbox) | (sandbox) |

`dev.annapurnaoakland.com` is pinned to the `dev` branch in Vercel, so every push
to `dev` redeploys staging using the **Preview**-scoped env vars.

## Workflow

```bash
git checkout dev
# ...make changes...
git push origin dev          # auto-deploys to dev.annapurnaoakland.com
# verify on staging, then ship:
git checkout main
git merge dev
git push origin main         # auto-deploys to production
```

Local dev (`npm run dev`) reads `.env.local` — point it at the same dev DB +
test keys so local and staging behave identically.

## One-time setup

### 1. Dev Supabase project
- Create a new project at supabase.com (free tier).
- Copy: connection string (`DATABASE_URL`), project URL, anon key, service-role key.
- Schema is pushed with `npm run db:push` against the dev `DATABASE_URL`.

### 2. Stripe test mode
- Stripe Dashboard → toggle **Test mode** (top right).
- Developers → API keys → copy `sk_test_…` + `pk_test_…`.
- Developers → Webhooks → add endpoint `https://dev.annapurnaoakland.com/api/stripe/webhook`
  → copy the signing secret (`whsec_…`).

### 3. Uber Direct test mode
- direct.uber.com → Developer → **Switch to testing** → copy the test
  Customer ID / Client ID / Client Secret. Test mode dispatches a simulated
  ("robocourier") delivery — no real driver, no charge.

### 4. Vercel Preview env vars
Each dev value is added scoped to **preview** only (production stays untouched):

```bash
printf '%s' "<dev-value>" | npx vercel env add <NAME> preview
```

Required (dev versions): `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `UBER_CUSTOMER_ID`,
`UBER_CLIENT_ID`, `UBER_CLIENT_SECRET`, `NEXT_PUBLIC_BASE_URL`
(= `https://dev.annapurnaoakland.com`), plus `STAFF_SESSION_SECRET`.
Reuse prod values for SendGrid, DoorDash sandbox, Google server keys.

### 5. Domain
- Vercel → Project → Settings → Domains → add `dev.annapurnaoakland.com`,
  assign to git branch `dev`.
- Wix DNS → add CNAME: host `dev` → `cname.vercel-dns.com`.
- Add `dev.annapurnaoakland.com` to the **Google Maps browser key** allowed
  referrers (else autocomplete won't load on staging).

## Notes
- Test-mode Stripe card: `4242 4242 4242 4242`, any future expiry / CVC.
- Preview env vars do **not** affect production. Verify scope with
  `npx vercel env ls preview`.
