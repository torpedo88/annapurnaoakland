"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { luxe } from "@/lib/theme";
import { useCart } from "@/lib/preview-cart";
import type { MenuItem } from "@/data/menu";

const LOGO = "/images/annapurna-logo.png";

export interface DishOfDay {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  discountPercent: number;
  discountedPrice: number | null;
}

// Half the banner up to 1024px wide inside the max-w-5xl rail, full width below
// the `md` breakpoint where the banner stacks.
const BANNER_SIZES = "(min-width: 768px) 512px, 100vw";

/** The dish-of-the-day banner. Content is server-rendered; only the cart is client-side. */
export function SpecialsBanner({ dish }: { dish: DishOfDay }) {
  const { add } = useCart();
  // `src` only ever changes via the onError fallback; the dish itself comes
  // from the server and is fixed for the lifetime of the page render.
  const [src, setSrc] = useState(dish.image || LOGO);

  // Add the dish of the day to the cart. Cart holds the full price; the
  // dish-of-day discount is applied server-side at checkout.
  function addDish() {
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

  return (
    <div
      className="w-full max-w-5xl rounded-[1.75rem] overflow-hidden md:flex"
      style={{ backgroundColor: luxe.surface, border: "1px solid rgba(201,162,75,0.18)" }}
    >
      <div className="md:w-1/2 relative min-h-[240px]">
        <Image
          src={src}
          alt={dish.name}
          fill
          sizes={BANNER_SIZES}
          className={src === LOGO ? "object-contain p-8 opacity-90" : "object-cover"}
          onError={() => setSrc(LOGO)}
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
  );
}
