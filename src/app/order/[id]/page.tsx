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
          <p
            className="text-4xl mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
          >
            Order not found.
          </p>
          <p className="mb-6" style={{ color: "#8A8276" }}>
            It may have expired from this browser&apos;s storage.
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

  const meta = statusMeta(order.status);
  const minsTilReady = Math.max(0, Math.ceil((order.estimatedReady - Date.now()) / 60_000));
  const activeIdx = STEPS.findIndex((s) => s.status === order.status);

  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,162,75,0.06), transparent 70%)" }}
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
          style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
        >
          {order.status === "ready" ? (
            <>Your order is <span style={{ color: "#C9A24B" }}>ready.</span></>
          ) : order.status === "completed" ? (
            <>Thanks for <span style={{ color: "#C9A24B" }}>ordering.</span></>
          ) : (
            <>Thanks, {order.customer.name.split(" ")[0]}. <span style={{ color: "#C9A24B" }}>We&apos;re on it.</span></>
          )}
        </h1>

        <p className="mt-5 text-lg max-w-xl" style={{ color: "#8A8276" }} data-tick={tick}>
          {order.status === "ready"
            ? order.fulfillment === "pickup"
              ? "Come pick it up at 948 Clay Street. We'll keep it warm."
              : "Your driver is on the way."
            : `Estimated ${order.fulfillment === "pickup" ? "ready" : "delivery"} in ~${minsTilReady} min.`}
        </p>

        <p className="mt-2 text-sm" style={{ color: "#8A8276" }}>
          Order code ·{" "}
          <span className="font-mono font-semibold" style={{ color: "#F3E9D6" }}>{order.code}</span>
        </p>

        {/* Progress bar */}
        {order.status !== "cancelled" && (
          <div
            className="mt-10 rounded-[1.75rem] p-7"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
          >
            <div className="grid grid-cols-3 gap-4 mb-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i <= activeIdx;
                const current = i === activeIdx;
                return (
                  <div key={s.status} className="flex flex-col items-center text-center">
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
                  width: `${order.status === "completed" ? 100 : (activeIdx + 1) * 33.33}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Order detail */}
        <div className="mt-8 grid md:grid-cols-[1fr_300px] gap-6">
          <div
            className="rounded-[1.75rem] p-6"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: "#F3E9D6" }}>Order items</h2>
            <ul style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}>
              {order.items.map((it) => (
                <li
                  key={it.id}
                  className="py-3 flex justify-between text-sm"
                  style={{ borderBottom: "1px solid rgba(201,162,75,0.15)" }}
                >
                  <span style={{ color: "#F3E9D6" }}>
                    <span className="font-bold">{it.qty}×</span> {it.name}
                  </span>
                  <span className="font-semibold" style={{ color: "#F3E9D6" }}>
                    ${(it.qty * it.price).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <dl
              className="mt-4 pt-4 space-y-1.5 text-sm"
              style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
            >
              <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
              <Row label="Tax" value={`$${order.tax.toFixed(2)}`} />
              <Row label="Tip" value={`$${order.tip.toFixed(2)}`} />
              <div className="pt-2 flex justify-between items-baseline">
                <dt className="font-bold" style={{ color: "#F3E9D6" }}>Total</dt>
                <dd
                  className="text-2xl font-bold"
                  style={{ color: "#C9A24B", fontFamily: "var(--font-display)" }}
                >
                  ${order.total.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          <div
            className="rounded-[1.75rem] p-6"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#F3E9D6" }}
          >
            <h2 className="text-xl font-bold mb-4">
              {order.fulfillment === "pickup" ? "Pickup" : "Delivery"}
            </h2>
            <p className="text-sm mb-1" style={{ color: "#8A8276" }}>Address</p>
            <p className="mb-4">
              {order.fulfillment === "pickup" ? "948 Clay Street, Oakland 94607" : order.address}
            </p>
            <p className="text-sm mb-1" style={{ color: "#8A8276" }}>Contact</p>
            <p>{order.customer.name}</p>
            <p className="text-sm" style={{ color: "#8A8276" }}>{order.customer.phone}</p>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between" style={{ color: "#8A8276" }}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
