"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  Clock,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Filter,
  Bell,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { signOut } from "./actions";
import {
  loadOrders,
  onOrdersChange,
  updateOrderStatus,
  statusMeta,
  type Order,
  type OrderStatus,
} from "@/lib/preview-order";

type Lane = "active" | "completed" | "cancelled";

const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string; icon: React.ElementType }>> = {
  received: { to: "preparing", label: "Start preparing", icon: ChefHat },
  preparing: { to: "ready", label: "Mark ready", icon: PackageCheck },
  ready: { to: "completed", label: "Hand off", icon: CheckCircle2 },
};

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lane, setLane] = useState<Lane>("active");
  const [, setTick] = useState(0);

  useEffect(() => {
    setOrders(loadOrders());
    const off = onOrdersChange(() => setOrders(loadOrders()));
    const clockInterval = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => {
      off();
      clearInterval(clockInterval);
    };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (lane === "active") return o.status === "received" || o.status === "preparing" || o.status === "ready";
      if (lane === "completed") return o.status === "completed";
      return o.status === "cancelled";
    });
  }, [orders, lane]);

  const counts = useMemo(() => ({
    active: orders.filter((o) => ["received", "preparing", "ready"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    todayRevenue: orders
      .filter((o) => o.status !== "cancelled" && Date.now() - o.createdAt < 24 * 3600_000)
      .reduce((s, o) => s + o.total, 0),
    avgTicket:
      orders.length > 0
        ? orders.reduce((s, o) => s + o.total, 0) / orders.length
        : 0,
  }), [orders]);

  const newCount = useMemo(() => orders.filter((o) => o.status === "received").length, [orders]);

  return (
    <section className="min-h-screen pb-24">
      {/* Admin sub-header */}
      <div style={{ backgroundColor: "#1C1712", borderBottom: "1px solid rgba(201,162,75,0.15)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p
                className="text-sm uppercase tracking-[0.3em] mb-2"
                style={{ color: "#C9A24B" }}
              >
                Kitchen Display
              </p>
              <h1
                className="text-4xl lg:text-6xl leading-[0.95] tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
              >
                Tonight&apos;s board.
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="relative rounded-full h-12 w-12 flex items-center justify-center transition"
                style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
                title="New orders"
              >
                <Bell className="h-5 w-5" />
                {newCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold flex items-center justify-center ring-2 ring-[#1C1712]"
                    style={{ backgroundColor: "#F3E9D6", color: "#14100D" }}
                  >
                    {newCount}
                  </span>
                )}
              </button>
              <Link
                href="/menu"
                className="rounded-full px-5 py-2.5 font-bold text-sm transition"
                style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
              >
                Add test order →
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition"
                  style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#8A8276" }}
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            <Stat label="Active" value={counts.active.toString()} accent="#C9A24B" />
            <Stat label="Completed today" value={counts.completed.toString()} accent="#4A6B4A" />
            <Stat label="Revenue today" value={`$${counts.todayRevenue.toFixed(0)}`} accent="#C9A24B" />
            <Stat
              label="Avg ticket"
              value={`$${counts.avgTicket.toFixed(2)}`}
              accent="#F3E9D6"
            />
          </div>
        </div>
      </div>

      {/* Lane tabs */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 mt-8">
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: "active" as Lane, label: "Active", count: counts.active },
              { id: "completed" as Lane, label: "Completed", count: counts.completed },
              { id: "cancelled" as Lane, label: "Cancelled", count: counts.cancelled },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setLane(t.id)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition"
              style={
                lane === t.id
                  ? { backgroundColor: "#C9A24B", color: "#14100D" }
                  : { backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }
              }
            >
              <Filter className="h-3.5 w-3.5" />
              {t.label}
              <span
                className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs rounded-full"
                style={
                  lane === t.id
                    ? { backgroundColor: "rgba(20,16,13,0.25)", color: "#14100D" }
                    : { backgroundColor: "rgba(201,162,75,0.1)", color: "#8A8276" }
                }
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Order cards */}
        {filtered.length === 0 ? (
          <div
            className="mt-14 text-center py-20 rounded-[1.75rem]"
            style={{ backgroundColor: "#1C1712", border: "1px dashed rgba(201,162,75,0.15)" }}
          >
            <p
              className="text-3xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
            >
              {lane === "active"
                ? "No active orders. Kitchen's quiet."
                : lane === "completed"
                  ? "No orders completed yet today."
                  : "No cancelled orders."}
            </p>
            {lane === "active" && (
              <p className="mt-3 max-w-md mx-auto text-sm" style={{ color: "#8A8276" }}>
                Place an order from the{" "}
                <Link href="/menu" className="underline font-bold" style={{ color: "#C9A24B" }}>
                  menu
                </Link>{" "}
                and it&apos;ll appear here in real time.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>

      <p
        className="mt-14 text-center text-[11px] uppercase tracking-widest"
        style={{ color: "#8A8276" }}
      >
        Demo kitchen · orders persist in localStorage · polls for storage events
      </p>
    </section>
  );
}

function OrderCard({ order }: { order: Order }) {
  const meta = statusMeta(order.status);
  const next = NEXT_STATUS[order.status];
  const minsAgo = Math.floor((Date.now() - order.createdAt) / 60_000);
  const urgent = minsAgo > 15 && order.status !== "completed" && order.status !== "ready";

  return (
    <article
      className="rounded-[1.5rem] p-5 transition"
      style={{
        backgroundColor: "#1C1712",
        border: urgent
          ? "1px solid #C9A24B"
          : "1px solid rgba(201,162,75,0.15)",
        boxShadow: urgent ? "0 0 0 2px rgba(201,162,75,0.2)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p
            className="text-[10px] uppercase tracking-widest font-bold"
            style={{ color: "#8A8276" }}
          >
            {order.fulfillment === "pickup" ? "Pickup" : "Delivery"} ·{" "}
            <span className="font-mono">{order.code}</span>
          </p>
          <h3
            className="text-xl font-bold mt-0.5"
            style={{ fontFamily: "var(--font-display)", color: "#F3E9D6" }}
          >
            {order.customer.name}
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ backgroundColor: meta.bg, color: meta.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.ring }} />
          {meta.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs mb-3" style={{ color: "#8A8276" }}>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {minsAgo === 0 ? "just now" : `${minsAgo} min ago`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {order.customer.phone}
        </span>
        {urgent && (
          <span className="inline-flex items-center gap-1 font-bold" style={{ color: "#C9A24B" }}>
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Over 15 min
          </span>
        )}
      </div>

      <ul
        className="space-y-1.5 mb-4 rounded-2xl p-3 max-h-40 overflow-y-auto"
        style={{ backgroundColor: "rgba(201,162,75,0.07)" }}
      >
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-bold" style={{ color: "#C9A24B" }}>{it.qty}×</span>{" "}
              <span style={{ color: "#F3E9D6" }}>{it.name}</span>
            </span>
            <span className="shrink-0" style={{ color: "#8A8276" }}>${(it.qty * it.price).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div
          className="rounded-2xl px-4 py-3 text-xs mb-4"
          style={{ backgroundColor: "#14100D", border: "1px solid rgba(201,162,75,0.15)", color: "#C9A24B" }}
        >
          <p className="uppercase tracking-widest text-[10px] opacity-60 mb-1">Note</p>
          {order.notes}
        </div>
      )}

      {order.fulfillment === "delivery" && order.address && (
        <p className="text-xs mb-4" style={{ color: "#8A8276" }}>
          <span className="font-bold" style={{ color: "#F3E9D6" }}>Deliver to:</span> {order.address}
        </p>
      )}

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
      >
        <span
          className="text-xl font-bold"
          style={{ color: "#C9A24B", fontFamily: "var(--font-display)" }}
        >
          ${order.total.toFixed(2)}
        </span>
        <div className="flex gap-2">
          {next && (
            <button
              onClick={() => updateOrderStatus(order.id, next.to)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition"
              style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
            >
              <next.icon className="h-3.5 w-3.5" />
              {next.label}
            </button>
          )}
          {(order.status === "received" || order.status === "preparing") && (
            <button
              onClick={() => {
                if (confirm("Cancel this order?")) updateOrderStatus(order.id, "cancelled");
              }}
              className="inline-flex items-center rounded-full p-2 transition hover:bg-red-900/40 hover:border-red-500 hover:text-red-400"
              style={{ border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }}
              aria-label="Cancel"
              title="Cancel order"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ backgroundColor: "rgba(201,162,75,0.05)", border: "1px solid rgba(201,162,75,0.15)" }}
    >
      <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1" style={{ color: "#8A8276" }}>{label}</p>
      <p
        className="text-3xl lg:text-4xl font-bold"
        style={{ color: accent, fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}
