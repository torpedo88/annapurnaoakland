"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, Leaf, Plus, Minus, Star } from "lucide-react";
import type { MenuItem, MenuCategory } from "@/data/menu";
import { DishDetailModal } from "@/components/menu/dish-detail-modal";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, SPICE_LEVELS, DEFAULT_SPICE } from "@/lib/spice";
import { OrderingStatusBanner } from "@/components/ordering-status-banner";

type Mode = "regular" | "catering";
type LiveItem = MenuItem & { available: boolean };

export function MenuClient({
  initialCategories,
  initialItems,
}: {
  initialCategories: MenuCategory[];
  initialItems: LiveItem[];
}) {
  const [mode, setMode] = useState<Mode>("regular");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  // Live menu from the DB (admin-managed): items, categories, prices, images,
  // and availability ("86"). Seeded server-side (so the menu is in the initial
  // HTML for SEO / crawlers — avoids a soft-404 on this JS-rendered page), then
  // refreshed from /api/menu on mount to pick up any just-changed availability.
  const [items, setItems] = useState<LiveItem[]>(initialItems);
  const [cats, setCats] = useState<MenuCategory[]>(initialCategories);
  useEffect(() => {
    let on = true;
    fetch("/api/menu", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { categories: MenuCategory[]; items: LiveItem[] } | null) => {
        if (!on || !d) return;
        setCats(d.categories ?? []);
        setItems(d.items ?? []);
      })
      .catch(() => { /* keep server-seeded menu on refresh failure */ });
    return () => { on = false; };
  }, []);

  // Deep-link support: /menu#item-<id> scrolls to (and highlights) that dish.
  // Used by the homepage gallery hero's "Order online" link. Runs once, after
  // items render (initial SSR or the /api/menu refresh below).
  const didScrollRef = useRef(false);
  useEffect(() => {
    if (didScrollRef.current) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#item-")) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      didScrollRef.current = true;
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    }
  }, [items]);

  // Dish-detail popup: the item whose full description/options are shown.
  const [detail, setDetail] = useState<LiveItem | null>(null);

  const visibleCategories = useMemo(
    () => cats.filter((c) => c.isCatering === (mode === "catering")),
    [mode, cats]
  );

  const filteredMenu = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((m) => {
      if (m.isCatering !== (mode === "catering")) return false;
      if (vegOnly && !m.tags.includes("vegetarian")) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      );
    });
  }, [mode, q, vegOnly, items]);

  const grouped = useMemo(() => {
    const groups = new Map<string, LiveItem[]>();
    visibleCategories.forEach((c) => groups.set(c.slug, []));
    filteredMenu.forEach((m) => {
      const arr = groups.get(m.category);
      if (arr) arr.push(m);
    });
    return visibleCategories
      .map((c) => ({ ...c, items: groups.get(c.slug) ?? [] }))
      .filter((g) => g.items.length);
  }, [filteredMenu, visibleCategories]);

  const totalCount = filteredMenu.length;

  return (
    <>
      {/* ─── Menu header ────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(201,162,75,0.15)" }}
      >
        <div
          aria-hidden
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,162,75,0.06), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-10 lg:pt-14 pb-6">
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-3"
            style={{ color: "#C9A24B" }}
          >
            The Menu
          </p>
          <h1
            className="brand-heading leading-[0.95] mb-6"
            style={{ fontSize: "clamp(2.8rem, 8vw, 5rem)" }}
          >
            Order online.
          </h1>
          <p className="max-w-2xl text-[17px] leading-relaxed" style={{ color: "#8A8276" }}>
            Hand-pleated momos, tandoor-fired naan, and slow-cooked classics — made to order
            every day. Feeding a crowd? Switch to the catering menu for half &amp; full tray
            pricing.
          </p>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <OrderingStatusBanner />
        </div>

        {/* Mode switch */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-6">
          <div
            className="inline-flex p-1 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "rgba(201,162,75,0.1)" }}
          >
            {(["regular", "catering"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setActiveCat(null);
                }}
                className="px-5 py-2 rounded-full transition"
                style={
                  mode === m
                    ? { backgroundColor: "#C9A24B", color: "#14100D" }
                    : { color: "#8A8276" }
                }
              >
                {m === "regular" ? "Order for one" : "Catering (half/full tray)"}
              </button>
            ))}
          </div>
        </div>

        {/* Search + filters — one row on every width (no wrap) so the filter
            header stays compact on mobile. The search flexes; the veg toggle and
            count are shrink-0 and the veg label shortens to "Veg" on phones. */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-5 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#8A8276" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes…"
              className="w-full pl-11 pr-4 py-3 rounded-full text-sm transition focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "#1C1712",
                border: "1px solid rgba(201,162,75,0.2)",
                color: "#F3E9D6",
                caretColor: "#C9A24B",
              }}
            />
          </div>
          <button
            onClick={() => setVegOnly((v) => !v)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 sm:px-4 py-3 text-sm font-semibold transition"
            style={
              vegOnly
                ? { backgroundColor: "#4A6B4A", color: "#F3E9D6", border: "1px solid #4A6B4A" }
                : { backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }
            }
          >
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">Vegetarian only</span>
            <span className="sm:hidden">Veg</span>
          </button>
          <span className="hidden sm:inline text-sm shrink-0 whitespace-nowrap" style={{ color: "#8A8276" }}>
            {totalCount} {totalCount === 1 ? "dish" : "dishes"}
          </span>
        </div>

      </section>

      {/* ─── Sticky category filter — pinned under the site header so customers
              can switch food types while scrolling the long menu ─── */}
      <div
        className="sticky top-20 z-20"
        style={{
          backgroundColor: "rgba(20,16,13,0.92)",
          borderBottom: "1px solid rgba(201,162,75,0.15)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-3">
          {/* Mobile: one horizontal-scroll row (swipe) so the filter is ~one
              row tall instead of wrapping to 3–5 rows and eating the screen.
              md+: wrap to multiple rows as before. Buttons are shrink-0 so they
              keep size and overflow into the scroll. */}
          <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveCat(null)}
              className="shrink-0 rounded-full px-4 py-2.5 min-h-[38px] text-xs font-bold uppercase tracking-wider transition"
              style={
                !activeCat
                  ? { backgroundColor: "#C9A24B", color: "#14100D" }
                  : { backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }
              }
            >
              All
            </button>
            {grouped.map((g) => (
              <button
                key={g.slug}
                onClick={() => {
                  setActiveCat(g.slug);
                  const el = document.getElementById(`cat-${g.slug}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="shrink-0 rounded-full px-4 py-2.5 min-h-[38px] text-xs font-bold uppercase tracking-wider transition"
                style={
                  activeCat === g.slug
                    ? { backgroundColor: "#C9A24B", color: "#14100D" }
                    : { backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }
                }
              >
                {g.label} ({g.items.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Menu grid ────────────────────────────────── */}
      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-14 lg:space-y-20">
          {grouped.length === 0 ? (
            <div className="py-24 text-center">
              <p
                className="text-3xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
              >
                No dishes match your filters.
              </p>
              <button
                onClick={() => {
                  setQ("");
                  setVegOnly(false);
                }}
                className="mt-5 text-sm font-bold underline transition"
                style={{ color: "#8A8276" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A24B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8276")}
              >
                Clear filters
              </button>
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.slug} id={`cat-${g.slug}`} className="scroll-mt-36">
                <div className="flex items-baseline justify-between mb-6">
                  <h2
                    className="text-3xl lg:text-4xl leading-none"
                    style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontWeight: 500, color: "#F3E9D6" }}
                  >
                    {g.label}
                  </h2>
                  <span className="text-sm" style={{ color: "#8A8276" }}>{g.items.length} dishes</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                  {g.items.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      unavailable={!item.available}
                      imageSrc={item.image}
                      onDetails={() => setDetail(item)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <DishDetailModal item={detail} onClose={() => setDetail(null)} />

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}article[id^="item-"]:target{outline:2px solid #C9A24B;outline-offset:4px}`}</style>
    </>
  );
}

function MenuCard({ item, unavailable, imageSrc, onDetails }: { item: MenuItem; unavailable: boolean; imageSrc: string; onDetails: () => void }) {
  const { add, lines, increment, decrement } = useCart();
  const inCart = lines.find((l) => l.id === item.id);
  const showSpice = hasSpiceOptions(item.category);
  const [spice, setSpice] = useState<string>(DEFAULT_SPICE);
  const [src, setSrc] = useState(imageSrc || "/images/annapurna-logo.png");
  // Re-sync when the DB image override resolves after mount (fetch is async).
  useEffect(() => { setSrc(imageSrc || "/images/annapurna-logo.png"); }, [imageSrc]);

  return (
    <article
      id={`item-${item.id}`}
      className="group scroll-mt-28 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
      style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
    >
      <button
        type="button"
        onClick={onDetails}
        aria-label={`View details for ${item.name}`}
        className="relative aspect-[5/3] overflow-hidden block w-full text-left cursor-pointer"
        style={{ backgroundColor: "#14100D" }}
      >
        <Image
          src={src}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`${src.endsWith("annapurna-logo.png") ? "object-contain p-8 opacity-90" : "object-cover"} transition-transform duration-700 group-hover:scale-105`}
          loading="lazy"
          style={unavailable ? { filter: "grayscale(0.7) brightness(0.6)" } : undefined}
          onError={() => setSrc((s) => s.endsWith("annapurna-logo.png") ? s : "/images/annapurna-logo.png")}
        />
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="rounded-full text-xs font-bold uppercase tracking-widest px-4 py-1.5"
              style={{ backgroundColor: "#7A2E2E", color: "#F3E9D6", border: "1px solid rgba(243,233,214,0.25)" }}
            >
              86 · Sold Out
            </span>
          </div>
        )}
        {item.tags.includes("vegetarian") && (
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
            style={{ backgroundColor: "#4A6B4A", color: "#F3E9D6" }}
          >
            <Leaf className="h-3 w-3" /> Veg
          </span>
        )}
        {item.tags.includes("popular") && (
          <span
            className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
            style={{ backgroundColor: "#1C1712", color: "#C9A24B" }}
          >
            <Star className="h-3 w-3 fill-current" aria-hidden="true" /> Popular
          </span>
        )}
      </button>
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
          <h3
            className="text-base sm:text-xl leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "#F3E9D6" }}
          >
            <button
              type="button"
              onClick={onDetails}
              className="text-left transition-colors hover:text-[#C9A24B]"
              style={{ color: "inherit", font: "inherit" }}
            >
              {item.name}
            </button>
          </h3>
          <span
            className="rounded-full font-bold px-2.5 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap shrink-0"
            style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
          >
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3 flex-1" style={{ color: "#8A8276" }}>
          {item.description || " "}
        </p>
        {item.description && (
          <button
            type="button"
            onClick={onDetails}
            className="mt-2 self-start text-[12px] font-semibold uppercase tracking-wider transition-colors"
            style={{ color: "#C9A24B" }}
          >
            View details ›
          </button>
        )}
        <div
          className="mt-3 pt-3 sm:mt-4 sm:pt-4"
          style={{ borderTop: "1px solid rgba(201,162,75,0.15)" }}
        >
          {showSpice && !unavailable && (
            <div className="flex items-center gap-1.5 mb-3">
              {SPICE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpice(level)}
                  className="flex-1 rounded-full py-1 text-[11px] font-semibold transition"
                  style={
                    spice === level
                      ? { backgroundColor: "#C9A24B", color: "#14100D" }
                      : { border: "1px solid rgba(201,162,75,0.3)", color: "#8A8276", backgroundColor: "transparent" }
                  }
                >
                  {level}
                </button>
              ))}
            </div>
          )}
          {inCart && inCart.spiceLevel && (
            <p className="text-[11px] mb-2" style={{ color: "#8A8276" }}>
              🌶 {inCart.spiceLevel}
            </p>
          )}
          {unavailable ? (
            <button
              disabled
              className="w-full inline-flex justify-center items-center rounded-full py-2.5 font-semibold text-sm cursor-not-allowed"
              style={{ backgroundColor: "rgba(122,46,46,0.15)", color: "#A38A7A", border: "1px solid rgba(201,162,75,0.15)" }}
            >
              Unavailable today
            </button>
          ) : inCart ? (
            <div className="flex items-center justify-between">
              <div
                className="inline-flex items-center rounded-full"
                style={{ backgroundColor: "rgba(201,162,75,0.1)" }}
              >
                <button
                  onClick={() => decrement(item.id)}
                  aria-label="Decrease"
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition"
                  style={{ color: "#8A8276" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A24B")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8276")}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold" style={{ color: "#F3E9D6" }}>{inCart.qty}</span>
                <button
                  onClick={() => increment(item.id)}
                  aria-label="Increase"
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition"
                  style={{ color: "#8A8276" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A24B")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8276")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-bold" style={{ color: "#C9A24B" }}>
                ${(item.price * inCart.qty).toFixed(2)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => add(item, 1, showSpice ? spice : undefined)}
              className="w-full inline-flex justify-center items-center gap-2 rounded-full py-2.5 font-semibold text-sm transition"
              style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
            >
              <Plus className="h-4 w-4" />
              Add to bag
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
