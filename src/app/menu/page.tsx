"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Leaf, Plus, Minus, Star } from "lucide-react";
import { menu, categories, type MenuItem } from "@/data/menu";
import { useCart } from "@/lib/preview-cart";
import { hasSpiceOptions, SPICE_LEVELS, DEFAULT_SPICE } from "@/lib/spice";

type Mode = "regular" | "catering";

export default function MenuPage() {
  const [mode, setMode] = useState<Mode>("regular");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  // Item availability ("86"/unavailable) is managed in the admin panel and
  // lives in the DB; the static menu has no availability, so overlay it here.
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  useEffect(() => {
    let on = true;
    fetch("/api/menu/availability", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { unavailable: [] }))
      .then((d) => { if (on) setUnavailable(new Set<string>(d.unavailable ?? [])); })
      .catch(() => { /* keep everything available on failure */ });
    return () => { on = false; };
  }, []);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.isCatering === (mode === "catering")),
    [mode]
  );

  const filteredMenu = useMemo(() => {
    const query = q.trim().toLowerCase();
    return menu.filter((m) => {
      if (m.isCatering !== (mode === "catering")) return false;
      if (vegOnly && !m.tags.includes("vegetarian")) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      );
    });
  }, [mode, q, vegOnly]);

  const grouped = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
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
            className="text-5xl lg:text-7xl leading-[0.95] tracking-tight mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              color: "#F3E9D6",
            }}
          >
            The full menu.
          </h1>
          <p className="max-w-2xl text-[17px] leading-relaxed" style={{ color: "#8A8276" }}>
            178 dishes across 12 categories. Every momo pleated by hand; every naan
            tandoor-baked to order. Need to feed a crowd? Switch to the catering menu for
            half and full tray pricing.
          </p>
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

        {/* Search + filters */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#8A8276" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes — momo, tikka, paneer…"
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
            className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition"
            style={
              vegOnly
                ? { backgroundColor: "#4A6B4A", color: "#F3E9D6", border: "1px solid #4A6B4A" }
                : { backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)", color: "#8A8276" }
            }
          >
            <Leaf className="h-4 w-4" />
            Vegetarian only
          </button>
          <span className="text-sm ml-auto" style={{ color: "#8A8276" }}>
            {totalCount} {totalCount === 1 ? "dish" : "dishes"}
          </span>
        </div>

        {/* Category pills */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6 lg:-mx-10 lg:px-10">
            <button
              onClick={() => setActiveCat(null)}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition"
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
                className="shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition"
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
      </section>

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
              <div key={g.slug} id={`cat-${g.slug}`} className="scroll-mt-28">
                <div className="flex items-baseline justify-between mb-6">
                  <h2
                    className="text-3xl lg:text-4xl leading-none tracking-tight"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
                  >
                    {g.label}
                  </h2>
                  <span className="text-sm" style={{ color: "#8A8276" }}>{g.items.length} dishes</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {g.items.map((item) => (
                    <MenuCard key={item.id} item={item} unavailable={unavailable.has(item.id)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </>
  );
}

function MenuCard({ item, unavailable }: { item: MenuItem; unavailable: boolean }) {
  const { add, lines, increment, decrement } = useCart();
  const inCart = lines.find((l) => l.id === item.id);
  const showSpice = hasSpiceOptions(item.category);
  const [spice, setSpice] = useState<string>(DEFAULT_SPICE);

  return (
    <article
      className="group rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
      style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.15)" }}
    >
      <div className="relative aspect-[5/3] overflow-hidden" style={{ backgroundColor: "#14100D" }}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          style={unavailable ? { filter: "grayscale(0.7) brightness(0.6)" } : undefined}
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
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            className="text-xl leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "#F3E9D6" }}
          >
            {item.name}
          </h3>
          <span
            className="rounded-full font-bold px-3 py-1 text-sm whitespace-nowrap shrink-0"
            style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
          >
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: "#8A8276" }}>
          {item.description || " "}
        </p>
        <div
          className="mt-4 pt-4"
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
                  className="h-9 w-9 flex items-center justify-center transition"
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
                  className="h-9 w-9 flex items-center justify-center transition"
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
