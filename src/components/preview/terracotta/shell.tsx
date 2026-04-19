"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/lib/preview-cart";
import { useEffect, useState } from "react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/admin", label: "Kitchen" },
];

export function TerracottaShell({ children }: { children: React.ReactNode }) {
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FDF4E4]/85 backdrop-blur-md border-b border-[#2B1E16]/8">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          <a href="tel:+15102509696"
            className="hidden sm:inline text-[11px] uppercase tracking-[0.25em] font-medium text-[#2B1E16]/60 hover:text-[#C85A3C] transition"
          >
            (510) 250-9696
          </a>

          <Link href="/" className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
              <circle cx="14" cy="14" r="12" fill="#C85A3C" />
              <circle cx="14" cy="14" r="6" fill="#F2A545" />
            </svg>
            <span
              className="text-2xl font-medium tracking-tight"
              style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
            >
              Annapurna
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`transition ${
                    active ? "text-[#C85A3C]" : "text-[#2B1E16]/75 hover:text-[#C85A3C]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {!isHome && (
              <Link
                href="/menu"
                className="hidden sm:inline-flex rounded-full bg-[#2B1E16] text-[#FDF4E4] px-4 py-2 text-xs font-semibold hover:bg-[#C85A3C] transition"
              >
                Order
              </Link>
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative rounded-full bg-[#C85A3C] text-[#FDF4E4] h-10 w-10 flex items-center justify-center hover:bg-[#2B1E16] transition"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#2B1E16] text-[#F2A545] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#FDF4E4]">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {children}

      <CartDrawer />
      <AddedToast />
    </>
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
        className={`absolute inset-0 bg-[#2B1E16]/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 h-full w-full sm:w-[460px] bg-[#FDF4E4] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#2B1E16]/10">
          <h2
            className="text-2xl"
            style={{ fontFamily: "var(--font-instrument), serif", color: "#2B1E16" }}
          >
            Your bag
            {count > 0 && (
              <span className="ml-2 text-base text-[#C85A3C]">({count})</span>
            )}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full h-9 w-9 flex items-center justify-center bg-[#2B1E16]/5 hover:bg-[#2B1E16] hover:text-[#FDF4E4] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="h-20 w-20 rounded-full bg-[#F2A545]/20 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-[#C85A3C]" />
            </div>
            <p
              className="text-2xl"
              style={{ fontFamily: "var(--font-instrument), serif", color: "#2B1E16" }}
            >
              Your bag is empty.
            </p>
            <p className="text-sm text-[#2B1E16]/60 max-w-xs">
              Warm dumplings and butter chicken are one click away.
            </p>
            <Link
              href="/menu"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-[#C85A3C] text-[#FDF4E4] px-7 py-3 font-semibold hover:bg-[#2B1E16] transition"
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
                  className="flex gap-4 pb-4 border-b border-[#2B1E16]/10 last:border-b-0"
                >
                  {l.image && (
                    <img
                      src={l.image}
                      alt=""
                      className="h-20 w-20 rounded-2xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-semibold text-[#2B1E16] truncate">{l.name}</h3>
                      <button
                        onClick={() => remove(l.id)}
                        className="text-xs text-[#2B1E16]/50 hover:text-[#C85A3C] transition shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm text-[#2B1E16]/60">${l.price.toFixed(2)} each</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center bg-[#2B1E16]/5 rounded-full">
                        <button
                          onClick={() => decrement(l.id)}
                          className="h-8 w-8 flex items-center justify-center hover:text-[#C85A3C]"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{l.qty}</span>
                        <button
                          onClick={() => increment(l.id)}
                          className="h-8 w-8 flex items-center justify-center hover:text-[#C85A3C]"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-bold text-[#2B1E16]">
                        ${(l.price * l.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#2B1E16]/10 px-6 py-5 space-y-3 bg-[#FDF4E4]">
              <div className="flex justify-between text-sm text-[#2B1E16]/70">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#2B1E16]/70">
                <span>Est. tax (9.25%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#2B1E16]/10">
                <span className="font-bold text-[#2B1E16]">Total</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
                >
                  ${(subtotal + tax).toFixed(2)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-2 w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#C85A3C] text-[#FDF4E4] py-4 font-bold hover:bg-[#2B1E16] transition"
              >
                Checkout · ${(subtotal + tax).toFixed(2)}
                <span>→</span>
              </Link>
              <p className="text-center text-[10px] uppercase tracking-widest text-[#2B1E16]/50">
                Demo mode · no real charge
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
      <div className="flex items-center gap-3 bg-[#2B1E16] text-[#FDF4E4] rounded-full pl-4 pr-2 py-2 shadow-xl">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#F2A545] text-[#2B1E16]">
          ✓
        </span>
        <span className="text-sm font-medium">Added to your bag</span>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-[#C85A3C] text-[#FDF4E4] px-4 py-1.5 text-xs font-bold hover:bg-[#F2A545] hover:text-[#2B1E16] transition"
        >
          View bag
        </button>
      </div>
    </div>
  );
}
