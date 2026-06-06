"use client";

import { useEffect, useState } from "react";
import { menu } from "@/data/menu";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, DEFAULT_SPICE } from "@/lib/spice";
import { luxe } from "@/lib/theme";

const LOGO = "/images/annapurna-logo.png";

const BASE_POPULAR = menu.filter((m) => !m.isCatering && m.tags.includes("popular"));

export function Popular() {
  const { add } = useCart();
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const [unavailableSlugs, setUnavailableSlugs] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    fetch("/api/menu/availability", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { unavailable: [], images: {} }))
      .then((d) => {
        if (!on) return;
        setUnavailableSlugs(new Set<string>(d.unavailable ?? []));
        setImageOverrides((d.images ?? {}) as Record<string, string>);
      })
      .catch(() => { /* keep all available on failure */ })
      .finally(() => { if (on) setLoaded(true); });
    return () => { on = false; };
  }, []);

  const items = BASE_POPULAR.filter((m) => !unavailableSlugs.has(m.id)).slice(0, 8);

  // Don't render until we've resolved availability, and skip if nothing to show
  if (!loaded || items.length === 0) return null;

  return (
    <section className="py-16" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="mx-auto max-w-7xl px-6">
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-5 text-center"
          style={{ color: luxe.gold }}
        >
          Crowd favorites
        </p>
        <h2
          className="text-center mb-12"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
            color: luxe.ink,
          }}
        >
          Popular right now.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => {
            const resolvedSrc = imageOverrides[item.id] || LOGO;
            return (
              <PopularCard
                key={item.id}
                name={item.name}
                price={item.price}
                imageSrc={resolvedSrc}
                onAdd={() =>
                  add(
                    item,
                    1,
                    hasSpiceOptions(item.category) ? DEFAULT_SPICE : undefined
                  )
                }
              />
            );
          })}
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

  // Sync if parent resolves a new URL after mount (e.g. imageOverrides loaded)
  useEffect(() => {
    setSrc(imageSrc || LOGO);
  }, [imageSrc]);

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
            if (!e.currentTarget.src.endsWith(LOGO)) {
              e.currentTarget.src = LOGO;
            }
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
