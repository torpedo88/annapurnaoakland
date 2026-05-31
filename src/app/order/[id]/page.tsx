"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChefHat, PackageCheck, Truck, Phone, ExternalLink } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  orderNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  orderType: string | null;
  status: string | null;
  subtotal: string | null;
  tax: string | null;
  tip: string | null;
  deliveryFee: string | null;
  total: string | null;
  deliveryAddress: string | null;
  createdAt: string;
}

interface ItemRow {
  id: string;
  itemName: string | null;
  itemPrice: string | null;
  quantity: number | null;
}

interface DeliveryRow {
  id: string;
  status: string | null;
  trackingUrl: string | null;
  feeCents: number | null;
}

interface OrderPayload {
  order: OrderRow;
  items: ItemRow[];
  delivery: DeliveryRow | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TERMINAL = new Set(["completed", "delivered", "cancelled"]);

function statusLabel(s: string | null): string {
  switch (s) {
    case "confirmed": return "Confirmed";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    // delivery-specific
    case "created": return "Driver Assigned";
    case "enroute_to_pickup": return "Driver En Route";
    case "picked_up": return "Picked Up";
    case "enroute_to_dropoff": return "On the Way";
    case "delivered": return "Delivered";
    default: return s ?? "Unknown";
  }
}

function statusColor(s: string | null): { badge: string; dot: string } {
  if (s === "delivered" || s === "completed") return { badge: "#D1FAE5", dot: "#10B981" };
  if (s === "cancelled") return { badge: "rgba(220,38,38,0.15)", dot: "#DC2626" };
  return { badge: "rgba(201,162,75,0.15)", dot: "#C9A24B" };
}

// ─── Pickup progress steps ──────────────────────────────────────────────────

const PICKUP_STEPS = [
  { key: "confirmed", label: "Received", Icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", Icon: ChefHat },
  { key: "ready", label: "Ready", Icon: PackageCheck },
];

const DELIVERY_STEPS = [
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "enroute_to_pickup", label: "Driver En Route", Icon: Truck },
  { key: "picked_up", label: "Picked Up", Icon: PackageCheck },
  { key: "delivered", label: "Delivered", Icon: CheckCircle2 },
];

const PICKUP_ORDER = ["confirmed", "preparing", "ready", "completed"];
const DELIVERY_ORDER = ["confirmed", "created", "enroute_to_pickup", "picked_up", "enroute_to_dropoff", "delivered"];

function activeStepIndex(status: string | null, order: string[]): number {
  const idx = status ? order.indexOf(status) : -1;
  return idx === -1 ? 0 : idx;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<OrderPayload | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const token = new URLSearchParams(window.location.search).get("t") ?? "";
      const res = await fetch(`/api/orders/${id}?t=${encodeURIComponent(token)}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) return;
      const json = await res.json() as OrderPayload;
      setData(json);
    } catch {
      // network error — keep current data
    }
  }, [id]);

  useEffect(() => {
    void fetchOrder();
    // Poll every 20s until terminal
    const interval = setInterval(() => {
      const currentStatus = data?.delivery?.status ?? data?.order.status ?? null;
      if (!TERMINAL.has(currentStatus ?? "")) void fetchOrder();
    }, 20_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchOrder]);

  if (data === null) {
    if (notFound) {
      return (
        <section className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center">
            <p
              className="text-4xl mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
            >
              Order not found.
            </p>
            <p className="mb-6" style={{ color: "#8A8276" }}>
              We couldn&apos;t locate this order. Please check your link or contact the restaurant.
            </p>
            <Link
              href="/menu"
              className="inline-flex rounded-full px-7 py-3.5 font-bold transition"
              style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
            >
              Back to menu
            </Link>
          </div>
        </section>
      );
    }
    // Loading state while first fetch is in-flight
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-6">
        <p style={{ color: "#8A8276" }}>Loading your order…</p>
      </section>
    );
  }

  const { order, items, delivery } = data;
  const isDelivery = order.orderType === "delivery";
  const displayStatus = delivery?.status ?? order.status ?? null;
  const { badge, dot } = statusColor(displayStatus);
  const customerFirstName = (order.customerName ?? "").split(" ")[0] ?? "there";

  const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const stepOrder = isDelivery ? DELIVERY_ORDER : PICKUP_ORDER;
  const activeIdx = activeStepIndex(displayStatus, stepOrder);

  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,162,75,0.06), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-4xl px-6 lg:px-10">
        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
          style={{ backgroundColor: badge, color: "#F3E9D6" }}
        >
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: dot }} />
          {statusLabel(displayStatus)}
        </div>

        <h1
          className="text-5xl lg:text-7xl leading-[0.95] tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
        >
          {displayStatus === "delivered" || displayStatus === "completed" ? (
            <>Thanks for <span style={{ color: "#C9A24B" }}>ordering.</span></>
          ) : (
            <>Thanks, {customerFirstName}. <span style={{ color: "#C9A24B" }}>We&apos;re on it.</span></>
          )}
        </h1>

        {order.orderNumber && (
          <p className="mt-4 text-sm" style={{ color: "#8A8276" }}>
            Order #{order.orderNumber}
          </p>
        )}

        {/* Progress steps */}
        {displayStatus !== "cancelled" && (
          <div
            className="mt-10 rounded-[1.75rem] p-7"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
          >
            <div
              className="grid gap-4 mb-4"
              style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
            >
              {steps.map((s, i) => {
                const { Icon } = s;
                const done = i <= activeIdx;
                const current = i === activeIdx;
                return (
                  <div key={s.key} className="flex flex-col items-center text-center">
                    <div
                      className="relative h-14 w-14 rounded-full flex items-center justify-center transition"
                      style={
                        done
                          ? { backgroundColor: "#C9A24B", color: "#14100D" }
                          : { backgroundColor: "rgba(201,162,75,0.08)", color: "#8A8276" }
                      }
                    >
                      {current && (
                        <span
                          className="absolute inset-0 rounded-full border-2 animate-ping"
                          style={{ borderColor: "#C9A24B" }}
                        />
                      )}
                      <Icon className="h-6 w-6" />
                    </div>
                    <p
                      className="mt-3 text-sm font-bold"
                      style={{ color: done ? "#F3E9D6" : "#8A8276" }}
                    >
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(201,162,75,0.1)" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  backgroundColor: "#C9A24B",
                  width: `${Math.min(100, ((activeIdx + 1) / steps.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Delivery tracking card */}
        {isDelivery && delivery?.trackingUrl && (
          <div
            className="mt-6 rounded-[1.75rem] p-6"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.3)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-bold text-lg" style={{ color: "#F3E9D6" }}>Track your driver</p>
                <p className="text-sm mt-0.5" style={{ color: "#8A8276" }}>
                  Live driver location via DoorDash
                </p>
              </div>
              <a
                href={delivery.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-sm transition"
                style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
              >
                Open tracking <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {/* Order detail grid */}
        <div className="mt-8 grid md:grid-cols-[1fr_300px] gap-6">
          {/* Items + totals */}
          <div
            className="rounded-[1.75rem] p-6"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: "#F3E9D6" }}>Order items</h2>
            <ul style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}>
              {items.map((it) => (
                <li
                  key={it.id}
                  className="py-3 flex justify-between text-sm"
                  style={{ borderBottom: "1px solid rgba(201,162,75,0.15)" }}
                >
                  <span style={{ color: "#F3E9D6" }}>
                    <span className="font-bold">{it.quantity ?? 1}×</span> {it.itemName}
                  </span>
                  <span className="font-semibold" style={{ color: "#F3E9D6" }}>
                    ${((it.quantity ?? 1) * parseFloat(it.itemPrice ?? "0")).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <dl
              className="mt-4 pt-4 space-y-1.5 text-sm"
              style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
            >
              <TotalRow label="Subtotal" value={`$${parseFloat(order.subtotal ?? "0").toFixed(2)}`} />
              <TotalRow label="Tax" value={`$${parseFloat(order.tax ?? "0").toFixed(2)}`} />
              {isDelivery && (
                <TotalRow
                  label="Delivery fee"
                  value={`$${delivery?.feeCents != null ? (delivery.feeCents / 100).toFixed(2) : parseFloat(order.deliveryFee ?? "0").toFixed(2)}`}
                />
              )}
              <TotalRow label="Tip" value={`$${parseFloat(order.tip ?? "0").toFixed(2)}`} />
              <div className="pt-2 flex justify-between items-baseline">
                <dt className="font-bold" style={{ color: "#F3E9D6" }}>Total</dt>
                <dd
                  className="text-2xl font-bold"
                  style={{ color: "#C9A24B", fontFamily: "var(--font-display)" }}
                >
                  ${parseFloat(order.total ?? "0").toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Fulfillment details */}
          <div
            className="rounded-[1.75rem] p-6"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#F3E9D6" }}
          >
            <h2 className="text-xl font-bold mb-4">
              {isDelivery ? "Delivery" : "Pickup"}
            </h2>
            <p className="text-sm mb-1" style={{ color: "#8A8276" }}>Address</p>
            <p className="mb-4">
              {isDelivery ? (order.deliveryAddress ?? "—") : "948 Clay Street, Oakland 94607"}
            </p>
            <p className="text-sm mb-1" style={{ color: "#8A8276" }}>Contact</p>
            <p>{order.customerName}</p>
            <p className="text-sm" style={{ color: "#8A8276" }}>{order.customerPhone}</p>
            <a
              href="tel:+15102509696"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 font-bold text-sm transition"
              style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
            >
              <Phone className="h-4 w-4" />
              Call the restaurant
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-full px-6 py-3 font-bold transition"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
          >
            Order more
          </Link>
          <Link
            href="/admin"
            className="rounded-full px-6 py-3 font-bold transition"
            style={{ border: "2px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}
          >
            Open kitchen view →
          </Link>
        </div>
      </div>
    </section>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between" style={{ color: "#8A8276" }}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
