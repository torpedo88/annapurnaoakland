"use client";

import { useEffect, useState } from "react";

interface Promo {
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: string;
}

/**
 * Animated red marquee strip shown directly under the site nav. Scrolls all
 * active promo codes. Renders nothing when there are no active promos.
 */
export function PromoMarquee() {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    let on = true;
    fetch("/api/promos/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on && d?.promos) setPromos(d.promos as Promo[]);
      })
      .catch(() => { /* no banner */ });
    return () => { on = false; };
  }, []);

  if (promos.length === 0) return null;

  // Duplicate the list so the marquee loops seamlessly.
  const items = [...promos, ...promos, ...promos, ...promos];

  return (
    <div
      className="relative z-20 overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #B91C1C 0%, #7F1414 50%, #B91C1C 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <style>{`
        @keyframes anp-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .anp-marquee-track {
          display: inline-flex;
          white-space: nowrap;
          animation: anp-marquee 28s linear infinite;
          will-change: transform;
        }
        .anp-marquee-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .anp-marquee-track { animation: none; }
        }
      `}</style>
      <div className="anp-marquee-track py-2">
        {items.map((p, i) => (
          <span
            key={`${p.code}-${i}`}
            className="mx-6 text-[12px] font-bold uppercase tracking-[0.16em]"
            style={{ color: "#FFFFFF" }}
          >
            🎉 Use code <span style={{ color: "#FDE8E8" }}>{p.code}</span> · {p.discountType === "percent" ? `${p.discountValue}% off` : `$${p.discountValue} off`}
            {p.description ? ` — ${p.description}` : ""}
            <span className="mx-3" style={{ color: "rgba(255,255,255,0.5)" }}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
