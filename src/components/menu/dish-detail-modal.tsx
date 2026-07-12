"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { X, Plus, Minus, Leaf, Wheat, Sprout } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, SPICE_LEVELS, DEFAULT_SPICE } from "@/lib/spice";

// Shared dish detail / zoom modal — used by the menu grid and the homepage
// "Popular right now" cards. `available` is optional (defaults to available).
export type DishModalItem = MenuItem & { available?: boolean };

const DIET_TAGS: { tag: string; label: string; Icon: typeof Leaf; bg: string }[] = [
  { tag: "vegetarian", label: "Vegetarian", Icon: Leaf, bg: "#4A6B4A" },
  { tag: "vegan", label: "Vegan option", Icon: Sprout, bg: "#3E5C3E" },
  { tag: "gluten-free", label: "Gluten-free", Icon: Wheat, bg: "#7A5A2E" },
];

export function DishDetailModal({ item, onClose }: { item: DishModalItem | null; onClose: () => void }) {
  const { add, lines, increment, decrement } = useCart();
  const [spice, setSpice] = useState<string>(DEFAULT_SPICE);
  const [src, setSrc] = useState("/images/annapurna-logo.png");

  useEffect(() => {
    if (!item) return;
    setSpice(DEFAULT_SPICE);
    setSrc(item.image || "/images/annapurna-logo.png");
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [item, onClose]);

  if (typeof document === "undefined") return null;

  const showSpice = item ? hasSpiceOptions(item.category) : false;
  const inCart = item ? lines.find((l) => l.id === item.id) : undefined;
  const unavailable = item ? item.available === false : false;
  const isLogo = src.endsWith("annapurna-logo.png");

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden
        >
          {/* backdrop */}
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,8,6,0.7)", backdropFilter: "blur(4px)" }} />

          {/* dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dish-modal-title"
            className="relative w-full sm:max-w-lg overflow-hidden rounded-t-[1.5rem] sm:rounded-[1.5rem] shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
            style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.25)" }}
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full transition"
              style={{ backgroundColor: "rgba(20,16,13,0.7)", color: "#F3E9D6", border: "1px solid rgba(201,162,75,0.25)" }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-[16/10]" style={{ backgroundColor: "#14100D" }}>
              <Image
                src={src}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className={isLogo ? "object-contain p-10 opacity-90" : "object-cover"}
                style={unavailable ? { filter: "grayscale(0.7) brightness(0.6)" } : undefined}
                onError={() => setSrc((s) => (s.endsWith("annapurna-logo.png") ? s : "/images/annapurna-logo.png"))}
              />
              {unavailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full text-xs font-bold uppercase tracking-widest px-4 py-1.5" style={{ backgroundColor: "#7A2E2E", color: "#F3E9D6" }}>
                    86 · Sold Out
                  </span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="dish-modal-title"
                  className="text-2xl leading-tight"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontWeight: 500, color: "#F3E9D6" }}
                >
                  {item.name}
                </h2>
                <span
                  className="rounded-full font-bold px-3.5 py-1.5 text-sm whitespace-nowrap shrink-0"
                  style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
                >
                  ${item.price.toFixed(2)}
                </span>
              </div>

              {(() => {
                const tags = DIET_TAGS.filter((t) => item.tags.includes(t.tag));
                return tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map(({ tag, label, Icon, bg }) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full text-[11px] font-bold uppercase tracking-wider px-2.5 py-1" style={{ backgroundColor: bg, color: "#F3E9D6" }}>
                        <Icon className="h-3 w-3" /> {label}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}

              <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "#C8BEA8" }}>
                {item.description || "A house favorite — ask our staff for details."}
              </p>

              <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}>
                {showSpice && !unavailable && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "#8A8276" }}>Spice level</p>
                    <div className="flex items-center gap-1.5">
                      {SPICE_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSpice(level)}
                          className="flex-1 rounded-full py-2 text-[12px] font-semibold transition"
                          style={spice === level
                            ? { backgroundColor: "#C9A24B", color: "#14100D" }
                            : { border: "1px solid rgba(201,162,75,0.3)", color: "#8A8276", backgroundColor: "transparent" }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {unavailable ? (
                  <button disabled className="w-full rounded-full py-3 font-semibold text-sm cursor-not-allowed" style={{ backgroundColor: "rgba(122,46,46,0.15)", color: "#A38A7A", border: "1px solid rgba(201,162,75,0.15)" }}>
                    Unavailable today
                  </button>
                ) : inCart ? (
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full" style={{ backgroundColor: "rgba(201,162,75,0.1)" }}>
                      <button onClick={() => decrement(item.id)} aria-label="Decrease" className="h-11 w-11 flex items-center justify-center" style={{ color: "#C9A24B" }}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-bold" style={{ color: "#F3E9D6" }}>{inCart.qty}</span>
                      <button onClick={() => increment(item.id)} aria-label="Increase" className="h-11 w-11 flex items-center justify-center" style={{ color: "#C9A24B" }}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold" style={{ color: "#C9A24B" }}>${(item.price * inCart.qty).toFixed(2)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => add(item, 1, showSpice ? spice : undefined)}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-full py-3 font-semibold text-sm transition"
                    style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
                  >
                    <Plus className="h-4 w-4" /> Add to bag
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
