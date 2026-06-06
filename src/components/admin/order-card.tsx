"use client";

import { nextStatuses, type Fulfillment } from "@/lib/orders/status";

export type AdminOrder = {
  id: string;
  orderNumber: number;
  customerName: string | null;
  customerPhone: string | null;
  orderType: string | null;
  status: string;
  source: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string | null;
  tax: string | null;
  tip: string | null;
  deliveryFee: string | null;
  total: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  items: { id: string; itemName: string | null; quantity: number | null; spiceLevel?: string | null }[];
  delivery: { trackingUrl: string | null; status: string | null } | null;
};

const LABEL: Record<string, string> = {
  received: "Received", preparing: "Preparing", ready: "Ready",
  courier_picked_up: "Courier picked up", en_route: "En route",
  completed: "Completed", delivered: "Delivered", cancelled: "Cancelled",
};

export function OrderCard({
  order, busy, onStatus, onPayment, onRefund,
}: {
  order: AdminOrder;
  busy: boolean;
  onStatus: (id: string, to: string) => void;
  onPayment: (id: string, patch: { payment_status?: string; payment_method?: string }) => void;
  onRefund: (id: string) => void;
}) {
  const fulfillment: Fulfillment = order.orderType === "delivery" ? "delivery" : "pickup";
  const actions = nextStatuses(fulfillment, order.status);
  const card: React.CSSProperties = {
    backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.18)",
    borderRadius: 14, padding: 16, marginBottom: 12,
  };
  return (
    <div style={card}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span style={{ color: "#F3E9D6", fontWeight: 600 }}>#{order.orderNumber}</span>
          <span className="ml-2 text-xs uppercase tracking-widest" style={{ color: "#8A8276" }}>
            {fulfillment}{order.source === "phone" ? " · phone" : ""}
          </span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(201,162,75,0.15)", color: "#C9A24B" }}>
          {LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div className="text-sm" style={{ color: "#F3E9D6" }}>{order.customerName} · {order.customerPhone}</div>
      {order.deliveryAddress && <div className="text-xs" style={{ color: "#8A8276" }}>{order.deliveryAddress}</div>}
      <ul className="my-2 text-sm" style={{ color: "#C9C2B5" }}>
        {order.items.map((i) => (
          <li key={i.id}>{i.quantity}× {i.itemName}{i.spiceLevel ? ` · ${i.spiceLevel}` : ""}</li>
        ))}
      </ul>
      <div className="text-sm mb-2" style={{ color: "#F3E9D6" }}>Total ${order.total}</div>
      {order.delivery?.trackingUrl && (
        <a href={order.delivery.trackingUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs underline" style={{ color: "#C9A24B" }}>Track delivery →</a>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {actions.map((a) => (
          <button key={a} disabled={busy} onClick={() => onStatus(order.id, a)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold disabled:opacity-50"
            style={a === "cancelled"
              ? { border: "1px solid #DC2626", color: "#FCA5A5" }
              : { backgroundColor: "#C9A24B", color: "#14100D" }}>
            {a === "cancelled" ? "Cancel" : `→ ${LABEL[a] ?? a}`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "#8A8276" }}>
        <span>Payment: {order.paymentStatus}{order.paymentMethod ? ` (${order.paymentMethod})` : ""}</span>
        {order.paymentStatus !== "paid" && (
          <>
            <button disabled={busy} onClick={() => onPayment(order.id, { payment_status: "paid", payment_method: "cash" })}
              className="px-2 py-1 rounded" style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>Paid · cash</button>
            <button disabled={busy} onClick={() => onPayment(order.id, { payment_status: "paid", payment_method: "card" })}
              className="px-2 py-1 rounded" style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>Paid · card</button>
          </>
        )}
        {order.paymentStatus === "paid" && (
          <button disabled={busy} onClick={() => { if (confirm("Refund this order? This cannot be undone.")) onRefund(order.id); }}
            className="px-2 py-1 rounded" style={{ border: "1px solid rgba(220,38,38,0.4)", color: "#E0807A" }}>
            Refund
          </button>
        )}
      </div>
    </div>
  );
}
