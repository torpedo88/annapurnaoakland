"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, DEFAULT_SPICE } from "@/lib/spice";
import { luxe } from "@/lib/theme";
import type { MenuItem } from "@/data/menu";
import dynamic from "next/dynamic";
import type { DishModalItem } from "@/components/menu/dish-detail-modal";

// The modal only exists after a tap, and it pulls in motion/react. Loading it
// lazily keeps that off the homepage's initial hydration, which is the work
// that delays the hero's paint on a throttled phone.
const DishDetailModal = dynamic(
  () => import("@/components/menu/dish-detail-modal").then((m) => m.DishDetailModal),
  { ssr: false },
);

const LOGO = "/images/annapurna-logo.png";

// Two columns on phones, four from `lg` up inside a max-w-7xl (1280px) rail.
// Telling the optimizer that keeps it from shipping a 2.5 MB original for a
// 308px-wide card.
const CARD_SIZES = "(min-width: 1024px) 308px, 50vw";

/** The interactive half of the Popular section — items come from the server. */
export function PopularGrid({ items }: { items: MenuItem[] }) {
  const { add } = useCart();
  const [detail, setDetail] = useState<DishModalItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {items.map((item) => (
          <PopularCard
            key={item.id}
            name={item.name}
            price={item.price}
            imageSrc={item.image || LOGO}
            onZoom={() => setDetail(item)}
            onAdd={() =>
              add(item, 1, hasSpiceOptions(item.category) ? DEFAULT_SPICE : undefined)
            }
          />
        ))}
      </div>

      <DishDetailModal item={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function PopularCard({
  name,
  price,
  imageSrc,
  onZoom,
  onAdd,
}: {
  name: string;
  price: number;
  imageSrc: string;
  onZoom: () => void;
  onAdd: () => void;
}) {
  // `src` only ever changes via the onError fallback — the card is keyed by
  // item id, so a different dish mounts a fresh card with fresh state.
  const [src, setSrc] = useState(imageSrc || LOGO);
  const isLogo = src === LOGO;

  return (
    <article
      className="rounded-[1.5rem] overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
      style={{ backgroundColor: luxe.surface, border: "1px solid rgba(201,162,75,0.18)" }}
    >
      <button
        type="button"
        onClick={onZoom}
        aria-label={`View ${name}`}
        className="overflow-hidden block w-full cursor-pointer group relative h-44"
        style={{ backgroundColor: luxe.bg }}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={CARD_SIZES}
          className={`transition-transform duration-500 group-hover:scale-105 ${isLogo ? "object-contain p-6 opacity-90" : "object-cover"}`}
          onError={() => setSrc(LOGO)}
        />
      </button>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <button
          type="button"
          onClick={onZoom}
          className="flex items-start justify-between gap-2 text-left cursor-pointer"
        >
          <h3
            className="text-lg leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: luxe.ink }}
          >
            {name}
          </h3>
          <span
            className="rounded-full font-bold px-3 py-1 text-sm whitespace-nowrap shrink-0"
            style={{ backgroundColor: "rgba(201,162,75,0.15)", color: luxe.gold }}
          >
            ${price.toFixed(2)}
          </span>
        </button>

        <button
          onClick={onAdd}
          className="mt-auto w-full inline-flex justify-center items-center rounded-full py-2.5 font-semibold text-sm transition"
          style={{ backgroundColor: luxe.gold, color: luxe.bg }}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
