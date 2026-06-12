"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, DEFAULT_SPICE } from "@/lib/spice";
import { luxe } from "@/lib/theme";
import type { MenuItem } from "@/data/menu";

const LOGO = "/images/annapurna-logo.png";

export function Popular() {
  const { add } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    fetch("/api/menu/popular", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items: MenuItem[] } | null) => { if (on) setItems(d?.items ?? []); })
      .catch(() => { /* keep empty */ })
      .finally(() => { if (on) setLoaded(true); });
    return () => { on = false; };
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="py-24 lg:py-28" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-6 h-px w-9" style={{ backgroundColor: luxe.gold }} />
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-5 text-center"
          style={{ color: luxe.gold }}
        >
          Crowd favorites
        </p>
        <h2
          className="text-center mb-12"
          style={{
            fontFamily: "var(--font-serif-display), Georgia, serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            color: luxe.ink,
          }}
        >
          Popular right now.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <PopularCard
              key={item.id}
              name={item.name}
              price={item.price}
              imageSrc={item.image || LOGO}
              onAdd={() =>
                add(item, 1, hasSpiceOptions(item.category) ? DEFAULT_SPICE : undefined)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularCard({
  name,
  price,
  imageSrc,
  onAdd,
}: {
  name: string;
  price: number;
  imageSrc: string;
  onAdd: () => void;
}) {
  const [src, setSrc] = useState(imageSrc || LOGO);
  useEffect(() => { setSrc(imageSrc || LOGO); }, [imageSrc]);

  return (
    <article
      className="rounded-[1.5rem] overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
      style={{ backgroundColor: luxe.surface, border: "1px solid rgba(201,162,75,0.18)" }}
    >
      <div className="overflow-hidden" style={{ backgroundColor: luxe.bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className={`w-full h-44 ${src.endsWith(LOGO) ? "object-contain p-6 opacity-90" : "object-cover"}`}
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(LOGO)) e.currentTarget.src = LOGO;
          }}
        />
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
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
        </div>

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
