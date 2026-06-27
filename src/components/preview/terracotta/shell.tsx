"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, X, Plus, Minus, Check, Menu } from "lucide-react";
import { useCart } from "@/lib/preview-cart";
import { useEffect, useState } from "react";
import { PromoMarquee } from "./promo-marquee";

const nav = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reservations", label: "Reservations" },
  { href: "/catering", label: "Catering" },
  { href: "/admin", label: "Kitchen" },
];

export function TerracottaShell({ children }: { children: React.ReactNode }) {
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: "linear-gradient(180deg, #1f120c 0%, #2c1610 55%, #3a1b14 100%)",
          borderBottom: "1px solid rgba(201,162,75,0.22)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.40)",
        }}
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8 h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left: hamburger (mobile only) + brand */}
          <div className="flex items-center gap-2 sm:gap-3 justify-self-start">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="md:hidden rounded-full h-10 w-10 flex items-center justify-center transition shrink-0"
              style={{ border: "1px solid rgba(201,162,75,0.4)", color: "#C9A24B" }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/annapurna-logo.png"
                alt="Annapurna Restaurant & Bar"
                className="h-14 w-auto object-contain shrink-0"
                style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))" }}
              />
              <span
                className="hidden sm:inline uppercase tracking-[0.16em] text-2xl"
                style={{ color: "#C9A24B", fontFamily: "var(--font-display)", fontWeight: 300 }}
              >
                Annapurna
              </span>
            </Link>
          </div>

          {/* Center: nav (bigger, centered) */}
          <nav className="hidden md:flex items-center gap-10 text-sm uppercase tracking-[0.2em] justify-self-center">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="relative transition py-1"
                  style={{ color: active ? "#C9A24B" : "#C9C2B5", fontWeight: active ? 600 : 400 }}
                >
                  {n.label}
                  {active && (
                    <span
                      className="absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 w-5 rounded-full"
                      style={{ backgroundColor: "#C9A24B" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Order Now + cart (far right) */}
          <div className="flex items-center gap-3 justify-self-end">
            <Link
              href="/menu"
              className="inline-flex rounded-[2px] px-3.5 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.16em] font-semibold transition whitespace-nowrap"
              style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
            >
              Order Now
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative rounded-full h-10 w-10 flex items-center justify-center transition"
              style={{ border: "1px solid rgba(201,162,75,0.4)", color: "#C9A24B" }}
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <PromoMarquee />

      {children}

      <CartDrawer />
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} pathname={pathname} />
      <AddedToast />
    </>
  );
}

// Mobile-only slide-out navigation. Mirrors the CartDrawer pattern but slides
// in from the left and is hidden entirely on md+ (where the inline nav shows).
function MobileNavDrawer({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className="md:hidden fixed inset-0 z-50"
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(10,7,5,0.62)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", opacity: open ? 1 : 0 }}
      />
      {/* Panel — slides from the left */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute left-0 top-0 h-full w-[80%] max-w-[320px] flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
          background: "linear-gradient(180deg, #1f120c 0%, #2c1610 55%, #3a1b14 100%)",
          borderRight: "1px solid rgba(201,162,75,0.22)",
          boxShadow: "8px 0 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between px-5 h-20" style={{ borderBottom: "1px solid rgba(201,162,75,0.18)" }}>
          <span className="uppercase tracking-[0.16em] text-xl" style={{ color: "#C9A24B", fontFamily: "var(--font-display)", fontWeight: 300 }}>
            Annapurna
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full h-10 w-10 flex items-center justify-center"
            style={{ border: "1px solid rgba(201,162,75,0.4)", color: "#C9A24B" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col px-3 py-4 gap-1">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={onClose}
                className="rounded-lg px-4 py-3.5 text-sm uppercase tracking-[0.18em] transition"
                style={{
                  color: active ? "#14100D" : "#C9C2B5",
                  backgroundColor: active ? "#C9A24B" : "transparent",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-5">
          <Link
            href="/menu"
            onClick={onClose}
            className="block text-center rounded-[2px] px-5 py-3 text-[11px] uppercase tracking-[0.16em] font-semibold"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
          >
            Order Now
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CartDrawer() {
  const {
    lines,
    isOpen,
    setOpen,
    increment,
    decrement,
    remove,
    subtotal,
    tax,
    count,
  } = useCart();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 transition-all ${isOpen ? "visible" : "invisible pointer-events-none"}`}
    >
      {/* Backdrop */}
      <button
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 h-full w-full sm:w-[460px] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#1C1712", color: "#F3E9D6" }}
      >
        <div
          className="flex items-center justify-between px-6 h-16"
          style={{ borderBottom: "1px solid rgba(201,162,75,0.15)" }}
        >
          <h2
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)", color: "#F3E9D6" }}
          >
            Your bag
            {count > 0 && (
              <span className="ml-2 text-base" style={{ color: "#C9A24B" }}>({count})</span>
            )}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full h-9 w-9 flex items-center justify-center transition"
            style={{ backgroundColor: "rgba(201,162,75,0.1)", color: "#F3E9D6" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(201,162,75,0.15)" }}
            >
              <ShoppingBag className="h-8 w-8" style={{ color: "#C9A24B" }} />
            </div>
            <p
              className="text-2xl"
              style={{ fontFamily: "var(--font-display)", color: "#F3E9D6" }}
            >
              Your bag is empty.
            </p>
            <p className="text-sm max-w-xs" style={{ color: "#8A8276" }}>
              Warm dumplings and butter chicken are one click away.
            </p>
            <Link
              href="/menu"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full px-7 py-3 font-semibold transition"
              style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className="flex gap-4 pb-4 last:border-b-0"
                  style={{ borderBottom: "1px solid rgba(201,162,75,0.15)" }}
                >
                  <img
                    src={l.image || "/images/annapurna-logo.png"}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover shrink-0"
                    style={{ backgroundColor: "#14100D" }}
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith("/images/annapurna-logo.png")) {
                        e.currentTarget.src = "/images/annapurna-logo.png";
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-semibold truncate" style={{ color: "#F3E9D6" }}>{l.name}</h3>
                      <button
                        onClick={() => remove(l.id)}
                        className="text-xs transition shrink-0"
                        style={{ color: "#8A8276" }}
                      >
                        Remove
                      </button>
                    </div>
                    {l.discountPercent ? (
                      <p className="text-sm" style={{ color: "#8A8276" }}>
                        <span className="line-through">${l.price.toFixed(2)}</span>{" "}
                        <span style={{ color: "#C9A24B", fontWeight: 600 }}>
                          ${(l.price * (1 - l.discountPercent / 100)).toFixed(2)}
                        </span>{" "}
                        each · {l.discountPercent}% off
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: "#8A8276" }}>${l.price.toFixed(2)} each</p>
                    )}
                    {l.spiceLevel && (
                      <p className="text-xs" style={{ color: "#8A8276" }}>🌶 {l.spiceLevel}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="inline-flex items-center rounded-full"
                        style={{ backgroundColor: "rgba(201,162,75,0.1)" }}
                      >
                        <button
                          onClick={() => decrement(l.id)}
                          className="h-9 w-9 flex items-center justify-center hover:text-[#C9A24B] transition"
                          style={{ color: "#F3E9D6" }}
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold" style={{ color: "#F3E9D6" }}>{l.qty}</span>
                        <button
                          onClick={() => increment(l.id)}
                          className="h-9 w-9 flex items-center justify-center hover:text-[#C9A24B] transition"
                          style={{ color: "#F3E9D6" }}
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-bold" style={{ color: "#F3E9D6" }}>
                        ${(l.price * l.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="px-6 py-5 space-y-3"
              style={{ borderTop: "1px solid rgba(201,162,75,0.15)", backgroundColor: "#1C1712" }}
            >
              <div className="flex justify-between text-sm" style={{ color: "#8A8276" }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#8A8276" }}>
                <span>Est. tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div
                className="flex justify-between items-baseline pt-2"
                style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
              >
                <span className="font-bold" style={{ color: "#F3E9D6" }}>Total</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#C9A24B", fontFamily: "var(--font-display)" }}
                >
                  ${(subtotal + tax).toFixed(2)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-2 w-full inline-flex justify-center items-center gap-2 rounded-full py-4 font-bold transition"
                style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
              >
                Checkout · ${(subtotal + tax).toFixed(2)}
                <span>→</span>
              </Link>
              <p
                className="text-center text-[10px] uppercase tracking-widest"
                style={{ color: "#8A8276" }}
              >
                Secure checkout · powered by Stripe
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function AddedToast() {
  const { justAdded, setOpen } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [justAdded]);

  if (!justAdded) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div
        className="flex items-center gap-3 rounded-full pl-4 pr-2 py-2 shadow-xl"
        style={{ backgroundColor: "#1C1712", color: "#F3E9D6", border: "1px solid rgba(201,162,75,0.3)" }}
      >
        <span
          className="inline-flex items-center justify-center h-6 w-6 rounded-full"
          style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium">Added to your bag</span>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full px-4 py-1.5 text-xs font-bold transition"
          style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
        >
          View bag
        </button>
      </div>
    </div>
  );
}
