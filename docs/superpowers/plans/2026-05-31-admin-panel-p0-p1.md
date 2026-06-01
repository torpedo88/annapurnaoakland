# Admin Panel P0+P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a role-gated admin shell (Owner/Manager/Staff) with real session auth, and make tax + delivery charges fully admin-controlled and live by routing them through DB-backed settings.

**Architecture:** New `staff` table + scrypt passwords + signed (Web Crypto HMAC) session cookie, enforced by a new Next 16 `proxy.ts` and per-handler `requireRole`. A typed settings service over `restaurant_settings` feeds tax rate into the (still-synchronous) pricing engine via dependency injection, and a new `delivery-pricing` module applies admin delivery config (live+markup / flat / free-threshold / min-order) on top of the authoritative DoorDash fee.

**Tech Stack:** Next.js 16.2.4 (App Router, `proxy` convention), React 19, Drizzle ORM + postgres.js, Supabase (project `zfnhcuvgvnflduqeiyin`, RLS on), Node `crypto` (scrypt) + Web Crypto (HMAC), Vitest (added in Task 0), shadcn/ui, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-05-31-admin-panel-p0-p1-design.md`

---

## Conventions for the implementer

- Money is integer **cents** everywhere internally; `decimal` DB columns store dollar strings via `toDollars()`.
- Settings live in `restaurant_settings` (key text PK, value jsonb). Read through the settings service only.
- Migrations: add the Drizzle table to `src/db/schema.ts`, then apply the SQL to Supabase via the MCP `apply_migration` tool (same as `0000`–`0002`). The exact SQL is given in each migration task.
- Run tests with `npm test` (Vitest). Run typecheck with `npx tsc --noEmit`. Run the build with `npm run build` only at checkpoints (slow).
- Roles: `'owner' | 'manager' | 'staff'`. Capability matrix is in spec §4.5.

---

## File map (what gets created / modified)

**Created:**
- `vitest.config.ts` — test config
- `src/lib/auth/password.ts` — scrypt hash/verify
- `src/lib/auth/password.test.ts`
- `src/lib/auth/session.ts` — sign/verify session token (Web Crypto), cookie helpers, `getSession`/`requireRole`
- `src/lib/auth/session.test.ts`
- `src/proxy.ts` — route protection
- `src/app/admin/login/page.tsx` — login page
- `src/app/admin/layout.tsx` — admin shell (tabs, user chip, sign-out)
- `src/db/seed-staff.ts` — bootstrap owner
- `src/lib/settings/index.ts` — settings service (`mergeSettings` pure + `getSettings`/`updateSetting`)
- `src/lib/settings/settings.test.ts`
- `src/lib/orders/delivery-pricing.ts` — delivery fee computation
- `src/lib/orders/delivery-pricing.test.ts`
- `src/app/api/settings/public/route.ts` — public settings (client tax)
- `src/app/api/admin/settings/route.ts` — admin settings read/write
- `src/app/admin/settings/settings-form.tsx` — settings UI (client)

**Modified:**
- `package.json` — add vitest + `test` script, add `db:seed:staff`
- `src/db/schema.ts` — add `staff` table
- `src/lib/env.ts` — add `staffSessionSecret`, drop nothing (STAFF_PIN was never here)
- `src/lib/orders/pricing.ts` — `priceOrder` accepts injected `taxRate`
- `src/lib/orders/create-order.ts` — fetch settings, inject tax + computed delivery fee
- `src/app/api/orders/route.ts` — apply delivery-pricing, ordering_paused, min-order
- `src/app/api/delivery/quote/route.ts` — apply delivery-pricing, ordering_paused
- `src/app/admin/actions.ts` — email+password auth (replaces PIN)
- `src/app/admin/page.tsx` — render dashboard (auth now handled by proxy + layout)
- `src/lib/preview-cart.tsx` — fetch tax from `/api/settings/public`
- `.env.example` — add new vars, remove `STAFF_PIN`

**Removed:**
- `src/components/admin/pin-gate.tsx` — replaced by login page

---

## Task 0: Test harness (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run: `npm i -D vitest@^3`
Expected: added to devDependencies.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Install the path-alias plugin** (so `@/...` imports resolve in tests)

Run: `npm i -D vite-tsconfig-paths`

- [ ] **Step 4: Add the `test` script to `package.json`**

In `"scripts"`, add:
```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 5: Sanity test**

Create `src/lib/_smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 6: Run it**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 7: Delete the smoke test and commit**

```bash
rm src/lib/_smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest harness with tsconfig path resolution"
```

---

## Task 1: `staff` table + migration 0003

**Files:**
- Modify: `src/db/schema.ts`
- Apply migration via MCP

- [ ] **Step 1: Add the `staff` table to `src/db/schema.ts`**

Append after the `deliveries` table (end of file):
```ts
// ─── Staff (admin users) ─────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().default(genUuid()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"), // 'owner' | 'manager' | 'staff'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});
```

- [ ] **Step 2: Apply the migration to Supabase** (project `zfnhcuvgvnflduqeiyin`) using the MCP `apply_migration` tool with name `0003_staff` and this SQL:

```sql
CREATE TABLE "staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" text DEFAULT 'staff' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "staff_email_unique" UNIQUE("email")
);
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Verify** with MCP `list_tables` (schema `public`): confirm `staff` exists with `rls_enabled: true`, `rows: 0`.

- [ ] **Step 4: Keep the Drizzle journal in sync** (optional but preferred): run `npm run db:generate` to emit a `0003_*.sql` into `drizzle/migrations` (it may differ cosmetically; do NOT re-apply it since the table already exists — this only keeps the local journal consistent).

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts drizzle/migrations
git commit -m "feat(db): add staff table + 0003 migration (RLS enabled)"
```

---

## Task 2: Password hashing (scrypt)

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `src/lib/auth/password.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("returns false on a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — Run: `npm test -- password` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/auth/password.ts`**

```ts
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;
const SCHEME = "scrypt";

/** Returns a self-describing hash string: `scrypt$<saltHex>$<hashHex>`. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return `${SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== SCHEME) return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length !== KEYLEN) return false;
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
```

- [ ] **Step 4: Run it, expect PASS** — Run: `npm test -- password` — Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.ts src/lib/auth/password.test.ts
git commit -m "feat(auth): scrypt password hash/verify"
```

---

## Task 3: Session token (Web Crypto HMAC)

The session module must be importable from `proxy.ts`, so it uses **Web Crypto** (`crypto.subtle`) and reads `process.env.STAFF_SESSION_SECRET` directly (NOT via `src/lib/env.ts`, which is `server-only`).

**Files:**
- Create: `src/lib/auth/session.ts`
- Test: `src/lib/auth/session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { signSessionToken, verifySessionToken, type SessionPayload } from "@/lib/auth/session";

beforeAll(() => {
  process.env.STAFF_SESSION_SECRET = "test-secret-please-change";
});

const base: SessionPayload = { sid: "abc", role: "owner" };

describe("session token", () => {
  it("round-trips a valid token", async () => {
    const token = await signSessionToken(base, 3600);
    const out = await verifySessionToken(token);
    expect(out?.sid).toBe("abc");
    expect(out?.role).toBe("owner");
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken(base, 3600);
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSessionToken(base, -1); // already expired
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("nonsense")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — Run: `npm test -- session` — Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/auth/session.ts`**

```ts
export type Role = "owner" | "manager" | "staff";
export interface SessionPayload {
  sid: string;
  role: Role;
}
interface SignedPayload extends SessionPayload {
  exp: number; // unix seconds
}

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secret(): string {
  const s = process.env.STAFF_SESSION_SECRET;
  if (!s) throw new Error("Missing STAFF_SESSION_SECRET");
  return s;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign `{sid, role}` with a TTL (seconds). Returns `<payloadB64>.<sigB64>`. */
export async function signSessionToken(payload: SessionPayload, ttlSeconds: number): Promise<string> {
  const body: SignedPayload = {
    sid: payload.sid,
    role: payload.role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const data = b64url(enc.encode(JSON.stringify(body)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig), enc.encode(data));
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(data))) as SignedPayload;
    if (typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) return null;
    if (body.role !== "owner" && body.role !== "manager" && body.role !== "staff") return null;
    if (typeof body.sid !== "string") return null;
    return { sid: body.sid, role: body.role };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run it, expect PASS** — Run: `npm test -- session` — Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/session.ts src/lib/auth/session.test.ts
git commit -m "feat(auth): signed session token via Web Crypto HMAC"
```

---

## Task 4: Server-side session helpers (cookie + role gate)

These run only in server components / route handlers / server actions (Node runtime), so they can use `next/headers`.

**Files:**
- Modify: `src/lib/auth/session.ts` (append helpers)

- [ ] **Step 1: Append cookie + gate helpers to `src/lib/auth/session.ts`**

```ts
import { cookies } from "next/headers";

export const SESSION_COOKIE = "annapurna_staff";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload, SESSION_TTL_SECONDS);
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Reads + verifies the session cookie. Returns null if absent/invalid/expired. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export class AuthError extends Error {}

/** Throws AuthError if no session or role not allowed. Returns the session otherwise. */
export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated");
  if (!allowed.includes(session.role)) throw new AuthError("Forbidden");
  return session;
}
```

> Note: `cookies()` is only valid in request scope. The pure `signSessionToken`/`verifySessionToken` remain importable from `proxy.ts`; the helpers above are imported only by server components/route handlers/actions, never by `proxy.ts`.

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors. (Existing `session.test.ts` still passes: `npm test -- session`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/session.ts
git commit -m "feat(auth): session cookie + requireRole helpers"
```

---

## Task 5: Env var for the session secret

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add `staffSessionSecret` to `src/lib/env.ts`**

Inside the `env` object (after `baseUrl`):
```ts
  staffSessionSecret: () => required("STAFF_SESSION_SECRET"),
```

- [ ] **Step 2: Update `.env.example`** — remove the `STAFF_PIN=1234` line and add:

```
# Admin panel
STAFF_SESSION_SECRET=change-me-to-a-long-random-string
ADMIN_BOOTSTRAP_EMAIL=owner@example.com
ADMIN_BOOTSTRAP_PASSWORD=change-me
```

- [ ] **Step 3: Add the secret to local env** — append to `.env.local` (do NOT commit this file):

```
STAFF_SESSION_SECRET=dev-only-secret-change-in-prod-0123456789
ADMIN_BOOTSTRAP_EMAIL=owner@annapurna.test
ADMIN_BOOTSTRAP_PASSWORD=changeme123
```

- [ ] **Step 4: Commit** (env.ts + example only)

```bash
git add src/lib/env.ts .env.example
git commit -m "feat(env): STAFF_SESSION_SECRET + admin bootstrap vars; drop STAFF_PIN"
```

---

## Task 6: Rewrite admin auth actions (email + password)

**Files:**
- Modify: `src/app/admin/actions.ts` (full rewrite)

- [ ] **Step 1: Replace `src/app/admin/actions.ts` entirely with:**

```ts
"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie, getSession, type Role } from "@/lib/auth/session";

export async function signIn(_prev: { error?: string } | null, formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  if (!email || !password) return { error: "Enter your email and password." };

  const [user] = await db.select().from(staff).where(eq(staff.email, email)).limit(1);
  // Always run a verify to reduce timing oracle even when the user is absent.
  const ok = user && user.isActive && (await verifyPassword(password, user.passwordHash));
  if (!ok) return { error: "Invalid credentials." };

  await setSessionCookie({ sid: user.id, role: user.role as Role });
  redirect("/admin");
}

export async function signOut() {
  await clearSessionCookie();
  redirect("/admin/login");
}

/** Convenience for server components that need the current staff session. */
export async function currentStaff() {
  return getSession();
}
```

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: errors only in files not yet updated (`page.tsx` importing `hasStaffSession`, `pin-gate.tsx`). These are fixed in Task 7. If other errors appear, fix them.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/actions.ts
git commit -m "feat(admin): email+password auth actions (replaces PIN)"
```

---

## Task 7: Proxy, login page, admin layout/shell

**Files:**
- Create: `src/proxy.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/page.tsx`
- Delete: `src/components/admin/pin-gate.tsx`

- [ ] **Step 1: Create `src/proxy.ts`**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself through (avoids redirect loop).
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
```

> `SESSION_COOKIE` is a plain string constant in `session.ts`; importing it does not pull in `next/headers` (only the helper functions use that, and they are tree-shaken out of the proxy bundle because proxy only references `verifySessionToken` + the constant). If the build complains about `next/headers` in the proxy bundle, move `SESSION_COOKIE` and the pure token functions into `src/lib/auth/session-core.ts` and re-export from `session.ts`; update the proxy import accordingly.

- [ ] **Step 2: Create the login page `src/app/admin/login/page.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-6"
          style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
        >
          <Lock className="h-3.5 w-3.5" /> Staff only
        </div>
        <h1
          className="text-5xl lg:text-6xl leading-[0.95] tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
        >
          Admin sign in.
        </h1>
        <p className="mt-4 leading-relaxed" style={{ color: "#8A8276" }}>
          Sign in with your staff account to manage orders, menu, and settings.
        </p>
        <form action={formAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8A8276" }}>
              Email
            </span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              className="w-full rounded-full px-6 py-4 text-lg focus:outline-none transition"
              style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6" }}
              placeholder="you@restaurant.com"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8A8276" }}>
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-full px-6 py-4 text-lg focus:outline-none transition"
              style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6" }}
              placeholder="••••••••"
            />
          </label>
          {state?.error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex justify-center items-center gap-2 rounded-full py-4 font-bold text-base transition disabled:opacity-60"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
          >
            {pending ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create the admin shell `src/app/admin/layout.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, type Role } from "@/lib/auth/session";
import { signOut } from "./actions";

type Tab = { href: string; label: string; roles: Role[] };

const TABS: Tab[] = [
  { href: "/admin", label: "Orders", roles: ["owner", "manager", "staff"] },
  { href: "/admin/menu", label: "Menu", roles: ["owner", "manager"] },
  { href: "/admin/settings", label: "Settings", roles: ["owner", "manager"] },
  { href: "/admin/promos", label: "Promos", roles: ["owner", "manager"] },
  { href: "/admin/reservations", label: "Reservations", roles: ["owner", "manager"] },
  { href: "/admin/catering", label: "Catering", roles: ["owner", "manager"] },
  { href: "/admin/staff", label: "Staff", roles: ["owner"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Proxy already gates this, but enforce again (defense-in-depth per Next 16 proxy docs).
  if (!session) redirect("/admin/login");

  const tabs = TABS.filter((t) => t.roles.includes(session.role));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#14100D" }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(201,162,75,0.18)" }}
      >
        <nav className="flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="px-4 py-2 rounded-full text-sm font-semibold transition"
              style={{ color: "#F3E9D6" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest" style={{ color: "#8A8276" }}>
            {session.role}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Simplify `src/app/admin/page.tsx`** (auth now handled by proxy + layout):

```tsx
import { AdminDashboard } from "./dashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard />;
}
```

- [ ] **Step 5: Delete the old PIN gate**

```bash
git rm src/components/admin/pin-gate.tsx
```

- [ ] **Step 6: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors. Fix any stragglers (e.g. stale imports of `hasStaffSession`/`PinGate`).

- [ ] **Step 7: Commit**

```bash
git add src/proxy.ts src/app/admin/login/page.tsx src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat(admin): proxy route guard, login page, role-gated shell"
```

---

## Task 8: Bootstrap-owner seed script

**Files:**
- Create: `src/db/seed-staff.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `src/db/seed-staff.ts`**

```ts
/**
 * Bootstraps the first owner account from ADMIN_BOOTSTRAP_EMAIL/PASSWORD.
 * Idempotent: does nothing if any owner already exists.
 * Run: npm run db:seed:staff
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD.");
    process.exit(1);
  }

  const [existingOwner] = await db.select().from(staff).where(eq(staff.role, "owner")).limit(1);
  if (existingOwner) {
    console.log("Owner already exists; nothing to do.");
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await db.insert(staff).values({ name: "Owner", email, passwordHash, role: "owner" });
  console.log(`Created owner ${email}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed staff failed:", e);
  process.exit(1);
});
```

- [ ] **Step 2: Add the script to `package.json`** — in `"scripts"`:
```json
    "db:seed:staff": "npx tsx --env-file=.env.local src/db/seed-staff.ts",
```

- [ ] **Step 3: Run it**

Run: `npm run db:seed:staff`
Expected: `Created owner owner@annapurna.test.`

- [ ] **Step 4: Run again (idempotency check)**

Run: `npm run db:seed:staff`
Expected: `Owner already exists; nothing to do.`

- [ ] **Step 5: Commit**

```bash
git add src/db/seed-staff.ts package.json
git commit -m "feat(db): bootstrap-owner seed script (idempotent)"
```

---

## Task 9: P0 manual verification checkpoint

- [ ] **Step 1: Build** — Run: `npm run build` — Expected: success, and the build output lists `proxy` (the Next 16 proxy compiled). Fix any error (common: `next/headers` pulled into proxy bundle — apply the `session-core.ts` split noted in Task 7 Step 1).

- [ ] **Step 2: Start dev + verify the guard** — Run `npm run dev`, then:
  - Visit `/admin` while logged out → redirected to `/admin/login`.
  - `curl -i localhost:3000/api/admin/settings` → `401`.
  - Sign in with `owner@annapurna.test` / `changeme123` → lands on `/admin`, shell shows all tabs incl. Staff.
  - Sign out → back to `/admin/login`.

- [ ] **Step 3: No commit** (verification only). If fixes were needed, commit them with `fix(admin): …`.

---

## Task 10: Settings service

Pure `mergeSettings` (testable) + thin DB read/write.

**Files:**
- Create: `src/lib/settings/index.ts`
- Test: `src/lib/settings/settings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mergeSettings, DEFAULT_SETTINGS } from "@/lib/settings";

describe("mergeSettings", () => {
  it("returns defaults when no rows", () => {
    expect(mergeSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it("overrides scalar keys from rows", () => {
    const s = mergeSettings([{ key: "tax_rate", value: 0.05 }]);
    expect(s.tax_rate).toBe(0.05);
  });

  it("deep-merges the delivery object", () => {
    const s = mergeSettings([{ key: "delivery", value: { mode: "flat", flatFeeCents: 599 } }]);
    expect(s.delivery.mode).toBe("flat");
    expect(s.delivery.flatFeeCents).toBe(599);
    // untouched delivery keys keep defaults
    expect(s.delivery.markupCents).toBe(DEFAULT_SETTINGS.delivery.markupCents);
  });

  it("ignores unknown keys", () => {
    const s = mergeSettings([{ key: "nope", value: 1 }]);
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it("ignores a wrong-typed tax_rate", () => {
    const s = mergeSettings([{ key: "tax_rate", value: "high" }]);
    expect(s.tax_rate).toBe(DEFAULT_SETTINGS.tax_rate);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — Run: `npm test -- settings` — Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/settings/index.ts`**

```ts
import { cache } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { restaurantSettings } from "@/db/schema";

export interface DeliverySettings {
  mode: "live" | "flat";
  flatFeeCents: number;
  markupCents: number;
  markupPercent: number;
  freeThresholdCents: number; // 0 = disabled
  minOrderCents: number;
  maxRadiusMiles: number;
}

export interface Settings {
  tax_rate: number;
  delivery: DeliverySettings;
  ordering_paused: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tax_rate: 0.0925,
  delivery: {
    mode: "live",
    flatFeeCents: 599,
    markupCents: 0,
    markupPercent: 0,
    freeThresholdCents: 0,
    minOrderCents: 0,
    maxRadiusMiles: 8,
  },
  ordering_paused: false,
  pickup_enabled: true,
  delivery_enabled: true,
};

type Row = { key: string; value: unknown };

/** Pure: fold DB rows over the typed defaults. Bad types fall back to defaults. */
export function mergeSettings(rows: Row[]): Settings {
  const out: Settings = structuredClone(DEFAULT_SETTINGS);
  for (const { key, value } of rows) {
    switch (key) {
      case "tax_rate":
        if (typeof value === "number" && value >= 0 && value < 1) out.tax_rate = value;
        break;
      case "ordering_paused":
        if (typeof value === "boolean") out.ordering_paused = value;
        break;
      case "pickup_enabled":
        if (typeof value === "boolean") out.pickup_enabled = value;
        break;
      case "delivery_enabled":
        if (typeof value === "boolean") out.delivery_enabled = value;
        break;
      case "delivery":
        if (value && typeof value === "object") {
          const v = value as Partial<DeliverySettings>;
          const d = out.delivery;
          if (v.mode === "live" || v.mode === "flat") d.mode = v.mode;
          for (const k of [
            "flatFeeCents", "markupCents", "markupPercent",
            "freeThresholdCents", "minOrderCents", "maxRadiusMiles",
          ] as const) {
            if (typeof v[k] === "number" && Number.isFinite(v[k]) && (v[k] as number) >= 0) {
              d[k] = v[k] as number;
            }
          }
        }
        break;
    }
  }
  return out;
}

/** Read all settings (per-request memoized). */
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db
    .select({ key: restaurantSettings.key, value: restaurantSettings.value })
    .from(restaurantSettings);
  return mergeSettings(rows as Row[]);
});

/** Upsert a single setting key. Caller is responsible for role-gating. */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(restaurantSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: restaurantSettings.key,
      set: { value: sql`excluded.value`, updatedAt: sql`now()` },
    });
}
```

- [ ] **Step 4: Run it, expect PASS** — Run: `npm test -- settings` — Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/settings/index.ts src/lib/settings/settings.test.ts
git commit -m "feat(settings): typed settings service over restaurant_settings"
```

---

## Task 11: Inject DB tax rate into pricing

`priceOrder` stays synchronous; it accepts an optional `taxRate`. Authoritative callers pass the DB value.

**Files:**
- Modify: `src/lib/orders/pricing.ts`
- Test: extend behavior via a new test file `src/lib/orders/pricing.test.ts`

- [ ] **Step 1: Write the failing test** (`src/lib/orders/pricing.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { priceOrder } from "@/lib/orders/pricing";

// Uses a real catalog id from src/data/menu.ts:
// "beverages-regular-water" @ $2.99 (299 cents).
const WATER = "beverages-regular-water";

describe("priceOrder taxRate injection", () => {
  it("uses the injected tax rate", () => {
    const t = priceOrder([{ id: WATER, qty: 1 }], { taxRate: 0.10 });
    expect(t.subtotalCents).toBe(299);
    expect(t.taxCents).toBe(Math.round(299 * 0.10)); // 30
  });

  it("falls back to the default rate when none injected", () => {
    const t = priceOrder([{ id: WATER, qty: 1 }]);
    expect(t.taxCents).toBe(Math.round(299 * 0.0925)); // 28
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — Run: `npm test -- pricing` — Expected: FAIL (`taxRate` not honored).

- [ ] **Step 3: Modify `src/lib/orders/pricing.ts`**

Rename the exported constant to a default and honor an injected rate. Replace lines 7 and the `opts`/`taxCents` usage:

Change line 7 from:
```ts
export const TAX_RATE = 0.0925; // Oakland sales tax (matches preview-cart)
```
to:
```ts
export const DEFAULT_TAX_RATE = 0.0925; // fallback only; authoritative rate comes from settings
```

Change the `priceOrder` signature opts (around line 53) from:
```ts
  opts: { tipCents?: number; deliveryFeeCents?: number } = {},
```
to:
```ts
  opts: { tipCents?: number; deliveryFeeCents?: number; taxRate?: number } = {},
```

Change the tax computation (around line 68) from:
```ts
  const taxCents = Math.round(subtotalCents * TAX_RATE);
```
to:
```ts
  const taxRate = typeof opts.taxRate === "number" && opts.taxRate >= 0 ? opts.taxRate : DEFAULT_TAX_RATE;
  const taxCents = Math.round(subtotalCents * taxRate);
```

- [ ] **Step 4: Run it, expect PASS** — Run: `npm test -- pricing` — Expected: 2 passed.

- [ ] **Step 5: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors (no other file imports `TAX_RATE` from pricing — `preview-cart.tsx` has its own local constant).

- [ ] **Step 6: Commit**

```bash
git add src/lib/orders/pricing.ts src/lib/orders/pricing.test.ts
git commit -m "feat(pricing): inject tax rate (default fallback retained)"
```

---

## Task 12: Delivery pricing module

**Files:**
- Create: `src/lib/orders/delivery-pricing.ts`
- Test: `src/lib/orders/delivery-pricing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const d = (over: Partial<typeof DEFAULT_SETTINGS.delivery>) => ({ ...DEFAULT_SETTINGS.delivery, ...over });

describe("computeDeliveryFee", () => {
  it("live mode returns the doordash fee when no markup", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 700, subtotalCents: 3000 }, d({ mode: "live" }));
    expect(r.feeCents).toBe(700);
    expect(r.freeApplied).toBe(false);
  });

  it("live mode adds flat + percent markup", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 1000, subtotalCents: 3000 },
      d({ mode: "live", markupCents: 200, markupPercent: 10 }));
    expect(r.feeCents).toBe(1000 + 200 + 100); // 1300
  });

  it("flat mode ignores the doordash fee", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 1234, subtotalCents: 3000 },
      d({ mode: "flat", flatFeeCents: 599 }));
    expect(r.feeCents).toBe(599);
  });

  it("free threshold zeroes the fee at/above the threshold", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 700, subtotalCents: 5000 },
      d({ mode: "live", freeThresholdCents: 5000 }));
    expect(r.feeCents).toBe(0);
    expect(r.freeApplied).toBe(true);
  });

  it("free threshold does not apply below the threshold", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 700, subtotalCents: 4999 },
      d({ mode: "live", freeThresholdCents: 5000 }));
    expect(r.feeCents).toBe(700);
  });
});

describe("assertDeliverable", () => {
  it("passes when at/above min order", () => {
    expect(() => assertDeliverable({ subtotalCents: 2000 }, d({ minOrderCents: 2000 }))).not.toThrow();
  });
  it("throws MinOrderError below min order", () => {
    expect(() => assertDeliverable({ subtotalCents: 1999 }, d({ minOrderCents: 2000 }))).toThrow(MinOrderError);
  });
  it("no min order configured ⇒ always deliverable", () => {
    expect(() => assertDeliverable({ subtotalCents: 1 }, d({ minOrderCents: 0 }))).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — Run: `npm test -- delivery-pricing` — Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/orders/delivery-pricing.ts`**

```ts
import type { DeliverySettings } from "@/lib/settings";

export class MinOrderError extends Error {
  constructor(public minOrderCents: number) {
    super("Order below delivery minimum");
    this.name = "MinOrderError";
  }
}

export interface DeliveryFeeInput {
  doordashFeeCents: number;
  subtotalCents: number;
}

export interface DeliveryFeeResult {
  feeCents: number;
  freeApplied: boolean;
}

/** Apply admin delivery config on top of the authoritative DoorDash fee. */
export function computeDeliveryFee(
  input: DeliveryFeeInput,
  settings: DeliverySettings,
): DeliveryFeeResult {
  const base =
    settings.mode === "flat"
      ? settings.flatFeeCents
      : input.doordashFeeCents +
        settings.markupCents +
        Math.round(input.doordashFeeCents * (settings.markupPercent / 100));

  const free =
    settings.freeThresholdCents > 0 && input.subtotalCents >= settings.freeThresholdCents;

  return { feeCents: free ? 0 : Math.max(0, Math.round(base)), freeApplied: free };
}

/** Throws MinOrderError if the subtotal is below the configured delivery minimum. */
export function assertDeliverable(
  input: { subtotalCents: number },
  settings: DeliverySettings,
): void {
  if (settings.minOrderCents > 0 && input.subtotalCents < settings.minOrderCents) {
    throw new MinOrderError(settings.minOrderCents);
  }
}
```

- [ ] **Step 4: Run it, expect PASS** — Run: `npm test -- delivery-pricing` — Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders/delivery-pricing.ts src/lib/orders/delivery-pricing.test.ts
git commit -m "feat(orders): delivery-pricing (live+markup/flat/free-threshold/min-order)"
```

---

## Task 13: Wire settings + delivery-pricing into the order flow

**Files:**
- Modify: `src/lib/orders/create-order.ts`
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/app/api/delivery/quote/route.ts`

- [ ] **Step 1: Inject the DB tax rate in `create-order.ts`**

In `src/lib/orders/create-order.ts`, add the settings import after the existing imports:
```ts
import { getSettings } from "@/lib/settings";
```
Then change the `priceOrder` call (currently lines 33-36) from:
```ts
  const totals = priceOrder(input.items, {
    tipCents: input.tipCents,
    deliveryFeeCents: input.deliveryFeeCents,
  });
```
to:
```ts
  const settings = await getSettings();
  const totals = priceOrder(input.items, {
    tipCents: input.tipCents,
    deliveryFeeCents: input.deliveryFeeCents,
    taxRate: settings.tax_rate,
  });
```

- [ ] **Step 2: Apply delivery config + pause + min-order in `src/app/api/orders/route.ts`**

Add imports:
```ts
import { getSettings } from "@/lib/settings";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";
```

Right after parsing `tipCents` (after line 28), add the pause check:
```ts
  const settings = await getSettings();
  if (settings.ordering_paused) {
    return NextResponse.json({ error: "Online ordering is paused. Please call the restaurant." }, { status: 503 });
  }
  if (fulfillment === "delivery" && !settings.delivery_enabled) {
    return NextResponse.json({ error: "Delivery is currently unavailable." }, { status: 503 });
  }
  if (fulfillment === "pickup" && !settings.pickup_enabled) {
    return NextResponse.json({ error: "Pickup is currently unavailable." }, { status: 503 });
  }
```

In the delivery branch (after `deliveryFeeCents = accepted.feeCents ?? 0;`, line 51), recompute the subtotal and apply admin config + min-order:
```ts
      const subtotalCents = priceOrder(items as { id: unknown; qty: unknown }[]).subtotalCents;
      try {
        assertDeliverable({ subtotalCents }, settings.delivery);
      } catch (e) {
        if (e instanceof MinOrderError) {
          return NextResponse.json(
            { error: `Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.` },
            { status: 400 },
          );
        }
        throw e;
      }
      deliveryFeeCents = computeDeliveryFee(
        { doordashFeeCents: accepted.feeCents ?? 0, subtotalCents },
        settings.delivery,
      ).feeCents;
```

> The `priceOrder` import already exists in this file. `subtotalCents` recomputation is cheap and keeps the catalog as the single source.

- [ ] **Step 3: Apply config + pause in `src/app/api/delivery/quote/route.ts`** so the customer sees the same fee that will be charged.

Add imports:
```ts
import { getSettings } from "@/lib/settings";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";
```

After the `orderValueCents` block (after line 29), add:
```ts
  const settings = await getSettings();
  if (settings.ordering_paused || !settings.delivery_enabled) {
    return NextResponse.json({ error: "Delivery is currently unavailable." }, { status: 503 });
  }
  try {
    assertDeliverable({ subtotalCents: orderValueCents }, settings.delivery);
  } catch (e) {
    if (e instanceof MinOrderError) {
      return NextResponse.json(
        { error: `Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.` },
        { status: 400 },
      );
    }
    throw e;
  }
```

Then change the success response to apply the admin fee. Replace:
```ts
    return NextResponse.json({
      externalDeliveryId,
      feeCents: q.feeCents,
      durationSeconds: q.durationSeconds,
    });
```
with:
```ts
    const { feeCents, freeApplied } = computeDeliveryFee(
      { doordashFeeCents: q.feeCents, subtotalCents: orderValueCents },
      settings.delivery,
    );
    return NextResponse.json({
      externalDeliveryId,
      feeCents,
      freeApplied,
      durationSeconds: q.durationSeconds,
    });
```

- [ ] **Step 4: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors.

- [ ] **Step 5: Run the whole unit suite** — Run: `npm test` — Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/orders/create-order.ts src/app/api/orders/route.ts src/app/api/delivery/quote/route.ts
git commit -m "feat(orders): DB tax + admin delivery config + pause/min-order enforcement"
```

---

## Task 14: Public settings endpoint + client tax

**Files:**
- Create: `src/app/api/settings/public/route.ts`
- Modify: `src/lib/preview-cart.tsx`

- [ ] **Step 1: Create `src/app/api/settings/public/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    tax_rate: s.tax_rate,
    ordering_paused: s.ordering_paused,
    pickup_enabled: s.pickup_enabled,
    delivery_enabled: s.delivery_enabled,
    delivery: {
      freeThresholdCents: s.delivery.freeThresholdCents,
      minOrderCents: s.delivery.minOrderCents,
    },
  });
}
```

- [ ] **Step 2: Make the cart tax dynamic in `src/lib/preview-cart.tsx`**

Change the constant (line 14) from:
```ts
const TAX_RATE = 0.0925; // Oakland sales tax ~9.25%
```
to:
```ts
const DEFAULT_TAX_RATE = 0.0925; // display fallback; server is authoritative
```

Add a tax-rate state + fetch inside `CartProvider` (after the `justAdded` state, ~line 45):
```ts
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.tax_rate === "number") setTaxRate(d.tax_rate);
      })
      .catch(() => { /* keep default; server is authoritative */ });
    return () => { alive = false; };
  }, []);
```

Change the `tax` memo (line 97) from:
```ts
  const tax = useMemo(() => +(subtotal * TAX_RATE).toFixed(2), [subtotal]);
```
to:
```ts
  const tax = useMemo(() => +(subtotal * taxRate).toFixed(2), [subtotal, taxRate]);
```

Update the bottom re-export (line 127) from:
```ts
export { TAX_RATE };
```
to:
```ts
export { DEFAULT_TAX_RATE };
```

- [ ] **Step 3: Find and fix any importers of the old `TAX_RATE`**

Run: `grep -rn "TAX_RATE" src/ | grep -v node_modules`
Expected importers: only `preview-cart.tsx` (now `DEFAULT_TAX_RATE`) and `pricing.ts` (`DEFAULT_TAX_RATE`). If any other file imports `TAX_RATE` from `preview-cart`, update it to `DEFAULT_TAX_RATE`.

- [ ] **Step 4: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/settings/public/route.ts src/lib/preview-cart.tsx
git commit -m "feat(settings): public settings endpoint; cart tax reads DB rate"
```

---

## Task 15: Admin Settings API + UI

**Files:**
- Create: `src/app/api/admin/settings/route.ts`
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/admin/settings/settings-form.tsx`

- [ ] **Step 1: Create `src/app/api/admin/settings/route.ts`** (proxy gates auth; this enforces role)

```ts
import { NextResponse } from "next/server";
import { getSettings, updateSetting, type DeliverySettings } from "@/lib/settings";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Forbidden" }, { status: e instanceof AuthError ? 403 : 500 });
  }
  return NextResponse.json(await getSettings());
}

function asCents(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export async function PATCH(req: Request) {
  let session;
  try {
    session = await requireRole(["owner", "manager"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Manager may toggle ordering/availability; only owner may change financial config.
  const ownerOnly = "tax_rate" in body || "delivery" in body;
  if (ownerOnly && session.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can change tax or delivery pricing." }, { status: 403 });
  }

  if ("tax_rate" in body) {
    const n = Number(body.tax_rate);
    if (!Number.isFinite(n) || n < 0 || n >= 1) {
      return NextResponse.json({ error: "tax_rate must be between 0 and 1" }, { status: 400 });
    }
    await updateSetting("tax_rate", n);
  }
  for (const k of ["ordering_paused", "pickup_enabled", "delivery_enabled"] as const) {
    if (k in body) await updateSetting(k, Boolean(body[k]));
  }
  if ("delivery" in body && body.delivery && typeof body.delivery === "object") {
    const d = body.delivery as Partial<DeliverySettings>;
    const clean: DeliverySettings = {
      mode: d.mode === "flat" ? "flat" : "live",
      flatFeeCents: asCents(d.flatFeeCents),
      markupCents: asCents(d.markupCents),
      markupPercent: Number.isFinite(Number(d.markupPercent)) ? Math.max(0, Number(d.markupPercent)) : 0,
      freeThresholdCents: asCents(d.freeThresholdCents),
      minOrderCents: asCents(d.minOrderCents),
      maxRadiusMiles: Number.isFinite(Number(d.maxRadiusMiles)) ? Math.max(0, Number(d.maxRadiusMiles)) : 0,
    };
    await updateSetting("delivery", clean);
  }

  return NextResponse.json(await getSettings());
}
```

- [ ] **Step 2: Create the server page `src/app/admin/settings/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth/session";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");
  const settings = await getSettings();
  return <SettingsForm initial={settings} role={session.role} />;
}
```

- [ ] **Step 3: Create the client form `src/app/admin/settings/settings-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Settings } from "@/lib/settings";

export function SettingsForm({ initial, role }: { initial: Settings; role: "owner" | "manager" | "staff" }) {
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const isOwner = role === "owner";

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error ?? "Save failed"); return; }
    setS(data as Settings);
    setMsg("Saved.");
  }

  const card: React.CSSProperties = {
    backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.18)",
    borderRadius: 16, padding: 24, marginBottom: 20,
  };
  const label = "block text-xs font-semibold uppercase tracking-widest mb-2";
  const input = "w-full rounded-lg px-4 py-2.5";
  const inputStyle: React.CSSProperties = {
    backgroundColor: "#14100D", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-6" style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}>
        Settings
      </h1>
      {msg && <p className="mb-4 text-sm" style={{ color: "#C9A24B" }}>{msg}</p>}

      {/* Ordering availability — manager+ */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Ordering</h2>
        {([
          ["ordering_paused", "Pause online ordering"],
          ["pickup_enabled", "Pickup enabled"],
          ["delivery_enabled", "Delivery enabled"],
        ] as const).map(([key, lbl]) => (
          <label key={key} className="flex items-center justify-between py-2" style={{ color: "#F3E9D6" }}>
            <span>{lbl}</span>
            <input
              type="checkbox"
              checked={s[key]}
              onChange={(e) => save({ [key]: e.target.checked })}
              disabled={saving}
            />
          </label>
        ))}
      </section>

      {/* Tax — owner only */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Tax {!isOwner && "(owner only)"}</h2>
        <label className={label} style={{ color: "#8A8276" }}>Tax rate (decimal, e.g. 0.0925 = 9.25%)</label>
        <div className="flex gap-3 items-center">
          <input
            className={input} style={inputStyle} type="number" step="0.0001" min="0" max="0.9999"
            defaultValue={s.tax_rate} disabled={!isOwner || saving}
            onBlur={(e) => isOwner && save({ tax_rate: Number(e.target.value) })}
          />
          <span style={{ color: "#8A8276" }}>{(s.tax_rate * 100).toFixed(2)}%</span>
        </div>
      </section>

      {/* Delivery — owner only */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Delivery charges {!isOwner && "(owner only)"}</h2>
        <DeliveryFields s={s} disabled={!isOwner || saving}
          onSave={(delivery) => save({ delivery })} label={label} input={input} inputStyle={inputStyle} />
      </section>
    </div>
  );
}

function DeliveryFields({
  s, disabled, onSave, label, input, inputStyle,
}: {
  s: Settings; disabled: boolean; onSave: (d: Settings["delivery"]) => void;
  label: string; input: string; inputStyle: React.CSSProperties;
}) {
  const [d, setD] = useState(s.delivery);
  const set = (patch: Partial<Settings["delivery"]>) => setD((p) => ({ ...p, ...patch }));
  const num = (key: keyof Settings["delivery"], lbl: string, hint?: string) => (
    <div className="mb-3">
      <label className={label} style={{ color: "#8A8276" }}>{lbl}{hint ? ` ${hint}` : ""}</label>
      <input className={input} style={inputStyle} type="number" min="0" disabled={disabled}
        value={d[key] as number} onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<Settings["delivery"]>)} />
    </div>
  );
  return (
    <>
      <div className="mb-3">
        <label className={label} style={{ color: "#8A8276" }}>Mode</label>
        <select className={input} style={inputStyle} value={d.mode} disabled={disabled}
          onChange={(e) => set({ mode: e.target.value === "flat" ? "flat" : "live" })}>
          <option value="live">Live DoorDash quote</option>
          <option value="flat">Flat fee</option>
        </select>
      </div>
      {d.mode === "flat" ? num("flatFeeCents", "Flat fee", "(cents)") : (
        <>
          {num("markupCents", "Markup", "(cents added to live fee)")}
          {num("markupPercent", "Markup", "(% of live fee)")}
        </>
      )}
      {num("freeThresholdCents", "Free delivery over", "(subtotal cents, 0 = off)")}
      {num("minOrderCents", "Minimum delivery order", "(cents, 0 = off)")}
      {num("maxRadiusMiles", "Max delivery radius", "(miles)")}
      <button type="button" disabled={disabled} onClick={() => onSave(d)}
        className="mt-2 px-5 py-2.5 rounded-full font-bold"
        style={{ backgroundColor: "#C9A24B", color: "#14100D", opacity: disabled ? 0.5 : 1 }}>
        Save delivery settings
      </button>
    </>
  );
}
```

- [ ] **Step 4: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/settings/route.ts src/app/admin/settings/page.tsx src/app/admin/settings/settings-form.tsx
git commit -m "feat(admin): settings API + tax/delivery/ordering settings UI"
```

---

## Task 16: Final verification checkpoint

- [ ] **Step 1: Full unit suite** — Run: `npm test` — Expected: all green (password, session, settings, pricing, delivery-pricing).

- [ ] **Step 2: Build** — Run: `npm run build` — Expected: success.

- [ ] **Step 3: Manual end-to-end** (dev server, logged in as owner):
  - `/admin/settings` → change tax rate to `0.10`, blur the field → "Saved."
  - Reload the public site `/menu`, add an item, open cart → tax line reflects 10% (via `/api/settings/public`).
  - In settings, set Delivery → Flat fee `599`, save. On checkout with a delivery address, the quote shows `$5.99`.
  - Set Delivery → free-delivery over `5000`; a cart ≥ $50 shows `$0.00` delivery.
  - Set min delivery order `2000`; a $5 cart delivery quote returns the "Delivery minimum is $20.00" error.
  - Toggle "Pause online ordering" → placing an order returns 503; untoggle to restore.
  - Sign in as a **manager** account (create one via SQL or a future staff UI) → Settings page shows Tax/Delivery as disabled (owner only), but Ordering toggles work.

- [ ] **Step 4: Update `.env.example` review** — confirm `STAFF_PIN` is gone and the three new vars are present.

- [ ] **Step 5: Final commit if any fixes were made**

```bash
git add -A
git commit -m "test(admin): P0+P1 verification fixes"
```

---

## Self-review notes (already reconciled against the spec)

- **Auth model (spec §4.1–4.6):** staff table (Task 1), scrypt (Task 2), signed session (Task 3-4), proxy + login + shell (Task 7), bootstrap (Task 8). ✅
- **Role matrix (spec §4.5):** enforced in layout tab filtering (Task 7), settings API ownerOnly check (Task 15), settings page redirect (Task 15). Staff/kitchen order-status + 86 controls live in P2/P3 — out of P0+P1 scope. ✅
- **Settings service (spec §5.1):** Task 10. **Pricing tax (spec §5.2):** Task 11+13 (injection approach documented; replaces the spec's "async priceOrder"). **Delivery pricing (spec §5.2):** Task 12+13. **ordering_paused (spec §5.2):** Task 13. **Public tax (spec §5.3):** Task 14. **Settings UI (spec §5.4):** Task 15. ✅
- **Env (spec §6):** Task 5. **Migration (spec §7):** Task 1. **Testing (spec §8):** Tasks 2,3,10,11,12 unit; Tasks 9,16 manual. ✅
- **Proxy correction:** uses Next 16 `proxy.ts` (not `middleware.ts`), verified against the bundled docs; auth also enforced in handlers/layout per the Next 16 warning. ✅
- **Type consistency:** `Settings`/`DeliverySettings` shapes identical across settings service, delivery-pricing, and the API/UI. `computeDeliveryFee`/`assertDeliverable`/`MinOrderError` names consistent across Tasks 12-13. `signSessionToken`/`verifySessionToken`/`getSession`/`requireRole` consistent across Tasks 3-7,15.
