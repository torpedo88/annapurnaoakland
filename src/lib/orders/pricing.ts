import { menu } from "@/data/menu";
import { toCents } from "@/lib/orders/money";

// Server-authoritative pricing. The client payload is untrusted: we accept only
// item ids + quantities and recompute every figure from the menu catalog.

export const DEFAULT_TAX_RATE = 0.0925; // fallback only; authoritative rate comes from settings

const MENU_BY_ID = new Map(menu.map((m) => [m.id, m]));

export interface RawLine {
  id: unknown;
  qty: unknown;
}

export interface PricedLine {
  id: string;
  name: string;
  priceCents: number;
  qty: number;
}

export interface OrderTotals {
  lines: PricedLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

export class PricingError extends Error {}

function asPositiveInt(v: unknown, max: number): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw new PricingError("Invalid item quantity");
  }
  return n;
}

function clampMoney(cents: number, maxCents: number): number {
  if (!Number.isFinite(cents) || cents < 0) return 0;
  return Math.min(Math.round(cents), Math.round(maxCents));
}

/**
 * Recompute an order's money from the catalog using only client-supplied ids + qty.
 * deliveryFeeCents and tipCents are server-supplied/validated by the caller.
 */
export function priceOrder(
  rawItems: RawLine[],
  opts: { tipCents?: number; deliveryFeeCents?: number; taxRate?: number } = {},
): OrderTotals {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new PricingError("Cart is empty");
  }
  if (rawItems.length > 100) throw new PricingError("Too many items");

  const lines: PricedLine[] = rawItems.map((it) => {
    const item = typeof it?.id === "string" ? MENU_BY_ID.get(it.id) : undefined;
    if (!item) throw new PricingError("Unknown menu item");
    const qty = asPositiveInt(it.qty, 99);
    return { id: item.id, name: item.name, priceCents: toCents(item.price), qty };
  });

  const subtotalCents = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);
  const taxRate = typeof opts.taxRate === "number" && opts.taxRate >= 0 ? opts.taxRate : DEFAULT_TAX_RATE;
  const taxCents = Math.round(subtotalCents * taxRate);

  const deliveryFeeCents = clampMoney(opts.deliveryFeeCents ?? 0, subtotalCents * 5);
  // Tip is user-chosen but clamped to a sane ceiling of the recomputed subtotal.
  const tipCents = clampMoney(opts.tipCents ?? 0, Math.max(subtotalCents * 3, 20000));

  const totalCents = subtotalCents + taxCents + tipCents + deliveryFeeCents;
  return { lines, subtotalCents, taxCents, tipCents, deliveryFeeCents, totalCents };
}

// ─── Field validation (length caps + format) ────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

export function cleanString(v: unknown, maxLen: number): string {
  if (typeof v !== "string") return "";
  return v.replace(CONTROL_CHARS, "").trim().slice(0, maxLen);
}

export function validateContact(input: {
  name: unknown;
  phone: unknown;
  email: unknown;
}): { name: string; phone: string; email: string } {
  const name = cleanString(input.name, 80);
  const phone = cleanString(input.phone, 30);
  const email = cleanString(input.email, 120);
  if (!name) throw new PricingError("Name is required");
  if (!/^[+\d][\d\s().-]{6,}$/.test(phone)) throw new PricingError("Valid phone is required");
  if (email && !EMAIL_RE.test(email)) throw new PricingError("Invalid email");
  return { name, phone, email };
}

export const isValidExternalDeliveryId = (v: unknown): v is string =>
  typeof v === "string" && /^anp-[0-9a-f-]{36}$/.test(v);

export function httpsUrlOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}
