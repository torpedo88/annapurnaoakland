import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { env } from "@/lib/env";

// ─── Feature gates ────────────────────────────────────────────────────────────

function isEmailEnabled(): boolean {
  return Boolean(env.resend().apiKey);
}

function isSmsEnabled(): boolean {
  const t = env.twilio();
  return Boolean(t.accountSid && t.authToken && t.from);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a US phone number to E.164. 10-digit → +1XXXXXXXXXX. */
function toE164(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone; // already formatted or foreign — leave as-is
}

function fmt(dollars: string | null | undefined): string {
  return `$${Number(dollars ?? 0).toFixed(2)}`;
}

// Escape user-sourced values before interpolating into email HTML (prevents
// HTML/email injection from customer name, address, item names, etc.).
function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface OrderRow {
  id: string;
  orderNumber: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  orderType: string | null;
  status: string | null;
  subtotal: string | null;
  tax: string | null;
  tip: string | null;
  deliveryFee: string | null;
  discount: string | null;
  total: string | null;
  deliveryAddress: string | null;
  accessToken: string;
}

interface ItemRow {
  itemName: string | null;
  itemPrice: string | null;
  quantity: number | null;
  spiceLevel: string | null;
}

// ─── Summary builders ─────────────────────────────────────────────────────────

function buildItemLines(items: ItemRow[]): string {
  return items
    .map((it) => {
      const qty = it.quantity ?? 1;
      const name = it.itemName ?? "Item";
      const spice = it.spiceLevel ? ` · ${it.spiceLevel}` : "";
      return `${qty}× ${name}${spice}`;
    })
    .join("\n");
}

function buildTotalsText(order: OrderRow): string {
  const lines: string[] = [];
  lines.push(`Subtotal: ${fmt(order.subtotal)}`);
  lines.push(`Tax: ${fmt(order.tax)}`);
  if (Number(order.deliveryFee ?? 0) > 0) {
    lines.push(`Delivery fee: ${fmt(order.deliveryFee)}`);
  }
  if (Number(order.discount ?? 0) > 0) {
    lines.push(`Discount: -${fmt(order.discount)}`);
  }
  if (Number(order.tip ?? 0) > 0) {
    lines.push(`Tip: ${fmt(order.tip)}`);
  }
  lines.push(`Total: ${fmt(order.total)}`);
  return lines.join("\n");
}

function fulfillmentLabel(order: OrderRow): string {
  if (order.orderType === "delivery") {
    return `Delivery${order.deliveryAddress ? ` to ${order.deliveryAddress}` : ""}`;
  }
  return "Pickup";
}

// ─── Email HTML ───────────────────────────────────────────────────────────────

function buildCustomerHtml(
  order: OrderRow,
  items: ItemRow[],
  trackingUrl: string,
): string {
  const fulfillment = fulfillmentLabel(order);
  const itemRows = items
    .map((it) => {
      const qty = it.quantity ?? 1;
      const name = it.itemName ?? "Item";
      const spice = it.spiceLevel ? ` <span style="color:#888">· ${esc(it.spiceLevel)}</span>` : "";
      const price = `$${(Number(it.itemPrice ?? 0) * qty).toFixed(2)}`;
      return `<tr>
        <td style="padding:4px 8px 4px 0">${qty}× ${esc(name)}${spice}</td>
        <td style="padding:4px 0;text-align:right">${price}</td>
      </tr>`;
    })
    .join("\n");

  const totalsRows: string[] = [];
  totalsRows.push(`<tr><td>Subtotal</td><td style="text-align:right">${fmt(order.subtotal)}</td></tr>`);
  totalsRows.push(`<tr><td>Tax</td><td style="text-align:right">${fmt(order.tax)}</td></tr>`);
  if (Number(order.deliveryFee ?? 0) > 0) {
    totalsRows.push(`<tr><td>Delivery fee</td><td style="text-align:right">${fmt(order.deliveryFee)}</td></tr>`);
  }
  if (Number(order.discount ?? 0) > 0) {
    totalsRows.push(`<tr><td>Discount</td><td style="text-align:right">-${fmt(order.discount)}</td></tr>`);
  }
  if (Number(order.tip ?? 0) > 0) {
    totalsRows.push(`<tr><td>Tip</td><td style="text-align:right">${fmt(order.tip)}</td></tr>`);
  }
  totalsRows.push(`<tr style="font-weight:bold"><td>Total</td><td style="text-align:right">${fmt(order.total)}</td></tr>`);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Order Confirmed</title></head>
<body style="font-family:sans-serif;color:#111;background:#fff;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:32px auto;padding:0 16px">
    <tr><td>
      <h1 style="font-size:22px;margin-bottom:4px">Annapurna Oakland</h1>
      <h2 style="font-size:18px;font-weight:normal;margin-top:0;color:#444">
        Order #${order.orderNumber} confirmed
      </h2>
      <p style="margin:8px 0"><strong>${esc(fulfillment)}</strong></p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #ddd">
        ${itemRows}
      </table>
      <table width="100%" cellpadding="4" cellspacing="0" style="border-top:1px solid #ddd;margin-bottom:24px">
        ${totalsRows.join("\n")}
      </table>
      <p style="margin:24px 0">
        <a href="${trackingUrl}"
           style="background:#b91c1c;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold">
          Track your order
        </a>
      </p>
      <p style="color:#888;font-size:12px;margin-top:32px">
        Annapurna Oakland · 948 Clay Street, Oakland, CA 94607
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildRestaurantHtml(
  order: OrderRow,
  items: ItemRow[],
): string {
  const fulfillment = fulfillmentLabel(order);
  const itemLines = buildItemLines(items).replace(/\n/g, "<br>");
  const totals = buildTotalsText(order).replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>New Order</title></head>
<body style="font-family:sans-serif;color:#111;background:#fff;margin:0;padding:16px">
  <h2>New Order #${order.orderNumber} — ${esc(fulfillment)}</h2>
  <p><strong>Customer:</strong> ${esc(order.customerName ?? "—")}</p>
  <p><strong>Phone:</strong> ${esc(order.customerPhone ?? "—")}</p>
  ${order.customerEmail ? `<p><strong>Email:</strong> ${esc(order.customerEmail)}</p>` : ""}
  ${order.orderType === "delivery" && order.deliveryAddress ? `<p><strong>Delivery address:</strong> ${esc(order.deliveryAddress)}</p>` : ""}
  <hr>
  <pre style="font-family:monospace;white-space:pre-wrap">${esc(buildItemLines(items))}</pre>
  <hr>
  <p>${totals}</p>
</body>
</html>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Sends order confirmation notifications (email + SMS) to the customer and
 * the restaurant. All sends are best-effort: a failure in one does not prevent
 * the others. The whole function never throws — callers may safely fire-and-forget
 * with `void sendOrderNotifications(id).catch(() => {})`.
 */
export async function sendOrderNotifications(orderId: string): Promise<void> {
  // Load order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) {
    console.error("[notify] order not found:", orderId);
    return;
  }

  // Load items
  const items = await db
    .select({
      itemName: orderItems.itemName,
      itemPrice: orderItems.itemPrice,
      quantity: orderItems.quantity,
      spiceLevel: orderItems.spiceLevel,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const trackingUrl = `${env.baseUrl()}/order/${order.id}?t=${order.accessToken}`;
  const fulfillment = fulfillmentLabel(order as OrderRow);
  const resendCfg = env.resend();
  const twilCfg = env.twilio();

  // ── Customer email ────────────────────────────────────────────────────────
  if (isEmailEnabled() && order.customerEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendCfg.apiKey);
      await resend.emails.send({
        from: resendCfg.from,
        to: order.customerEmail,
        subject: `Annapurna — order #${order.orderNumber} confirmed`,
        html: buildCustomerHtml(order as OrderRow, items, trackingUrl),
      });
    } catch (e) {
      console.error("[notify] customer email failed for order", orderId, e);
    }
  }

  // ── Restaurant email ──────────────────────────────────────────────────────
  if (isEmailEnabled() && resendCfg.restaurantEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendCfg.apiKey);
      await resend.emails.send({
        from: resendCfg.from,
        to: resendCfg.restaurantEmail,
        subject: `New order #${order.orderNumber} — ${fulfillment}`,
        html: buildRestaurantHtml(order as OrderRow, items),
      });
    } catch (e) {
      console.error("[notify] restaurant email failed for order", orderId, e);
    }
  }

  // ── Customer SMS ──────────────────────────────────────────────────────────
  if (isSmsEnabled() && order.customerPhone) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(twilCfg.accountSid, twilCfg.authToken);
      await client.messages.create({
        from: twilCfg.from,
        to: toE164(order.customerPhone),
        body: `Annapurna: order #${order.orderNumber} confirmed, ${fmt(order.total)}. Track: ${trackingUrl}`,
      });
    } catch (e) {
      console.error("[notify] customer SMS failed for order", orderId, e);
    }
  }

  // ── Restaurant SMS ────────────────────────────────────────────────────────
  if (isSmsEnabled() && twilCfg.restaurantPhone) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(twilCfg.accountSid, twilCfg.authToken);
      await client.messages.create({
        from: twilCfg.from,
        to: toE164(twilCfg.restaurantPhone),
        body: `New ${fulfillment} order #${order.orderNumber}, ${fmt(order.total)} — ${order.customerName ?? "Guest"} ${order.customerPhone ?? ""}`,
      });
    } catch (e) {
      console.error("[notify] restaurant SMS failed for order", orderId, e);
    }
  }
}
