"use client";

import { nextStatuses, type Fulfillment } from "@/lib/orders/status";
import { fmtClock, fmtElapsed, kitchenUrgency, minutesBetween, type KitchenUrgency } from "@/lib/orders/kitchen-time";

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
  refundedTotal: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  kitchenReceivedAt: string | null;
  items: { id: string; itemName: string | null; itemPrice: string | null; quantity: number | null; spiceLevel?: string | null }[];
  delivery: { trackingUrl: string | null; status: string | null } | null;
  selfDelivery?: boolean;
};

const LABEL: Record<string, string> = {
  received: "Received", preparing: "Preparing", ready: "Ready",
  courier_picked_up: "Courier picked up", en_route: "En route",
  out_for_delivery: "Out for delivery",
  completed: "Completed", delivered: "Delivered", cancelled: "Cancelled",
};

const URGENCY: Record<KitchenUrgency, React.CSSProperties> = {
  ok: { background: "rgba(201,162,75,0.15)", color: "#C9A24B" },
  warn: { background: "rgba(245,158,11,0.2)", color: "#FBBF24" },
  late: { background: "rgba(220,38,38,0.25)", color: "#FCA5A5" },
};

// Received / kitchen times, plus a live timer while the order is waiting to be
// accepted ("Waiting", from the order time) or being cooked ("In kitchen", from
// when the ticket first reached the kitchen). Orders printed by the browser
// board never get a kitchen stamp, so their timer falls back to the order time.
function KitchenTimes({ order, now }: { order: AdminOrder; now: number }) {
  const created = Date.parse(order.createdAt);
  const kitchen = order.kitchenReceivedAt ? Date.parse(order.kitchenReceivedAt) : null;
  const timer =
    order.status === "received" ? { label: "Waiting", from: created }
    : order.status === "preparing" ? { label: "In kitchen", from: kitchen ?? created }
    : null;
  return (
    <div className="flex items-center justify-between gap-2 mb-2 text-xs" style={{ color: "#8A8276" }}>
      <span>
        Received {fmtClock(order.createdAt)}
        {kitchen != null && <> · Kitchen {fmtClock(order.kitchenReceivedAt!)} (+{minutesBetween(created, kitchen)} min)</>}
      </span>
      {timer && (
        <span className="px-2 py-1 rounded-full font-semibold tabular-nums whitespace-nowrap"
          style={URGENCY[kitchenUrgency(minutesBetween(timer.from, now))]}>
          ⏱ {timer.label} {fmtElapsed(timer.from, now)}
        </span>
      )}
    </div>
  );
}

export function OrderCard({
  order, now, busy, onStatus, onPayment, onRefund, onPrint,
}: {
  order: AdminOrder;
  now: number;
  busy: boolean;
  onStatus: (id: string, to: string) => void;
  onPayment: (id: string, patch: { payment_status?: string; payment_method?: string }) => void;
  onRefund: (id: string) => void;
  onPrint?: (id: string) => void;
}) {
  const fulfillment: Fulfillment = order.orderType === "delivery" ? "delivery" : "pickup";
  const actions = nextStatuses(fulfillment, order.status, order.selfDelivery);
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
      <KitchenTimes order={order} now={now} />
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
        {onPrint && (
          <button onClick={() => onPrint(order.id)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>
            🖨 Print
          </button>
        )}
      </div>
      <div className="flex items-center flex-wrap gap-2 mt-3 text-xs" style={{ color: "#8A8276" }}>
        <span>
          Payment: {order.paymentStatus}{order.paymentMethod ? ` (${order.paymentMethod})` : ""}
          {Number(order.refundedTotal ?? 0) > 0 && (
            <span style={{ color: "#E0807A" }}> · refunded ${Number(order.refundedTotal).toFixed(2)}</span>
          )}
        </span>
        {order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded" && order.paymentStatus !== "refunded" && (
          <>
            <button disabled={busy} onClick={() => onPayment(order.id, { payment_status: "paid", payment_method: "cash" })}
              className="px-2 py-1 rounded" style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>Paid · cash</button>
            <button disabled={busy} onClick={() => onPayment(order.id, { payment_status: "paid", payment_method: "card" })}
              className="px-2 py-1 rounded" style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>Paid · card</button>
          </>
        )}
        {(order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded") && order.paymentMethod === "online" && (
          <button disabled={busy} onClick={() => onRefund(order.id)}
            className="px-2 py-1 rounded" style={{ border: "1px solid rgba(220,38,38,0.4)", color: "#E0807A" }}>
            {order.paymentStatus === "partially_refunded" ? "Refund more" : "Refund"}
          </button>
        )}
      </div>
    </div>
  );
}
