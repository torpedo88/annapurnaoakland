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
      <div className="bg-[#2B1E16] text-[#FDF4E4]">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p
                className="text-sm uppercase tracking-[0.3em] mb-2"
                style={{ color: "#F2A545" }}
              >
                Kitchen Display
              </p>
              <h1
                className="text-4xl lg:text-6xl leading-[0.95] tracking-tight"
                style={{ fontFamily: "var(--font-instrument), serif" }}
              >
                Tonight&apos;s <em style={{ color: "#F2A545" }}>board.</em>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="relative rounded-full bg-[#C85A3C] h-12 w-12 flex items-center justify-center hover:bg-[#F2A545] hover:text-[#2B1E16] transition"
                title="New orders"
              >
                <Bell className="h-5 w-5" />
                {newCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#FDF4E4] text-[#2B1E16] text-xs font-bold flex items-center justify-center ring-2 ring-[#2B1E16]">
                    {newCount}
                  </span>
                )}
              </button>
              <Link
                href="/menu"
                className="rounded-full bg-[#FDF4E4] text-[#C85A3C] px-5 py-2.5 font-bold text-sm hover:bg-[#F2A545] hover:text-[#2B1E16] transition"
              >
                Add test order →
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#FDF4E4]/30 text-[#FDF4E4]/75 px-4 py-2.5 text-xs font-semibold hover:bg-[#FDF4E4]/10 hover:text-[#FDF4E4] transition"
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
            <Stat label="Active" value={counts.active.toString()} accent="#F2A545" />
            <Stat label="Completed today" value={counts.completed.toString()} accent="#4A6B4A" />
            <Stat label="Revenue today" value={`$${counts.todayRevenue.toFixed(0)}`} accent="#C85A3C" />
            <Stat
              label="Avg ticket"
              value={`$${counts.avgTicket.toFixed(2)}`}
              accent="#FDF4E4"
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
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                lane === t.id
                  ? "bg-[#2B1E16] text-[#FDF4E4]"
                  : "bg-white border border-[#2B1E16]/10 hover:border-[#2B1E16]"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {t.label}
              <span
                className={`ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs rounded-full ${
                  lane === t.id ? "bg-[#F2A545] text-[#2B1E16]" : "bg-[#2B1E16]/10 text-[#2B1E16]/70"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Order cards */}
        {filtered.length === 0 ? (
          <div className="mt-14 text-center py-20 rounded-[1.75rem] bg-white border border-dashed border-[#2B1E16]/15">
            <p className="text-3xl" style={{ fontFamily: "var(--font-instrument), serif" }}>
              {lane === "active"
                ? "No active orders. Kitchen's quiet."
                : lane === "completed"
                  ? "No orders completed yet today."
                  : "No cancelled orders."}
            </p>
            {lane === "active" && (
              <p className="mt-3 text-[#2B1E16]/60 max-w-md mx-auto text-sm">
                Place an order from the <Link href="/menu" className="underline font-bold">menu</Link> and
                it&apos;ll appear here in real time.
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

      <p className="mt-14 text-center text-[11px] uppercase tracking-widest text-[#2B1E16]/40">
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
      className={`rounded-[1.5rem] bg-white border p-5 shadow-sm transition ${
        urgent ? "border-[#C85A3C] ring-2 ring-[#C85A3C]/20" : "border-[#2B1E16]/8"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#2B1E16]/50 font-bold">
            {order.fulfillment === "pickup" ? "Pickup" : "Delivery"} ·{" "}
            <span className="font-mono">{order.code}</span>
          </p>
          <h3
            className="text-xl font-bold mt-0.5"
            style={{ fontFamily: "var(--font-instrument), serif" }}
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

      <div className="flex items-center gap-4 text-xs text-[#2B1E16]/60 mb-3">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {minsAgo === 0 ? "just now" : `${minsAgo} min ago`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {order.customer.phone}
        </span>
        {urgent && (
          <span className="inline-flex items-center gap-1 font-bold text-[#C85A3C]">
            ⚠ Over 15 min
          </span>
        )}
      </div>

      <ul className="space-y-1.5 mb-4 bg-[#F2A545]/10 rounded-2xl p-3 max-h-40 overflow-y-auto">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between text-sm">
            <span>
              <span className="font-bold text-[#C85A3C]">{it.qty}×</span> {it.name}
            </span>
            <span className="text-[#2B1E16]/60">${(it.qty * it.price).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="rounded-2xl bg-[#2B1E16] text-[#F2A545] px-4 py-3 text-xs mb-4">
          <p className="uppercase tracking-widest text-[10px] opacity-60 mb-1">Note</p>
          {order.notes}
        </div>
      )}

      {order.fulfillment === "delivery" && order.address && (
        <p className="text-xs text-[#2B1E16]/65 mb-4">
          <span className="font-bold">Deliver to:</span> {order.address}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#2B1E16]/10">
        <span
          className="text-xl font-bold"
          style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
        >
          ${order.total.toFixed(2)}
        </span>
        <div className="flex gap-2">
          {next && (
            <button
              onClick={() => updateOrderStatus(order.id, next.to)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2B1E16] text-[#FDF4E4] px-4 py-2 text-xs font-bold hover:bg-[#C85A3C] transition"
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
              className="inline-flex items-center rounded-full border border-[#2B1E16]/15 text-[#2B1E16]/60 p-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
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
    <div className="rounded-2xl bg-[#FDF4E4]/8 border border-[#FDF4E4]/15 px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p
        className="text-3xl lg:text-4xl font-bold"
        style={{ color: accent, fontFamily: "var(--font-instrument), serif" }}
      >
        {value}
      </p>
    </div>
  );
}
