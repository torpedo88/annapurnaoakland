"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/preview-cart";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Fulfillment = "pickup" | "delivery";
const TIP_PRESETS = [0.15, 0.18, 0.2];

interface QuoteState {
  loading: boolean;
  feeCents: number | null;
  durationSeconds: number | null;
  externalDeliveryId: string | null;
  error: string | null;
}

const INITIAL_QUOTE: QuoteState = {
  loading: false,
  feeCents: null,
  durationSeconds: null,
  externalDeliveryId: null,
  error: null,
};

export default function CheckoutPage() {
  const { lines, subtotal, tax } = useCart();

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
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteState>(INITIAL_QUOTE);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Live delivery quote (debounced) ───────────────────────────────────────
  useEffect(() => {
    if (fulfillment !== "delivery") {
      setQuote(INITIAL_QUOTE);
      return;
    }
    if (!address.trim() || !phone.trim()) {
      setQuote(INITIAL_QUOTE);
      return;
    }

    // Debounce: wait 800ms after the user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setQuote((q) => ({ ...q, loading: true, error: null }));
      try {
        const res = await fetch("/api/delivery/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: address.trim(),
            phone: phone.trim(),
            items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          }),
        });
        const json = await res.json() as {
          externalDeliveryId?: string;
          feeCents?: number;
          durationSeconds?: number | null;
          error?: string;
        };
        if (!res.ok || json.error) {
          setQuote({ loading: false, feeCents: null, durationSeconds: null, externalDeliveryId: null, error: json.error ?? "Could not get delivery quote" });
        } else {
          setQuote({
            loading: false,
            feeCents: json.feeCents ?? null,
            durationSeconds: json.durationSeconds ?? null,
            externalDeliveryId: json.externalDeliveryId ?? null,
            error: null,
          });
        }
      } catch {
        setQuote({ loading: false, feeCents: null, durationSeconds: null, externalDeliveryId: null, error: "Could not get delivery quote" });
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fulfillment, address, phone, lines]);

  // ─── Fee calculation ───────────────────────────────────────────────────────
  // Use live feeCents from quote; fall back to 0 while no quote yet
  const deliveryFee = useMemo(() => {
    if (fulfillment !== "delivery") return 0;
    if (quote.feeCents != null) return +(quote.feeCents / 100).toFixed(2);
    return 0;
  }, [fulfillment, quote.feeCents]);

  const tip = useMemo(() => {
    if (customTip) {
      const n = parseFloat(customTip);
      return Number.isFinite(n) && n >= 0 ? +n.toFixed(2) : 0;
    }
    return +(subtotal * tipPct).toFixed(2);
  }, [customTip, tipPct, subtotal]);

  const total = +(subtotal + tax + tip + deliveryFee).toFixed(2);

  // ─── Delivery option sub-label ──────────────────────────────────────────────
  const deliveryOptionSub = useMemo(() => {
    if (fulfillment !== "delivery") return "$0.00 fee";
    if (quote.loading) return "Getting quote…";
    if (quote.feeCents != null) {
      const fee = `$${(quote.feeCents / 100).toFixed(2)} fee`;
      if (quote.durationSeconds != null) {
        const mins = Math.ceil(quote.durationSeconds / 60);
        return `${fee} · ~${mins} min`;
      }
      return fee;
    }
    if (quote.error) return "Quote unavailable";
    return "Enter address for live fee";
  }, [fulfillment, quote]);

  // ─── Empty cart ────────────────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-6">
          <p
            className="text-4xl mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
          >
            Your bag is empty.
          </p>
          <p className="mb-6" style={{ color: "#8A8276" }}>Add a dish before checking out.</p>
          <Link
            href="/menu"
            className="inline-flex rounded-full px-7 py-3.5 font-bold transition"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
          >
            Browse menu
          </Link>
        </div>
      </section>
    );
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDeliveryNotice(null);
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    if (fulfillment === "delivery" && !address.trim()) {
      setError("Delivery address is required.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          fulfillment,
          address: fulfillment === "delivery" ? address.trim() : undefined,
          items: lines.map((l) => ({ id: l.id, qty: l.qty, spiceLevel: l.spiceLevel })),
          tip,
          externalDeliveryId: quote.externalDeliveryId ?? undefined,
        }),
      });
      const json = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !json.clientSecret) {
        setError(json.error ?? "Could not start checkout. Please try again.");
        setSubmitting(false);
        return;
      }
      setClientSecret(json.clientSecret);
      setSubmitting(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <section className="py-10 lg:py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mb-10">
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-3"
            style={{ color: "#C9A24B" }}
          >
            Almost there
          </p>
          <h1
            className="text-5xl lg:text-6xl leading-[0.95] tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
          >
            Checkout.
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
          <div className="space-y-10">
            {/* Fulfillment */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ color: "#F3E9D6" }}>How should we get this to you?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    { id: "pickup" as const, title: "Pickup", eta: "Ready in ~20 min", sub: "948 Clay St, Oakland" },
                    { id: "delivery" as const, title: "Delivery", eta: "~40 min · 5-mile radius", sub: deliveryOptionSub },
                  ]
                ).map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setFulfillment(opt.id)}
                    className="text-left rounded-2xl p-5 transition"
                    style={
                      fulfillment === opt.id
                        ? { backgroundColor: "#C9A24B", color: "#14100D", border: "2px solid #C9A24B" }
                        : { backgroundColor: "#1C1712", border: "2px solid rgba(201,162,75,0.15)", color: "#F3E9D6" }
                    }
                  >
                    <p className="font-bold text-lg">{opt.title}</p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: fulfillment === opt.id ? "rgba(20,16,13,0.75)" : "#8A8276" }}
                    >
                      {opt.eta}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: fulfillment === opt.id ? "rgba(20,16,13,0.6)" : "#8A8276" }}
                    >
                      {opt.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ color: "#F3E9D6" }}>Who&apos;s this for?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name *" value={name} onChange={setName} placeholder="Your name" />
                <Field label="Phone *" value={phone} onChange={setPhone} placeholder="(510) 555-0199" type="tel" />
                <Field label="Email (for receipt)" value={email} onChange={setEmail} placeholder="you@email.com" type="email" full />
                {fulfillment === "delivery" && (
                  <Field label="Delivery address *" value={address} onChange={setAddress} placeholder="Street, Apt, City" full />
                )}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#8A8276" }}>
                    Notes for the kitchen (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, spice level, door code…"
                    className="w-full rounded-2xl p-4 text-sm resize-none focus:outline-none transition"
                    style={{
                      backgroundColor: "#1C1712",
                      border: "1px solid rgba(201,162,75,0.2)",
                      color: "#F3E9D6",
                    }}
                  />
                </div>
              </div>

              {/* Live quote feedback */}
              {fulfillment === "delivery" && quote.error && (
                <div className="mt-3 rounded-xl p-3 text-sm" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#F3E9D6", border: "1px solid rgba(220,38,38,0.3)" }}>
                  Delivery quote unavailable: {quote.error}. Fee will be determined at order time.
                </div>
              )}
            </div>

            {/* Tip */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ color: "#F3E9D6" }}>
                Add a tip{" "}
                <span className="font-normal text-sm" style={{ color: "#8A8276" }}>
                  (100% goes to the kitchen &amp; FOH team)
                </span>
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
                    className="rounded-full px-5 py-2.5 text-sm font-semibold transition"
                    style={
                      tipPct === p && !customTip
                        ? { backgroundColor: "#C9A24B", color: "#14100D" }
                        : { backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }
                    }
                  >
                    {Math.round(p * 100)}% · ${(subtotal * p).toFixed(2)}
                  </button>
                ))}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4"
                  style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
                >
                  <span className="text-sm" style={{ color: "#8A8276" }}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder="Custom"
                    className="w-20 py-2.5 text-sm focus:outline-none bg-transparent"
                    style={{ color: "#F3E9D6" }}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ color: "#F3E9D6" }}>Payment</h2>
              {clientSecret ? (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff" }}>
                  <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              ) : (
                <div className="rounded-2xl p-5" style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.2)" }}>
                  <p className="text-sm" style={{ color: "#8A8276" }}>
                    Review your order, then continue to secure card payment (Apple Pay &amp; Google Pay supported).
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#F3E9D6" }}>
                {error}
              </div>
            )}

            {deliveryNotice && (
              <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", color: "#F3E9D6" }}>
                Note: Your order was placed, but driver dispatch encountered an issue ({deliveryNotice}). The kitchen has your order and will coordinate delivery.
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div
              className="rounded-[1.75rem] p-6"
              style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
            >
              <h3
                className="text-2xl mb-4"
                style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
              >
                Order summary
              </h3>
              <ul className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                {lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold" style={{ color: "#F3E9D6" }}>{l.name}</p>
                      <p style={{ color: "#8A8276" }}>
                        {l.qty} × ${l.price.toFixed(2)}
                      </p>
                      {l.spiceLevel && (
                        <p className="text-[11px]" style={{ color: "#8A8276" }}>🌶 {l.spiceLevel}</p>
                      )}
                    </div>
                    <span className="font-bold whitespace-nowrap" style={{ color: "#F3E9D6" }}>
                      ${(l.qty * l.price).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl
                className="space-y-2 text-sm pt-4"
                style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
              >
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="Tax" value={`$${tax.toFixed(2)}`} />
                {fulfillment === "delivery" && (
                  <Row
                    label={quote.loading ? "Delivery (quoting…)" : "Delivery"}
                    value={quote.feeCents != null ? `$${(quote.feeCents / 100).toFixed(2)}` : quote.loading ? "…" : "$0.00"}
                  />
                )}
                <Row label="Tip" value={`$${tip.toFixed(2)}`} />
                <div
                  className="pt-2 mt-2 flex justify-between items-baseline"
                  style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
                >
                  <dt className="font-bold" style={{ color: "#F3E9D6" }}>Total</dt>
                  <dd
                    className="text-3xl font-bold"
                    style={{ color: "#C9A24B", fontFamily: "var(--font-display)" }}
                  >
                    ${total.toFixed(2)}
                  </dd>
                </div>
              </dl>
              {!clientSecret && (
                <button
                  type="submit"
                  disabled={submitting || (fulfillment === "delivery" && quote.loading)}
                  className="mt-5 w-full inline-flex justify-center items-center gap-2 rounded-full py-4 font-bold text-base transition disabled:opacity-60 disabled:cursor-wait"
                  style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
                >
                  {submitting ? "Starting checkout…" : `Continue to payment · $${total.toFixed(2)}`}
                </button>
              )}
              <p
                className="mt-3 text-center text-[11px] uppercase tracking-widest"
                style={{ color: "#8A8276" }}
              >
                Orders saved to database
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
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#8A8276" }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-full px-5 py-3 text-sm focus:outline-none transition"
        style={{
          backgroundColor: "#1C1712",
          border: "1px solid rgba(201,162,75,0.2)",
          color: "#F3E9D6",
        }}
      />
    </div>
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
