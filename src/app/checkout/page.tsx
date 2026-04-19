"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/preview-cart";
import { appendOrder, generateOrderCode, type Order } from "@/lib/preview-order";

type Fulfillment = "pickup" | "delivery";
const TIP_PRESETS = [0.15, 0.18, 0.2];

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, tax, clear } = useCart();

  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tipPct, setTipPct] = useState<number>(0.18);
  const [customTip, setCustomTip] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = fulfillment === "delivery" ? 4.99 : 0;
  const tip = useMemo(() => {
    if (customTip) {
      const n = parseFloat(customTip);
      return Number.isFinite(n) && n >= 0 ? +n.toFixed(2) : 0;
    }
    return +(subtotal * tipPct).toFixed(2);
  }, [customTip, tipPct, subtotal]);

  const total = +(subtotal + tax + tip + deliveryFee).toFixed(2);

  if (lines.length === 0) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-6">
          <p
            className="text-4xl mb-3"
            style={{ fontFamily: "var(--font-instrument), serif" }}
          >
            Your bag is empty.
          </p>
          <p className="text-[#2B1E16]/60 mb-6">Add a dish before checking out.</p>
          <Link
            href="/menu"
            className="inline-flex rounded-full bg-[#C85A3C] text-[#FDF4E4] px-7 py-3.5 font-bold hover:bg-[#2B1E16] transition"
          >
            Browse menu
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    if (fulfillment === "delivery" && !address.trim()) {
      setError("Delivery address is required.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    const id = crypto.randomUUID();
    const code = generateOrderCode();
    const now = Date.now();
    const order: Order = {
      id,
      code,
      items: lines.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty })),
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      fulfillment,
      address: fulfillment === "delivery" ? address.trim() : undefined,
      notes: notes.trim() || undefined,
      subtotal: +subtotal.toFixed(2),
      tax: +tax.toFixed(2),
      tip,
      total,
      status: "received",
      createdAt: now,
      estimatedReady: now + (fulfillment === "pickup" ? 20 : 40) * 60_000,
    };
    appendOrder(order);
    clear();
    router.push(`/order/${id}`);
  };

  return (
    <section className="py-10 lg:py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mb-10">
          <p
            className="text-2xl mb-1"
            style={{ color: "#C85A3C", fontFamily: "var(--font-caveat), cursive" }}
          >
            almost there
          </p>
          <h1
            className="text-5xl lg:text-6xl leading-[0.95] tracking-tight"
            style={{ fontFamily: "var(--font-instrument), serif" }}
          >
            <em style={{ color: "#C85A3C" }}>Checkout.</em>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
          <div className="space-y-10">
            {/* Fulfillment */}
            <div>
              <h2 className="text-lg font-bold text-[#2B1E16] mb-3">How should we get this to you?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  { id: "pickup", title: "Pickup", eta: "Ready in ~20 min", sub: "948 Clay St, Oakland" },
                  { id: "delivery", title: "Delivery", eta: "~40 min · 5-mile radius", sub: "$4.99 fee" },
                ] as const).map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setFulfillment(opt.id)}
                    className={`text-left rounded-2xl p-5 border-2 transition ${
                      fulfillment === opt.id
                        ? "bg-[#C85A3C] text-[#FDF4E4] border-[#C85A3C]"
                        : "bg-white border-[#2B1E16]/10 hover:border-[#C85A3C]"
                    }`}
                  >
                    <p className="font-bold text-lg">{opt.title}</p>
                    <p
                      className={`text-sm mt-0.5 ${
                        fulfillment === opt.id ? "text-[#FDF4E4]/80" : "text-[#2B1E16]/60"
                      }`}
                    >
                      {opt.eta}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        fulfillment === opt.id ? "text-[#FDF4E4]/60" : "text-[#2B1E16]/50"
                      }`}
                    >
                      {opt.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-lg font-bold text-[#2B1E16] mb-3">Who&apos;s this for?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name *" value={name} onChange={setName} placeholder="Your name" />
                <Field label="Phone *" value={phone} onChange={setPhone} placeholder="(510) 555-0199" type="tel" />
                <Field label="Email (for receipt)" value={email} onChange={setEmail} placeholder="you@email.com" type="email" full />
                {fulfillment === "delivery" && (
                  <Field label="Delivery address *" value={address} onChange={setAddress} placeholder="Street, Apt, City" full />
                )}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B1E16]/60 mb-1.5">
                    Notes for the kitchen (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, spice level, door code…"
                    className="w-full rounded-2xl bg-white border border-[#2B1E16]/10 p-4 text-sm resize-none focus:outline-none focus:border-[#C85A3C] focus:ring-2 focus:ring-[#C85A3C]/20"
                  />
                </div>
              </div>
            </div>

            {/* Tip */}
            <div>
              <h2 className="text-lg font-bold text-[#2B1E16] mb-3">
                Add a tip <span className="font-normal text-sm text-[#2B1E16]/60">(100% goes to the kitchen &amp; FOH team)</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {TIP_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setTipPct(p);
                      setCustomTip("");
                    }}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      tipPct === p && !customTip
                        ? "bg-[#2B1E16] text-[#FDF4E4]"
                        : "bg-white border border-[#2B1E16]/10 hover:border-[#2B1E16]"
                    }`}
                  >
                    {Math.round(p * 100)}% · ${(subtotal * p).toFixed(2)}
                  </button>
                ))}
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#2B1E16]/10 px-4">
                  <span className="text-sm text-[#2B1E16]/50">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder="Custom"
                    className="w-20 py-2.5 text-sm focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Payment (dummy) */}
            <div>
              <h2 className="text-lg font-bold text-[#2B1E16] mb-3">Payment</h2>
              <div className="rounded-2xl bg-white border-2 border-dashed border-[#2B1E16]/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#F2A545]/30 flex items-center justify-center text-[#C85A3C] font-bold">
                    ⚡
                  </div>
                  <div>
                    <p className="font-bold">Demo mode — no card required</p>
                    <p className="text-sm text-[#2B1E16]/60">
                      Real build wires Toast Order Pay or Stripe here. This one skips straight to
                      confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-[1.75rem] bg-white border border-[#2B1E16]/6 p-6 shadow-sm">
              <h3
                className="text-2xl mb-4"
                style={{ fontFamily: "var(--font-instrument), serif" }}
              >
                Order summary
              </h3>
              <ul className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                {lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-[#2B1E16]">{l.name}</p>
                      <p className="text-[#2B1E16]/55">
                        {l.qty} × ${l.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold whitespace-nowrap">
                      ${(l.qty * l.price).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 text-sm border-t border-[#2B1E16]/10 pt-4">
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="Tax" value={`$${tax.toFixed(2)}`} />
                {deliveryFee > 0 && <Row label="Delivery" value={`$${deliveryFee.toFixed(2)}`} />}
                <Row label="Tip" value={`$${tip.toFixed(2)}`} />
                <div className="pt-2 mt-2 border-t border-[#2B1E16]/10 flex justify-between items-baseline">
                  <dt className="font-bold">Total</dt>
                  <dd
                    className="text-3xl font-bold"
                    style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
                  >
                    ${total.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#C85A3C] text-[#FDF4E4] py-4 font-bold text-base hover:bg-[#2B1E16] transition disabled:opacity-60 disabled:cursor-wait"
              >
                {submitting ? "Sending to kitchen…" : `Place order · $${total.toFixed(2)}`}
              </button>
              <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-[#2B1E16]/50">
                Demo · orders live in localStorage
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B1E16]/60 mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-full bg-white border border-[#2B1E16]/10 px-5 py-3 text-sm focus:outline-none focus:border-[#C85A3C] focus:ring-2 focus:ring-[#C85A3C]/20"
      />
    </div>
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
