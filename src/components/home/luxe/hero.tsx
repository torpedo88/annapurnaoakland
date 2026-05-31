"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "./order-cta";

export function LuxeHero() {
  const reduce = useReducedMotion();
  const rise = reduce
    ? { initial: false as const, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section className="relative min-h-[88vh] lg:min-h-[92vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=2200&q=90&auto=format&fit=crop"
          alt="Butter chicken, plated"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.5 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 95% at 70% 22%, rgba(0,0,0,0.05), #14100D 86%)",
          }}
        />
      </div>

      {/* Top info strip */}
      <div className="absolute top-5 left-0 right-0 z-10">
        <div
          className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em]"
          style={{ color: luxe.muted }}
        >
          <span className="hidden sm:inline">Oakland · Est. 2010</span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#7C9A6B" }}
            />
            Open · til 21:30
          </span>
          <span className="hidden sm:inline">948 Clay St</span>
        </div>
      </div>

      <motion.div
        {...rise}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mx-auto max-w-7xl w-full px-6 lg:px-10 pb-16 lg:pb-24"
      >
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-5"
          style={{ color: luxe.gold }}
        >
          A Himalayan Kitchen
        </p>
        <h1
          className="uppercase leading-[0.95]"
          style={{
            color: luxe.ink,
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            letterSpacing: "0.14em",
            fontSize: "clamp(3rem, 11vw, 8.5rem)",
          }}
        >
          Annapurna
        </h1>
        <p
          className="mt-5 max-w-xl text-[15px] lg:text-base leading-relaxed"
          style={{ color: "#D8C9A6" }}
        >
          Momo, live tandoor, and slow-cooked biryani — served by the family
          that has run the kitchen since 2010.
        </p>
        <div className="mt-9">
          <OrderCTA />
        </div>
      </motion.div>
    </section>
  );
}
