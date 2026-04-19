"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CheckCircle2, ChefHat, PackageCheck, Phone } from "lucide-react";
import { getOrder, onOrdersChange, statusMeta, type Order } from "@/lib/preview-order";

const STEPS: { status: Order["status"]; label: string; icon: React.ElementType }[] = [
  { status: "received", label: "Received", icon: CheckCircle2 },
  { status: "preparing", label: "Preparing", icon: ChefHat },
  { status: "ready", label: "Ready", icon: PackageCheck },
];

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setOrder(getOrder(id) ?? null);
    const off = onOrdersChange(() => setOrder(getOrder(id) ?? null));
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      off();
      clearInterval(interval);
    };
  }, [id]);

  if (!order) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-3" style={{ fontFamily: "var(--font-instrument), serif" }}>
            Order not found.
          </p>
          <p className="text-[#2B1E16]/60 mb-6">
            It may have expired from this browser&apos;s storage.
          </p>
          <Link
            href="/menu"
            className="inline-flex rounded-full bg-[#C85A3C] text-[#FDF4E4] px-7 py-3.5 font-bold"
          >
            Back to menu
          </Link>
        </div>
      </section>
    );
  }

  const meta = statusMeta(order.status);
  const minsTilReady = Math.max(0, Math.ceil((order.estimatedReady - Date.now()) / 60_000));
  const activeIdx = STEPS.findIndex((s) => s.status === order.status);

  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F2A545, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-4xl px-6 lg:px-10">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
          style={{ backgroundColor: meta.bg, color: meta.color }}
        >
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: meta.ring }} />
          {meta.label}
        </div>

        <h1
          className="text-5xl lg:text-7xl leading-[0.95] tracking-tight"
          style={{ fontFamily: "var(--font-instrument), serif" }}
        >
          {order.status === "ready" ? (
            <>Your order is <em style={{ color: "#C85A3C" }}>ready.</em></>
          ) : order.status === "completed" ? (
            <>Thanks for <em style={{ color: "#C85A3C" }}>ordering.</em></>
          ) : (
            <>Thanks, {order.customer.name.split(" ")[0]}. <em style={{ color: "#C85A3C" }}>We&apos;re on it.</em></>
          )}
        </h1>

        <p className="mt-5 text-lg text-[#2B1E16]/70 max-w-xl" data-tick={tick}>
          {order.status === "ready"
            ? order.fulfillment === "pickup"
              ? "Come pick it up at 948 Clay Street. We'll keep it warm."
              : "Your driver is on the way."
            : `Estimated ${order.fulfillment === "pickup" ? "ready" : "delivery"} in ~${minsTilReady} min.`}
        </p>

        <p className="mt-2 text-sm text-[#2B1E16]/50">
          Order code · <span className="font-mono font-semibold text-[#2B1E16]/80">{order.code}</span>
        </p>

        {/* Progress bar */}
        {order.status !== "cancelled" && (
          <div className="mt-10 rounded-[1.75rem] bg-white border border-[#2B1E16]/8 p-7 shadow-sm">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i <= activeIdx;
                const current = i === activeIdx;
                return (
                  <div key={s.status} className="flex flex-col items-center text-center">
                    <div
                      className={`relative h-14 w-14 rounded-full flex items-center justify-center transition ${
                        done
                          ? "bg-[#C85A3C] text-[#FDF4E4]"
                          : "bg-[#2B1E16]/5 text-[#2B1E16]/40"
                      }`}
                    >
                      {current && (
                        <span className="absolute inset-0 rounded-full border-2 border-[#C85A3C] animate-ping" />
                      )}
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className={`mt-3 text-sm font-bold ${done ? "text-[#2B1E16]" : "text-[#2B1E16]/45"}`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="relative h-1.5 rounded-full bg-[#2B1E16]/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  backgroundColor: "#C85A3C",
                  width: `${order.status === "completed" ? 100 : (activeIdx + 1) * 33.33}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Order detail */}
        <div className="mt-8 grid md:grid-cols-[1fr_300px] gap-6">
          <div className="rounded-[1.75rem] bg-white border border-[#2B1E16]/8 p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Order items</h2>
            <ul className="divide-y divide-[#2B1E16]/10">
              {order.items.map((it) => (
                <li key={it.id} className="py-3 flex justify-between text-sm">
                  <span>
                    <span className="font-bold">{it.qty}×</span> {it.name}
                  </span>
                  <span className="font-semibold">${(it.qty * it.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-[#2B1E16]/10 space-y-1.5 text-sm">
              <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
              <Row label="Tax" value={`$${order.tax.toFixed(2)}`} />
              <Row label="Tip" value={`$${order.tip.toFixed(2)}`} />
              <div className="pt-2 flex justify-between items-baseline">
                <dt className="font-bold">Total</dt>
                <dd
                  className="text-2xl font-bold"
                  style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
                >
                  ${order.total.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[1.75rem] bg-[#2B1E16] text-[#FDF4E4] p-6">
            <h2 className="text-xl font-bold mb-4">
              {order.fulfillment === "pickup" ? "Pickup" : "Delivery"}
            </h2>
            <p className="text-sm opacity-75 mb-1">Address</p>
            <p className="mb-4">
              {order.fulfillment === "pickup" ? "948 Clay Street, Oakland 94607" : order.address}
            </p>
            <p className="text-sm opacity-75 mb-1">Contact</p>
            <p>{order.customer.name}</p>
            <p className="text-sm opacity-75">{order.customer.phone}</p>
            <a
              href="tel:+15102509696"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#C85A3C] text-[#FDF4E4] py-3 font-bold text-sm hover:bg-[#F2A545] hover:text-[#2B1E16] transition"
            >
              <Phone className="h-4 w-4" />
              Call the restaurant
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-full bg-[#C85A3C] text-[#FDF4E4] px-6 py-3 font-bold hover:bg-[#2B1E16] transition"
          >
            Order more
          </Link>
          <Link
            href="/admin"
            className="rounded-full border-2 border-[#2B1E16] px-6 py-3 font-bold hover:bg-[#2B1E16] hover:text-[#FDF4E4] transition"
          >
            Open kitchen view →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[#2B1E16]/75">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
