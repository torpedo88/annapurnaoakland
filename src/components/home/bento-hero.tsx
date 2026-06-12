"use client";

import { luxe } from "@/lib/theme";
import { OrderCTA } from "@/components/home/luxe/order-cta";
import { HeroCarousel, type Frame } from "@/components/home/hero-carousel";

// Three rotating hero frames — two kitchen videos + the restaurant interior.
const FRAMES: Frame[] = [
  { type: "video", src: "/video/live-tandoor.mp4" },
  { type: "image", src: "/images/visit-bg.jpg", alt: "Annapurna Restaurant & Bar" },
  { type: "video", src: "/video/hero-clip.mp4" },
];

export function BentoHero() {
  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 lg:pt-32"
      style={{ backgroundColor: luxe.bg }}
    >
      <div className="mx-auto max-w-4xl px-6 text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.34em] mb-4" style={{ color: luxe.gold }}>
          A Himalayan Kitchen · Oakland
        </p>
        <h1
          className="uppercase leading-[0.95] text-[2.75rem] sm:text-6xl md:text-7xl"
          style={{ color: luxe.ink, fontFamily: "var(--font-display)", fontWeight: 200, letterSpacing: "0.14em" }}
        >
          Annapurna
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base" style={{ color: luxe.muted }}>
          Momo, live tandoor, and slow-cooked biryani — by the family that has run the kitchen since 2010.
        </p>
      </div>

      <HeroCarousel frames={FRAMES} />

      <div className="mt-8 px-6">
        <OrderCTA align="center" />
      </div>
    </section>
  );
}
