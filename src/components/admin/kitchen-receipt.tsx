"use client";

import type { AdminOrder } from "./order-card";

// 80mm thermal kitchen ticket. Rendered into #kitchen-receipt, which globals.css
// reveals (and isolates) only during printing. Monospace + high contrast so it
// reads on cheap thermal paper. Width is 100% — the printer driver / @page sets
// the physical 80mm roll size.

const fmtMoney = (v: string | null) => (v == null ? "—" : `$${Number(v).toFixed(2)}`);
const num = (v: string | null) => Number(v ?? 0);

export function KitchenReceipt({ order }: { order: AdminOrder }) {
  const isDelivery = order.orderType === "delivery";
  const time = new Date(order.createdAt).toLocaleString([], {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8 };
  const Hr = () => <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />;

  return (
    <div
      id="kitchen-receipt"
      style={{ fontFamily: "'Courier New', monospace", color: "#000", width: "100%", fontSize: 13, lineHeight: 1.35 }}
    >
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 16 }}>ANNAPURNA — OAKLAND</div>
      <div style={{ textAlign: "center", fontSize: 11 }}>Kitchen Ticket</div>
      <Hr />
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 30, lineHeight: 1.1 }}>#{order.orderNumber}</div>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>
        {isDelivery ? "DELIVERY" : "PICKUP"}{order.source === "phone" ? " · PHONE" : ""}
      </div>
      <div style={{ textAlign: "center", fontSize: 11 }}>{time}</div>
      <Hr />
      <div style={{ fontWeight: 700 }}>{order.customerName ?? "—"}</div>
      {order.customerPhone && <div>{order.customerPhone}</div>}
      {isDelivery && order.deliveryAddress && <div style={{ fontSize: 12 }}>{order.deliveryAddress}</div>}
      <Hr />
      {order.items.map((i) => (
        <div key={i.id} style={{ marginBottom: 4 }}>
          <div style={{ ...row, fontWeight: 700 }}>
            <span>{i.quantity ?? 1}× {i.itemName ?? "Item"}</span>
            <span>{fmtMoney(i.itemPrice)}</span>
          </div>
          {i.spiceLevel && <div style={{ fontSize: 11, paddingLeft: 12 }}>spice: {i.spiceLevel}</div>}
        </div>
      ))}
      <Hr />
      <div style={row}><span>Subtotal</span><span>{fmtMoney(order.subtotal)}</span></div>
      <div style={row}><span>Tax</span><span>{fmtMoney(order.tax)}</span></div>
      {num(order.tip) > 0 && <div style={row}><span>Tip</span><span>{fmtMoney(order.tip)}</span></div>}
      {num(order.deliveryFee) > 0 && <div style={row}><span>Delivery</span><span>{fmtMoney(order.deliveryFee)}</span></div>}
      <div style={{ ...row, fontWeight: 700, fontSize: 16, marginTop: 4 }}>
        <span>TOTAL</span><span>{fmtMoney(order.total)}</span>
      </div>
      <Hr />
      <div style={{ textAlign: "center", fontSize: 12 }}>
        {order.paymentStatus === "paid"
          ? `PAID${order.paymentMethod ? ` · ${order.paymentMethod.toUpperCase()}` : ""}`
          : `PAYMENT: ${order.paymentStatus.replace(/_/g, " ").toUpperCase()}`}
      </div>
      <div style={{ textAlign: "center", fontSize: 11, marginTop: 6 }}>annapurnaoakland.com</div>
      <div style={{ height: 24 }} />
    </div>
  );
}
