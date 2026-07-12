import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, deliveries, orderRefunds } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

const CARD = "#1C1712", GOLD = "#C9A24B", CREAM = "#F3E9D6", MUTED = "#8A8276";
const LINE = "1px solid rgba(201,162,75,0.15)";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment", received: "Received", preparing: "Preparing",
  ready: "Ready", courier_picked_up: "Picked up", en_route: "En route",
  out_for_delivery: "Out for delivery", completed: "Completed", delivered: "Delivered",
  cancelled: "Cancelled",
};
const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Unpaid", paid: "Paid", refunded: "Refunded", partially_refunded: "Partially refunded",
};
const money = (v: string | null) => `$${Number(v ?? 0).toFixed(2)}`;
const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" }) : "—";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();

  const [items, [delivery], refunds] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.createdAt)),
    db.select().from(deliveries).where(eq(deliveries.orderId, id)).limit(1),
    db.select().from(orderRefunds).where(eq(orderRefunds.orderId, id)).orderBy(desc(orderRefunds.createdAt)),
  ]);

  const isDelivery = order.orderType === "delivery";
  const name = order.customerName || [order.firstName, order.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div style={{ color: CREAM, maxWidth: 920, margin: "0 auto" }}>
      <Link href="/admin/dashboard" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>
        ← Back to dashboard
      </Link>

      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: CREAM }}>Order #{order.orderNumber ?? "—"}</h1>
        <Badge>{STATUS_LABELS[order.status ?? ""] ?? order.status ?? "—"}</Badge>
        <Badge tone={order.paymentStatus === "paid" ? "good" : order.paymentStatus?.includes("refund") ? "warn" : "muted"}>
          {PAYMENT_LABELS[order.paymentStatus ?? ""] ?? order.paymentStatus}
        </Badge>
        <span style={{ color: MUTED, fontSize: 13, marginLeft: "auto" }}>
          {order.orderType ?? "—"} · {order.source ?? "—"} · {fmtDate(order.createdAt)}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <Panel title="Customer">
          <Row k="Name" v={name} />
          <Row k="Phone" v={order.customerPhone || "—"} />
          <Row k="Email" v={order.customerEmail || "—"} />
        </Panel>

        <Panel title={isDelivery ? "Delivery address" : "Fulfillment"}>
          {isDelivery ? (
            <>
              <Row k="Street" v={order.addressStreet || order.deliveryAddress || "—"} />
              <Row k="Unit / Apt" v={order.addressUnit || "—"} />
              <Row k="City" v={order.addressCity || "—"} />
              <Row k="State" v={order.addressState || "—"} />
              <Row k="ZIP" v={order.addressZip || "—"} />
              {delivery?.trackingUrl && (
                <a href={delivery.trackingUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: GOLD, fontSize: 13, display: "inline-block", marginTop: 8 }}>
                  Track courier ({delivery.status ?? "—"}) →
                </a>
              )}
            </>
          ) : (
            <Row k="Type" v="Pickup · 948 Clay St, Oakland" />
          )}
        </Panel>
      </div>

      <Panel title="Items" style={{ marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ borderTop: LINE }}>
                <td style={{ padding: "8px 0", color: GOLD, width: 40 }}>{it.quantity}×</td>
                <td style={{ padding: "8px 0" }}>
                  {it.itemName}
                  {it.spiceLevel && <span style={{ color: MUTED, fontSize: 12 }}> · {it.spiceLevel}</span>}
                </td>
                <td style={{ padding: "8px 0", textAlign: "right", color: MUTED }}>{money(it.itemPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Panel title="Totals">
          <Row k="Subtotal" v={money(order.subtotal)} />
          <Row k="Tax" v={money(order.tax)} />
          {isDelivery && <Row k="Delivery" v={money(order.deliveryFee)} />}
          <Row k="Tip" v={money(order.tip)} />
          {Number(order.discount ?? 0) > 0 && <Row k="Discount" v={`−${money(order.discount)}`} />}
          <Row k="Total" v={money(order.total)} strong />
          {Number(order.refundedTotal ?? 0) > 0 && <Row k="Refunded" v={`−${money(order.refundedTotal)}`} />}
        </Panel>

        <Panel title="Payment & refunds">
          <Row k="Method" v={order.paymentMethod || "—"} />
          <Row k="Status" v={PAYMENT_LABELS[order.paymentStatus ?? ""] ?? order.paymentStatus} />
          {refunds.length === 0 ? (
            <p style={{ color: MUTED, fontSize: 13, marginTop: 8 }}>No refunds.</p>
          ) : (
            refunds.map((r) => (
              <div key={r.id} style={{ borderTop: LINE, padding: "8px 0", fontSize: 13 }}>
                <span style={{ color: CREAM }}>−${(r.amountCents / 100).toFixed(2)}</span>
                {r.reason && <span style={{ color: MUTED }}> · {r.reason}</span>}
                <span style={{ color: MUTED, float: "right" }}>{fmtDate(r.createdAt)}</span>
              </div>
            ))
          )}
        </Panel>
      </div>

      {order.specialInstructions && (
        <Panel title="Notes for the kitchen" style={{ marginTop: 16 }}>
          <p style={{ color: CREAM, fontSize: 14 }}>{order.specialInstructions}</p>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: CARD, border: LINE, borderRadius: 18, padding: 20, ...style }}>
      <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  );
}
function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
      <span style={{ color: MUTED }}>{k}</span>
      <span style={{ color: strong ? GOLD : CREAM, fontWeight: strong ? 700 : 400 }}>{v}</span>
    </div>
  );
}
function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "good" | "warn" | "muted" }) {
  const c = tone === "good" ? "#7BC47F" : tone === "warn" ? "#E0A458" : MUTED;
  return (
    <span style={{ fontSize: 12, color: c, border: `1px solid ${c}55`, borderRadius: 999, padding: "3px 10px" }}>
      {children}
    </span>
  );
}

export const dynamic = "force-dynamic";
