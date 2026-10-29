import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Regression guard for AEGIS F-04-001: a public route that calls placeOrder
// creates unpaid kitchen orders and can dispatch a real courier with no
// payment. Online orders must go through /api/checkout/session (Stripe);
// only staff-gated /api/admin/* routes may call placeOrder directly.
// (createPendingOrder / dispatchPaidOrder from the same module are the
// payment-gated Stripe path and are allowed.)

const API_DIR = join(process.cwd(), "src", "app", "api");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return name === "route.ts" ? [path] : [];
  });
}

describe("order creation routes", () => {
  it("only staff-gated admin routes import placeOrder", () => {
    const offenders = routeFiles(API_DIR)
      .filter((file) => /\bplaceOrder\b/.test(readFileSync(file, "utf8")))
      .map((file) => relative(API_DIR, file).split(sep).join("/"))
      .filter((rel) => !rel.startsWith("admin/"));

    expect(offenders).toEqual([]);
  });

  it("no public POST /api/orders route exists", () => {
    const publicOrdersRoute = routeFiles(API_DIR)
      .map((file) => relative(API_DIR, file).split(sep).join("/"))
      .filter((rel) => rel === "orders/route.ts");

    expect(publicOrdersRoute).toEqual([]);
  });
});
