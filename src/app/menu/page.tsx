"use client";

import { useMemo, useState } from "react";
import { Search, Leaf, Plus, Minus } from "lucide-react";
import { menu, categories, type MenuItem } from "@/data/menu";
import { useCart } from "@/lib/preview-cart";

type Mode = "regular" | "catering";

export default function MenuPage() {
  const [mode, setMode] = useState<Mode>("regular");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);

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
      <section className="relative overflow-hidden border-b border-[#2B1E16]/8">
        <div
          aria-hidden
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-35 pointer-events-none"
          style={{ background: "radial-gradient(circle, #F2A545, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-10 lg:pt-14 pb-6">
          <p
            className="text-2xl lg:text-3xl mb-1"
            style={{ color: "#C85A3C", fontFamily: "var(--font-caveat), cursive" }}
          >
            what&apos;s cooking today
          </p>
          <h1
            className="text-5xl lg:text-7xl leading-[0.95] tracking-tight mb-6"
            style={{ fontFamily: "var(--font-instrument), serif" }}
          >
            The <em style={{ color: "#C85A3C" }}>full menu.</em>
          </h1>
          <p className="max-w-2xl text-[17px] text-[#2B1E16]/75 leading-relaxed">
            178 dishes across 12 categories. Every momo pleated by hand; every naan
            tandoor-baked to order. Need to feed a crowd? Switch to the catering menu for
            half and full tray pricing.
          </p>
        </div>

        {/* Mode switch */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-6">
          <div className="inline-flex p-1 rounded-full bg-[#2B1E16]/8 text-sm font-semibold">
            {(["regular", "catering"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setActiveCat(null);
                }}
                className={`px-5 py-2 rounded-full transition ${
                  mode === m
                    ? "bg-[#2B1E16] text-[#FDF4E4] shadow"
                    : "text-[#2B1E16]/60 hover:text-[#2B1E16]"
                }`}
              >
                {m === "regular" ? "Order for one" : "Catering (half/full tray)"}
              </button>
            ))}
          </div>
        </div>

        {/* Search + filters */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2B1E16]/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search 178 dishes — e.g. momo, tikka, paneer"
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#2B1E16]/10 text-sm placeholder:text-[#2B1E16]/40 focus:outline-none focus:border-[#C85A3C] focus:ring-2 focus:ring-[#C85A3C]/20 transition"
            />
          </div>
          <button
            onClick={() => setVegOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold border transition ${
              vegOnly
                ? "bg-[#4A6B4A] text-[#FDF4E4] border-[#4A6B4A]"
                : "bg-white border-[#2B1E16]/10 hover:border-[#4A6B4A]"
            }`}
          >
            <Leaf className="h-4 w-4" />
            Vegetarian only
          </button>
          <span className="text-sm text-[#2B1E16]/60 ml-auto">
            {totalCount} {totalCount === 1 ? "dish" : "dishes"}
          </span>
        </div>

        {/* Category pills */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6 lg:-mx-10 lg:px-10">
            <button
              onClick={() => setActiveCat(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                !activeCat
                  ? "bg-[#C85A3C] text-[#FDF4E4]"
                  : "bg-white border border-[#2B1E16]/10 hover:border-[#C85A3C]"
              }`}
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
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  activeCat === g.slug
                    ? "bg-[#C85A3C] text-[#FDF4E4]"
                    : "bg-white border border-[#2B1E16]/10 hover:border-[#C85A3C]"
                }`}
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
              <p className="text-3xl" style={{ fontFamily: "var(--font-instrument), serif" }}>
                No dishes match your filters.
              </p>
              <button
                onClick={() => {
                  setQ("");
                  setVegOnly(false);
                }}
                className="mt-5 text-sm font-bold underline hover:text-[#C85A3C]"
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
                    style={{ fontFamily: "var(--font-instrument), serif" }}
                  >
                    {g.label}
                  </h2>
                  <span className="text-sm text-[#2B1E16]/50">{g.items.length} dishes</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {g.items.map((item) => (
                    <MenuCard key={item.id} item={item} />
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

function MenuCard({ item }: { item: MenuItem }) {
  const { add, lines, increment, decrement } = useCart();
  const inCart = lines.find((l) => l.id === item.id);

  return (
    <article className="group rounded-[1.5rem] bg-white border border-[#2B1E16]/6 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      <div className="relative aspect-[5/3] overflow-hidden bg-[#F2A545]/10">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {item.tags.includes("vegetarian") && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#4A6B4A] text-[#FDF4E4] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
            <Leaf className="h-3 w-3" /> Veg
          </span>
        )}
        {item.tags.includes("popular") && (
          <span className="absolute top-3 right-3 rounded-full bg-[#FDF4E4] text-[#C85A3C] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
            ★ Popular
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            className="text-xl leading-tight"
            style={{ fontFamily: "var(--font-instrument), serif" }}
          >
            {item.name}
          </h3>
          <span className="rounded-full bg-[#F2A545]/25 text-[#C85A3C] font-bold px-3 py-1 text-sm whitespace-nowrap shrink-0">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-[#2B1E16]/65 leading-relaxed line-clamp-3 flex-1">
          {item.description || " "}
        </p>
        <div className="mt-4 pt-4 border-t border-[#2B1E16]/8">
          {inCart ? (
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center bg-[#2B1E16]/5 rounded-full">
                <button
                  onClick={() => decrement(item.id)}
                  aria-label="Decrease"
                  className="h-9 w-9 flex items-center justify-center hover:text-[#C85A3C]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{inCart.qty}</span>
                <button
                  onClick={() => increment(item.id)}
                  aria-label="Increase"
                  className="h-9 w-9 flex items-center justify-center hover:text-[#C85A3C]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-bold text-[#C85A3C]">
                ${(item.price * inCart.qty).toFixed(2)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => add(item)}
              className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#2B1E16] text-[#FDF4E4] py-2.5 font-semibold text-sm hover:bg-[#C85A3C] transition"
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
