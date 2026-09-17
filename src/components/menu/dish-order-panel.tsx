"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, SPICE_LEVELS, DEFAULT_SPICE } from "@/lib/spice";
import { luxe } from "@/lib/theme";

/**
 * Add-to-cart controls for a dish page. The page itself is a server component;
 * this is the only interactive part, so the dish name, price and description
 * stay in the server HTML.
 */
export function DishOrderPanel({
  item,
  unavailable,
}: {
  item: MenuItem;
  unavailable: boolean;
}) {
  const { add, lines, increment, decrement } = useCart();
  const [spice, setSpice] = useState<string>(DEFAULT_SPICE);
  const showSpice = hasSpiceOptions(item.category);
  const inCart = lines.find((l) => l.id === item.id);

  if (unavailable) {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-sm"
        style={{ backgroundColor: "rgba(122,46,46,0.18)", border: "1px solid rgba(122,46,46,0.5)", color: "#F3E9D6" }}
      >
        <strong>Sold out today.</strong> This dish is 86&rsquo;d right now — it is
        usually back the next service. Everything else on the menu is still
        available to order.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showSpice && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: luxe.muted }}>
            Spice level
          </p>
          <div className="flex gap-2">
            {SPICE_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSpice(lvl)}
                aria-pressed={spice === lvl}
                className="rounded-full px-4 py-2 text-sm font-semibold transition"
                style={
                  spice === lvl
                    ? { backgroundColor: luxe.gold, color: "#14100D" }
                    : { border: "1px solid rgba(201,162,75,0.35)", color: luxe.gold }
                }
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {inCart ? (
        <div className="flex items-center gap-4">
          <div
            className="inline-flex items-center gap-4 rounded-full px-3 py-2"
            style={{ border: "1px solid rgba(201,162,75,0.35)" }}
          >
            <button type="button" onClick={() => decrement(inCart.id)} aria-label={`Remove one ${item.name}`} style={{ color: luxe.gold }}>
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-6 text-center font-bold" style={{ color: luxe.ink }}>
              {inCart.qty}
            </span>
            <button type="button" onClick={() => increment(inCart.id)} aria-label={`Add one ${item.name}`} style={{ color: luxe.gold }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm" style={{ color: luxe.muted }}>in your bag</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => add(item, 1, showSpice ? spice : undefined)}
          className="inline-flex justify-center items-center rounded-full px-8 py-3.5 font-bold transition"
          style={{ backgroundColor: luxe.gold, color: "#14100D" }}
        >
          Add to cart · ${item.price.toFixed(2)}
        </button>
      )}
    </div>
  );
}
