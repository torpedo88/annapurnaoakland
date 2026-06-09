"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { luxe } from "@/lib/theme";
import { useCart } from "@/lib/preview-cart";
import type { MenuItem } from "@/data/menu";

interface DishOfDay {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  discountPercent: number;
  discountedPrice: number | null;
}

export function Specials() {
  const { add } = useCart();
  const [dish, setDish] = useState<DishOfDay | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((settingsData: { dish_of_day: DishOfDay | null } | null) => {
        setDish(settingsData?.dish_of_day ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Add the dish of the day to the cart. Cart holds the full price; the
  // dish-of-day discount is applied server-side at checkout.
  function addDish() {
    if (!dish) return;
    const item: MenuItem = {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: "",
      categoryLabel: "",
      image: dish.image,
      isCatering: false,
      tags: [],
    };
    add(item, 1, undefined, dish.discountPercent > 0 ? dish.discountPercent : undefined);
  }

  if (!loaded) return null;
  if (!dish) return null;

  return (
    <section className="py-16" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="mx-auto max-w-7xl px-6">
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-10 text-center"
          style={{ color: luxe.gold }}
        >
          Today&apos;s specials
        </p>

        <div className="flex flex-col items-center gap-12">
          {/* ── Dish of the Day — horizontal banner ── */}
          {dish && (
            <div
              className="w-full max-w-5xl rounded-[1.75rem] overflow-hidden md:flex"
              style={{ backgroundColor: luxe.surface, border: "1px solid rgba(201,162,75,0.18)" }}
            >
              <div className="md:w-1/2 relative min-h-[240px]">
                <img
                  src={dish.image || "/images/annapurna-logo.png"}
                  alt={dish.name}
                  className="w-full h-full object-cover min-h-[240px]"
                  onError={(e) => {
                    if (!e.currentTarget.src.endsWith("/images/annapurna-logo.png")) {
                      e.currentTarget.src = "/images/annapurna-logo.png";
                    }
                  }}
                />
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <div className="mb-4">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: "rgba(201,162,75,0.15)", color: luxe.gold }}
                  >
                    Daily Special
                    {dish.discountedPrice !== null && ` · ${dish.discountPercent}% off`}
                  </span>
                </div>

                <h2
                  className="text-3xl lg:text-4xl mb-3"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: luxe.ink }}
                >
                  {dish.name}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: luxe.muted }}>
                  {dish.description}
                </p>

                <div className="flex items-baseline gap-3 mb-6">
                  {dish.discountedPrice !== null ? (
                    <>
                      <span className="text-lg line-through" style={{ color: luxe.muted }}>
                        ${dish.price.toFixed(2)}
                      </span>
                      <span
                        className="text-3xl font-bold"
                        style={{ color: luxe.gold, fontFamily: "var(--font-display)" }}
                      >
                        ${dish.discountedPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span
                      className="text-3xl font-bold"
                      style={{ color: luxe.ink, fontFamily: "var(--font-display)" }}
                    >
                      ${dish.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={addDish}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold transition"
                    style={{ backgroundColor: luxe.gold, color: "#14100D" }}
                  >
                    Add to cart
                  </button>
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold transition"
                    style={{ border: "1px solid rgba(201,162,75,0.3)", color: luxe.gold }}
                  >
                    View menu
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
