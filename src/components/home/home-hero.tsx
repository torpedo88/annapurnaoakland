"use client";

import Link from "next/link";
import Image from "next/image";
import { luxe } from "@/lib/theme";

// Homepage hero. Two-column on desktop: a photo collage (restaurant interior +
// floating dish cards) on the left, headline + CTA buttons on the right. Real
// text + real <Link> buttons (no baked-in image text) so it stays crawlable,
// responsive, and accessible. Replaces the old video bento hero.

const PILL =
  "uppercase tracking-[0.18em] text-[11px] font-medium px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition-colors";

// Remember pickup intent when heading to the menu to order online.
function setPickup() {
  try { localStorage.setItem("annapurna:fulfillment", "pickup"); } catch { /* ignore */ }
}

export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-24"
      style={{ backgroundColor: luxe.bg }}
    >
      {/* warm radial glow, top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(201,162,75,0.10), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ── Photo collage ── */}
          <div className="relative">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-[3px]"
              style={{ border: `1px solid ${luxe.line}` }}
            >
              <Image
                src="/images/visit-bg.jpg"
                alt="Annapurna Restaurant & Bar dining room in Old Oakland — vaulted wood ceiling, chandeliers, stained glass"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 55%, rgba(20,16,13,0.55) 100%)" }}
              />
            </div>

            {/* floating dish card — bottom-left, overlapping */}
            <div
              className="absolute -bottom-6 -left-3 hidden w-40 overflow-hidden rounded-[3px] shadow-2xl sm:block lg:w-48"
              style={{ border: `1px solid ${luxe.gold}` }}
            >
              <div className="relative aspect-square">
                <Image
                  src="/images/dishes/butterChicken.jpg"
                  alt="Butter chicken"
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* floating dish card — top-right, overlapping */}
            <div
              className="absolute -top-5 -right-3 hidden w-32 overflow-hidden rounded-[3px] shadow-2xl sm:block lg:w-40"
              style={{ border: `1px solid ${luxe.gold}` }}
            >
              <div className="relative aspect-square">
                <Image
                  src="/images/dishes/chickenMomo.jpg"
                  alt="Chicken momo"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* ── Copy + CTAs ── */}
          <div>
            <div className="mb-5 h-px w-9" style={{ backgroundColor: luxe.gold }} />
            <p
              className="mb-4 text-[10px] uppercase tracking-[0.34em]"
              style={{ color: luxe.gold }}
            >
              Indian &amp; Nepalese Cuisine · Oakland
            </p>

            <h1
              className="mb-6 leading-[0.98]"
              style={{
                color: luxe.ink,
                fontFamily: "var(--font-serif-display), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(2.6rem, 6vw, 4.6rem)",
              }}
            >
              A blend of tradition &amp; flavor.
            </h1>

            <p
              className="mb-9 max-w-md text-[17px] leading-relaxed"
              style={{ color: luxe.muted }}
            >
              Hand-pleated momos, slow-cooked curries, and tandoor-fired naan —
              served in a warm, spacious room by the family that has run the
              kitchen since 2010.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/menu"
                className={PILL}
                style={{ backgroundColor: luxe.gold, color: luxe.bg }}
              >
                Menu
              </Link>
              <Link
                href="/reservations"
                className={PILL}
                style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}
              >
                Reservations
              </Link>
              <Link
                href="/menu"
                onClick={setPickup}
                className={PILL}
                style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}
              >
                Order Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
