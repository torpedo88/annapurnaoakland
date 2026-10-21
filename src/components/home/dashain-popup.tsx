"use client";

import { useCallback, useEffect, useState } from "react";

// Dashain notice: online ordering is closed Wed 2026-10-21 (enforced server-side
// by CLOSED_DATES in lib/orders/hours.ts). The popup shows from SHOW_FROM through
// CLOSED_ON in restaurant time, once per visitor (dismissal remembered locally).
// Safe to delete this file and its import in app/page.tsx after the date.
const SHOW_FROM = "2026-10-19";
const CLOSED_ON = "2026-10-21";
const DISMISS_KEY = "dashain-2026-dismissed";
const TZ = "America/Los_Angeles";

function todayLocal(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function DashainPopup() {
  const [open, setOpen] = useState(false);
  const [isToday, setIsToday] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    const decide = () => {
      const today = todayLocal();
      if (today < SHOW_FROM || today > CLOSED_ON) return;
      try {
        if (localStorage.getItem(DISMISS_KEY) === "1") return;
      } catch {}
      setIsToday(today === CLOSED_ON);
      setOpen(true);
    };
    decide();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,8,6,0.72)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashain-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl text-center shadow-2xl motion-safe:animate-[dashainIn_.35s_ease-out]"
        style={{
          background: "linear-gradient(180deg, #2A1A12 0%, #1C1712 55%, #14100D 100%)",
          border: "1px solid rgba(201,162,75,0.45)",
          color: "#F3E9D6",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: "rgba(20,16,13,0.6)", color: "#F3E9D6", outlineColor: "#C9A24B" }}
        >
          ×
        </button>

        <DashainArt />

        <div className="px-6 pb-7 pt-2">
          <p lang="ne" className="text-sm" style={{ color: "#E0A458" }}>
            विजया दशमीको शुभकामना
          </p>
          <h2 id="dashain-title" className="brand-heading mt-2 text-3xl font-semibold">
            Happy Dashain!
          </h2>
          <p className="mt-4 text-base leading-relaxed">
            {isToday ? "Today, " : "Tomorrow, "}
            <strong style={{ color: "#C9A24B" }}>Wednesday, October 21</strong>, we&apos;re pausing{" "}
            <strong>all online orders</strong> to celebrate Dashain with family.
          </p>
          <p className="mt-2 text-sm" style={{ color: "#B8AE9C" }}>
            Online ordering returns Thursday, October 22 at 11:00 AM. Thank you for celebrating with us.
          </p>
          <button
            type="button"
            onClick={close}
            autoFocus
            className="mt-6 inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: "#C9A24B", color: "#14100D", outlineColor: "#F3E9D6" }}
          >
            Got it
          </button>
        </div>
      </div>
      <style>{`@keyframes dashainIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

const MARIGOLDS = Array.from({ length: 13 }, (_, i) => ({
  x: 12 + i * 31,
  y: 14 + Math.sin((i / 12) * Math.PI) * 16,
  c: i % 2 ? "#F29F05" : "#E86A10",
}));

/** Dashain scene: kites (changa) over the hills, marigold garland, tika thali with jamara, diyo. */
function DashainArt() {
  return (
    <svg
      viewBox="0 0 400 210"
      className="block h-auto w-full"
      role="img"
      aria-label="Kites flying over the Himalayas with a marigold garland, a tika plate with jamara, and a diyo lamp"
    >
      <defs>
        <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2216" />
          <stop offset="1" stopColor="#7A3A1E" />
        </linearGradient>
        <radialGradient id="dsun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F6C76A" />
          <stop offset="1" stopColor="#F6C76A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dflame" cx="0.5" cy="0.7" r="0.6">
          <stop offset="0" stopColor="#FFF4C2" />
          <stop offset="0.5" stopColor="#F6B23A" />
          <stop offset="1" stopColor="#E0601A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="210" fill="url(#dsky)" />
      <circle cx="300" cy="150" r="90" fill="url(#dsun)" opacity="0.55" />

      {/* Hills with snow caps */}
      <path d="M0 170 L60 120 L95 145 L150 92 L200 140 L250 108 L300 150 L350 118 L400 150 L400 210 L0 210Z" fill="#2A1A12" />
      <path d="M150 92 L138 104 L150 100 L162 105Z M250 108 L240 118 L250 115 L259 119Z" fill="#F3E9D6" opacity="0.8" />
      <path d="M0 185 Q100 160 200 182 T400 178 L400 210 L0 210Z" fill="#1C1712" />

      {/* Kites */}
      <g>
        <path d="M95 108 L210 210" stroke="#F3E9D6" strokeWidth="0.6" opacity="0.4" />
        <path d="M95 40 L120 70 L95 108 L70 70Z" fill="#C0392B" />
        <path d="M95 40 L95 108 M70 70 L120 70" stroke="#F3E9D6" strokeWidth="1.2" opacity="0.7" />
        <path d="M95 108 q-8 14 4 24 q-10 10 2 22" fill="none" stroke="#F29F05" strokeWidth="2" />
      </g>
      <g>
        <path d="M290 76 L230 210" stroke="#F3E9D6" strokeWidth="0.6" opacity="0.4" />
        <path d="M290 22 L310 46 L290 76 L270 46Z" fill="#C9A24B" />
        <path d="M290 22 L290 76 M270 46 L310 46" stroke="#14100D" strokeWidth="1" opacity="0.5" />
        <path d="M290 76 q8 12 -4 20 q10 9 -2 18" fill="none" stroke="#C0392B" strokeWidth="2" />
      </g>
      <g>
        <path d="M200 62 L213 78 L200 98 L187 78Z" fill="#2E86C1" />
        <path d="M200 98 q-5 8 3 14" fill="none" stroke="#F3E9D6" strokeWidth="1.5" />
      </g>

      {/* Marigold garland */}
      <path
        d={`M0 10 ${MARIGOLDS.map((m) => `L${m.x} ${m.y}`).join(" ")} L400 10`}
        fill="none"
        stroke="#4E7A2A"
        strokeWidth="1.5"
      />
      {MARIGOLDS.map((m, i) => (
        <g key={i}>
          <circle cx={m.x} cy={m.y} r="8" fill={m.c} />
          <circle cx={m.x} cy={m.y} r="3.5" fill="#B8410A" opacity="0.6" />
        </g>
      ))}

      {/* Tika thali with jamara + diyo */}
      <g transform="translate(330 168)">
        <ellipse cx="0" cy="14" rx="44" ry="10" fill="#B9742F" />
        <ellipse cx="0" cy="11" rx="40" ry="8" fill="#C9A24B" />
        <circle cx="-16" cy="8" r="7" fill="#C0392B" />
        <circle cx="-16" cy="7" r="2.5" fill="#F3E9D6" opacity="0.8" />
        {[-2, 3, 8, 13].map((x, i) => (
          <path key={i} d={`M${x} 9 q${i % 2 ? 3 : -3} -14 ${i % 2 ? 1 : -1} -24`} stroke="#E3D35B" strokeWidth="2" fill="none" />
        ))}
        <path d="M18 10 q10 6 20 0 q-2 -6 -10 -6 q-8 0 -10 6Z" fill="#8B4513" />
        <ellipse cx="28" cy="-6" rx="7" ry="11" fill="url(#dflame)" className="motion-safe:animate-pulse" />
      </g>
    </svg>
  );
}
