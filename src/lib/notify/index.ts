import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { env } from "@/lib/env";

// ─── Feature gates ────────────────────────────────────────────────────────────

function isEmailEnabled(): boolean {
  return Boolean(env.sendgrid().apiKey);
}

/** Parse an EMAIL_FROM like `Annapurna Oakland <orders@x.com>` into SendGrid's shape. */
function parseFrom(s: string): { email: string; name?: string } {
  const m = s.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m && m[2]) return { email: m[2].trim(), name: m[1]?.trim() || undefined };
  return { email: s.trim() };
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

// Shared branded shell: dark header w/ logo + footer. `inner` = body table rows.
function emailShell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
        <tr><td style="background:#14100D;padding:24px 28px" align="center">
          <img src="https://annapurnaoakland.com/images/annapurna-logo.png" width="56" height="56" alt="Annapurna" style="display:block;margin:0 auto 8px">
          <div style="color:#C9A24B;font-size:13px;letter-spacing:3px;text-transform:uppercase">Annapurna Oakland</div>
        </td></tr>
        ${inner}
        <tr><td style="padding:24px 28px 28px">
          <div style="border-top:1px solid #efe9dc;padding-top:18px;color:#8A8276;font-size:13px;line-height:1.6">
            <strong style="color:#14100D">Annapurna Restaurant &amp; Bar</strong><br>
            948 Clay Street, Oakland, CA 94607<br>
            Questions about your order? Just reply to this email.
          </div>
        </td></tr>
      </table>
      <div style="color:#b8b0a0;font-size:11px;margin-top:14px">A Himalayan kitchen in Oakland since 2010</div>
    </td></tr>
  </table>
</body></html>`;
}

// Prominent full-width "Track your order" button.
function trackButton(trackingUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="${trackingUrl}" style="display:block;background:#C9A24B;color:#14100D;padding:16px 22px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;text-align:center">Track your order →</a>
  </td></tr></table>`;
}

function totalLine(label: string, value: string, opts: { bold?: boolean; accent?: boolean } = {}): string {
  const labelColor = opts.bold ? "#14100D" : "#8A8276";
  const valueColor = opts.accent ? "#C9A24B" : "#14100D";
  const size = opts.bold ? "15px" : "14px";
  const weight = opts.bold ? "700" : "400";
  return `<tr>
    <td style="padding:5px 0;color:${labelColor};font-size:${size};font-weight:${weight}">${label}</td>
    <td style="padding:5px 0;text-align:right;color:${valueColor};font-size:${size};font-weight:${weight}">${value}</td>
  </tr>`;
}

function buildCustomerHtml(
  order: OrderRow,
  items: ItemRow[],
  trackingUrl: string,
): string {
  const isDelivery = order.orderType === "delivery";
  const firstName = esc((order.customerName ?? "").trim().split(/\s+/)[0] || "there");

  const itemRows = items
    .map((it) => {
      const qty = it.quantity ?? 1;
      const name = esc(it.itemName ?? "Item");
      const spice = it.spiceLevel ? ` <span style="color:#8A8276;font-size:12px">· ${esc(it.spiceLevel)}</span>` : "";
      const line = `$${(Number(it.itemPrice ?? 0) * qty).toFixed(2)}`;
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #efe9dc;color:#14100D;font-size:15px">
          <span style="display:inline-block;min-width:26px;color:#C9A24B;font-weight:700">${qty}×</span> ${name}${spice}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #efe9dc;text-align:right;color:#14100D;font-size:15px;white-space:nowrap">${line}</td>
      </tr>`;
    })
    .join("\n");

  let totals = totalLine("Subtotal", fmt(order.subtotal));
  totals += totalLine("Tax", fmt(order.tax));
  if (Number(order.deliveryFee ?? 0) > 0) totals += totalLine("Delivery", fmt(order.deliveryFee));
  if (Number(order.discount ?? 0) > 0) totals += totalLine("Discount", "−" + fmt(order.discount));
  if (Number(order.tip ?? 0) > 0) totals += totalLine("Tip", fmt(order.tip));

  const fulfillmentBlock = isDelivery
    ? `<strong style="color:#14100D">Delivery</strong><br><span style="color:#8A8276;font-size:14px">${order.deliveryAddress ? esc(order.deliveryAddress) : "Address on file"}</span>`
    : `<strong style="color:#14100D">Pickup</strong><br><span style="color:#8A8276;font-size:14px">948 Clay Street, Oakland, CA 94607</span>`;

  const inner = `
        <tr><td style="padding:28px 28px 8px">
          <div style="color:#C9A24B;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Order Confirmed</div>
          <h1 style="margin:0;color:#14100D;font-size:24px;font-weight:600">Thank you, ${firstName}!</h1>
          <p style="margin:8px 0 0;color:#8A8276;font-size:15px">Order <strong style="color:#14100D">#${order.orderNumber}</strong> is confirmed and moving through our kitchen.</p>
        </td></tr>
        <tr><td style="padding:18px 28px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6ef;border:1px solid #efe9dc;border-radius:10px">
            <tr><td style="padding:16px 18px;font-size:15px">${fulfillmentBlock}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px 4px">${trackButton(trackingUrl)}</td></tr>
        <tr><td style="padding:20px 28px 0">
          <div style="color:#14100D;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:6px">Your order</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">${totals}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-top:2px solid #14100D">
            <tr>
              <td style="padding:12px 0;color:#14100D;font-size:16px;font-weight:700">Total</td>
              <td style="padding:12px 0;text-align:right;color:#C9A24B;font-size:22px;font-weight:700">${fmt(order.total)}</td>
            </tr>
          </table>
        </td></tr>`;
  return emailShell(`Order #${order.orderNumber} confirmed`, inner);
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
  const emailCfg = env.sendgrid();
  const from = parseFrom(emailCfg.from);
  const twilCfg = env.twilio();

  // ── Customer email ────────────────────────────────────────────────────────
  if (isEmailEnabled() && order.customerEmail) {
    try {
      const sg = (await import("@sendgrid/mail")).default;
      sg.setApiKey(emailCfg.apiKey);
      await sg.send({
        from,
        to: order.customerEmail,
        subject: `Annapurna — order #${order.orderNumber} confirmed`,
        html: buildCustomerHtml(order as OrderRow, items, trackingUrl),
      });
    } catch (e) {
      console.error("[notify] customer email failed for order", orderId, e);
    }
  }

  // ── Restaurant email ──────────────────────────────────────────────────────
  if (isEmailEnabled() && emailCfg.restaurantEmail) {
    try {
      const sg = (await import("@sendgrid/mail")).default;
      sg.setApiKey(emailCfg.apiKey);
      // RESTAURANT_NOTIFY_EMAIL may be a comma-separated list — alert several inboxes.
      const recipients = emailCfg.restaurantEmail.split(",").map((s) => s.trim()).filter(Boolean);
      await sg.send({
        from,
        to: recipients.length > 1 ? recipients : recipients[0],
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

/**
 * Resend the branded customer receipt + restaurant alert to specific recipients,
 * using the production templates. For re-notifying or previewing a receipt
 * without emailing the actual customer. Email-config-gated.
 */
export async function resendBrandedEmails(orderId: string, recipients: string[]): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) { console.error("[notify] resend: order not found", orderId); return; }
  const to = recipients.map((s) => s.trim()).filter(Boolean);
  if (!isEmailEnabled() || to.length === 0) return;
  const items = await db
    .select({ itemName: orderItems.itemName, itemPrice: orderItems.itemPrice, quantity: orderItems.quantity, spiceLevel: orderItems.spiceLevel })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  const trackingUrl = `${env.baseUrl()}/order/${order.id}?t=${order.accessToken}`;
  const emailCfg = env.sendgrid();
  const from = parseFrom(emailCfg.from);
  const dest = to.length > 1 ? to : to[0];
  const sg = (await import("@sendgrid/mail")).default;
  sg.setApiKey(emailCfg.apiKey);
  await sg.send({ from, to: dest, subject: `Annapurna — order #${order.orderNumber} receipt`, html: buildCustomerHtml(order as OrderRow, items, trackingUrl) });
  await sg.send({ from, to: dest, subject: `Order #${order.orderNumber} — ${fulfillmentLabel(order as OrderRow)}`, html: buildRestaurantHtml(order as OrderRow, items) });
}

// ─── Status updates (email) ─────────────────────────────────────────────────────

interface StatusInfo { short: string; heading: string; body: string }

/** Customer-facing copy per status. Returns null for statuses we don't email about. */
function statusEmailContent(status: string, orderType: string | null): StatusInfo | null {
  const delivery = orderType === "delivery";
  switch (status) {
    // Only "ready" (and the cancelled exception) email the customer. All other
    // statuses (preparing, out-for-delivery, delivered, completed) are visible
    // on the "Track your order" page — we don't email those to avoid spam.
    case "ready":
      return delivery
        ? { short: "Ready", heading: "Your order is ready", body: "It's packed and heading out for delivery — track it below." }
        : { short: "Ready for pickup", heading: "Your order is ready for pickup!", body: "Come grab it at 948 Clay Street, Oakland. See you soon!" };
    case "cancelled":
      return { short: "Cancelled", heading: "Your order was cancelled", body: "If this is unexpected, please call the restaurant." };
    default:
      return null; // not a customer-facing email status — track via the link
  }
}

function buildStatusHtml(order: OrderRow, info: StatusInfo, trackingUrl: string): string {
  const inner = `
        <tr><td style="padding:34px 28px 6px" align="center">
          <div style="color:#C9A24B;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">${esc(info.short)}</div>
          <h1 style="margin:0;color:#14100D;font-size:26px;font-weight:600">${esc(info.heading)}</h1>
          <p style="margin:10px 0 0;color:#8A8276;font-size:15px">${esc(info.body)}</p>
        </td></tr>
        <tr><td style="padding:22px 28px 4px">${trackButton(trackingUrl)}</td></tr>
        <tr><td style="padding:6px 28px 0" align="center"><span style="color:#b8b0a0;font-size:12px">Order #${order.orderNumber}</span></td></tr>`;
  return emailShell(`Order #${order.orderNumber}: ${info.short}`, inner);
}

/**
 * Emails the customer when their order status changes. Best-effort; never throws.
 * No-op for non-customer-facing statuses or when email isn't configured.
 */
export async function sendOrderStatusUpdate(orderId: string, status: string, recipientsOverride?: string[]): Promise<void> {
  if (!isEmailEnabled()) return;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;
  const override = recipientsOverride?.map((s) => s.trim()).filter(Boolean) ?? [];
  const to = override.length ? (override.length > 1 ? override : override[0]) : order.customerEmail;
  if (!to) return;
  const info = statusEmailContent(status, order.orderType);
  if (!info) return;

  const trackingUrl = `${env.baseUrl()}/order/${order.id}?t=${order.accessToken}`;
  const emailCfg = env.sendgrid();
  const from = parseFrom(emailCfg.from);
  try {
    const sg = (await import("@sendgrid/mail")).default;
    sg.setApiKey(emailCfg.apiKey);
    await sg.send({
      from,
      to,
      subject: `Annapurna — order #${order.orderNumber}: ${info.short}`,
      html: buildStatusHtml(order as OrderRow, info, trackingUrl),
    });
  } catch (e) {
    console.error("[notify] status email failed for order", orderId, e);
  }
}

// ─── Review request (post-completion) ───────────────────────────────────────────

function buildReviewRequestHtml(order: OrderRow, reviewUrl: string): string {
  const firstName = esc((order.customerName ?? "").trim().split(/\s+/)[0] || "there");
  const inner = `
        <tr><td style="padding:34px 28px 6px" align="center">
          <div style="color:#C9A24B;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Thank you</div>
          <h1 style="margin:0;color:#14100D;font-size:26px;font-weight:600">Thanks, ${firstName}! 🙏</h1>
          <p style="margin:12px 0 0;color:#8A8276;font-size:15px;line-height:1.6">We hope you loved your Nepali &amp; Himalayan meal. A quick Google review helps our family restaurant more than you know — it takes about 30 seconds.</p>
        </td></tr>
        <tr><td style="padding:24px 28px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${esc(reviewUrl)}" style="display:block;background:#C9A24B;color:#14100D;padding:16px 22px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;text-align:center">Leave a Google review →</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:10px 28px 0" align="center"><span style="color:#b8b0a0;font-size:12px">Order #${order.orderNumber} · 948 Clay Street, Oakland</span></td></tr>`;
  return emailShell("How was your meal at Annapurna?", inner);
}

/**
 * Asks the customer for a Google review after their order completes. Best-effort
 * (email + SMS), never throws. No-op unless GOOGLE_REVIEW_URL is configured.
 * Fires once per order — the terminal status transition only happens once.
 */
export async function sendReviewRequest(orderId: string): Promise<void> {
  const reviewUrl = env.googleReviewUrl();
  if (!reviewUrl) return; // inert until the GBP review link is set

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;
  const o = order as OrderRow;

  // Email
  if (isEmailEnabled() && o.customerEmail) {
    try {
      const sg = (await import("@sendgrid/mail")).default;
      const emailCfg = env.sendgrid();
      sg.setApiKey(emailCfg.apiKey);
      await sg.send({
        from: parseFrom(emailCfg.from),
        to: o.customerEmail,
        subject: "How was your meal at Annapurna? 🙏",
        html: buildReviewRequestHtml(o, reviewUrl),
      });
    } catch (e) {
      console.error("[notify] review-request email failed for order", orderId, e);
    }
  }

  // SMS
  if (isSmsEnabled() && o.customerPhone) {
    try {
      const twilio = (await import("twilio")).default;
      const t = env.twilio();
      const client = twilio(t.accountSid, t.authToken);
      await client.messages.create({
        from: t.from,
        to: toE164(o.customerPhone),
        body: `Annapurna: thanks for your order! Hope you loved it 🙏 A 30-sec Google review means a lot to our family: ${reviewUrl}`,
      });
    } catch (e) {
      console.error("[notify] review-request SMS failed for order", orderId, e);
    }
  }
}
