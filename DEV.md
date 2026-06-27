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

`dev.annapurnaoakland.com` is bound to the `dev` git branch in Vercel (the
domain's `gitBranch` = `dev`), so every push to `dev` auto-serves a fresh
**Preview** build on that domain using the **Preview (dev)**-scoped env vars
(→ dev Supabase project). Production deploys do **not** touch it. See the
Database-isolation section below for how this is enforced and what breaks it.

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

## ⚠️ Database isolation (read this)

The dev site **must** talk to the dev Supabase project, never prod. Two things
have to be true — both bit us on 2026-06-15 (dev was writing to prod; a staff
user created on dev appeared in prod):

1. **The `dev`-branch Preview env DB vars must point to the dev project.** They
   are *branch-scoped*, so add them with the branch arg:
   ```bash
   printf '%s' "<dev-value>" | npx vercel env add DATABASE_URL preview dev
   # same for NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   ```
   Dev project ref is `gyycwhafohhgtsfmzknh`; prod is `zfnhcuvgvnflduqeiyin`.
   If a `DATABASE_URL` for branch `dev` resolves to the prod ref, the dev site
   reads/writes **prod**.

2. **`dev.annapurnaoakland.com` must be bound to the `dev` branch** (`gitBranch`
   = `dev` on the Vercel project domain). If `gitBranch` is **null**, Vercel
   treats it as a *production* domain and **every production deploy reassigns it
   to the prod build → prod DB**. This is what recurred on 2026-06-21 (the domain
   had `gitBranch: null` despite docs claiming it was pinned; a run of prod
   deploys kept stealing it). Manual `vercel alias set` is only a temporary
   patch — the next prod deploy reclaims an unbound domain. Check / fix the
   binding (token from Vercel CLI auth; project `prj_Y3SC21U9GW1DRuZGIJdFuC3yvmLV`,
   team `team_oI0gNni8Xtndu9VUqadh2brY`):
   ```bash
   # check
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v9/projects/<projectId>/domains/dev.annapurnaoakland.com?teamId=<team>" | jq .gitBranch
   # fix (bind to dev)
   curl -s -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
     -d '{"gitBranch":"dev"}' \
     "https://api.vercel.com/v9/projects/<projectId>/domains/dev.annapurnaoakland.com?teamId=<team>"
   ```
   (Or set it in Vercel → Project → Settings → Domains → `dev.annapurnaoakland.com`
   → Git Branch = `dev`.) Leave the apex/`www` domains unbound (they stay
   production).

**Verify isolation** quickly: 86 one item in the **dev** DB only
(`update menu_items set is_available=false where slug=…`), then check
`https://dev.annapurnaoakland.com/api/menu` shows that item `available:false`
while prod shows `true`. Revert after. (The public `/api/menu` reads the DB.)

## Notes
- Test-mode Stripe card: `4242 4242 4242 4242`, any future expiry / CVC.
- Preview env vars do **not** affect production. Verify scope with
  `npx vercel env ls preview`. Branch-scoped vars: `npx vercel env ls preview dev`.
