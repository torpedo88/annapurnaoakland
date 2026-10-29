import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Regression guard for AEGIS F-04-001: a public route that calls placeOrder
// creates unpaid kitchen orders and can dispatch a real courier with no
// payment. Online orders must go through /api/checkout/session (Stripe);
// only staff-gated /api/admin/* code may reach the order-creation and
// courier-dispatch primitives directly. (createPendingOrder /
// dispatchPaidOrder are the payment-gated Stripe path and are allowed.)

const SRC = join(process.cwd(), "src");
const API_DIR = join(SRC, "app", "api");

const DANGEROUS = /\b(placeOrder|acceptQuote|createUberDelivery|createOrder)\b/;

// Where the primitives are defined or legitimately composed.
const ALLOW = [
  /^app\/api\/admin\//,
  /^lib\/orders\/place-order\.ts$/,
  /^lib\/orders\/create-order\.ts$/,
  /^lib\/uber\/client\.ts$/,
  /^lib\/doordash\/client\.ts$/,
  /\.test\.tsx?$/,
];

function allFiles(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return allFiles(path, ext);
    return ext.test(name) ? [path] : [];
  });
}

const rel = (base: string, file: string) => relative(base, file).split(sep).join("/");

describe("order creation routes", () => {
  it("order-creation and dispatch primitives are only reachable from staff-gated code", () => {
    const offenders = allFiles(SRC, /\.tsx?$/)
      .filter((file) => DANGEROUS.test(readFileSync(file, "utf8")))
      .map((file) => rel(SRC, file))
      .filter((path) => !ALLOW.some((re) => re.test(path)));

    expect(offenders).toEqual([]);
  });

  it("no public POST /api/orders route exists", () => {
    const publicOrdersRoute = allFiles(API_DIR, /^route\.tsx?$/)
      .map((file) => rel(API_DIR, file))
      .filter((path) => /^orders\/route\.tsx?$/.test(path));

    expect(publicOrdersRoute).toEqual([]);
  });

  it("proxy still gates /api/admin", () => {
    expect(readFileSync(join(SRC, "proxy.ts"), "utf8")).toMatch(/["']\/api\/admin\/:path\*["']/);
  });
});
