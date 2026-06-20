"use client";

import Link from "next/link";
import { luxe } from "@/lib/theme";

// Homepage hero. A muted, looping ambient video of the dining room (generated
// from the interior photo) sits as the background, with a legibility gradient
// and real text + buttons layered on top. Real H1/copy means the hero stays
// crawlable; the video is decorative.

const PILL =
  "uppercase tracking-[0.18em] text-[11px] font-medium px-7 py-3.5 rounded-[2px] inline-flex items-center justify-center transition-colors";

function setPickup() {
  try { localStorage.setItem("annapurna:fulfillment", "pickup"); } catch { /* ignore */ }
}

export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden flex items-center min-h-[72vh] lg:min-h-[80vh] pt-24 pb-16"
      style={{ backgroundColor: luxe.bg }}
    >
      {/* Ambient background video (decorative) */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/images/visit-bg.jpg"
        aria-hidden
        tabIndex={-1}
      >
        <source src="/video/hero-dining.mp4" type="video/mp4" />
      </video>

      {/* Legibility overlay */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,16,13,0.92) 0%, rgba(20,16,13,0.78) 42%, rgba(20,16,13,0.4) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl">
          <div className="mb-5 h-px w-9" style={{ backgroundColor: luxe.gold }} />
          <p className="mb-4 text-[10px] uppercase tracking-[0.34em]" style={{ color: luxe.gold }}>
            Indian &amp; Nepalese Cuisine · Oakland
          </p>

          <h1
            className="mb-6 leading-[0.98]"
            style={{
              color: luxe.ink,
              fontFamily: "var(--font-serif-display), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(2.8rem, 6.5vw, 5rem)",
            }}
          >
            A blend of tradition &amp; flavor.
          </h1>

          <p className="mb-9 max-w-md text-[17px] leading-relaxed" style={{ color: "#C8BEA8" }}>
            Hand-pleated momos, slow-cooked curries, and tandoor-fired naan —
            served in a warm, spacious room by the family that has run the
            kitchen since 2010.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/menu" className={PILL} style={{ backgroundColor: luxe.gold, color: luxe.bg }}>
              Menu
            </Link>
            <Link href="/menu" onClick={setPickup} className={PILL} style={{ backgroundColor: luxe.gold, color: luxe.bg }}>
              Order Online
            </Link>
            <Link href="/reservations" className={PILL} style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}>
              Reservations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
