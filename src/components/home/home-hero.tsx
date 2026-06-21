"use client";

import Link from "next/link";
import { luxe } from "@/lib/theme";

// Homepage hero. Per owner request this shows the exact design image as the
// hero — now an animated (looping) version of that same image, with the static
// PNG as the poster. Matching solid-gold pills cover the baked-in MENU and
// second (Order Online) buttons, plus a matching button row below for mobile. A
// visually-hidden <h1> keeps the page crawlable since the headline text lives
// inside the image.

const PILL =
  "uppercase tracking-[0.18em] text-[11px] font-medium px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition-colors";

function setPickup() {
  try { localStorage.setItem("annapurna:fulfillment", "pickup"); } catch { /* ignore */ }
}

export function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28" style={{ backgroundColor: luxe.bg }}>
      <h1 className="sr-only">
        Annapurna Restaurant &amp; Bar — Indian &amp; Nepalese cuisine in Oakland. A blend of tradition &amp; flavor.
      </h1>

      <div className="relative mx-auto w-full max-w-6xl px-4 lg:px-8">
        {/* Exact design image, animated. Keeps its 2390×1792 (4:3) aspect so the
            % hotspots stay aligned at every width. The static PNG is the poster
            so it paints instantly and degrades gracefully if video is blocked. */}
        <div className="relative w-full overflow-hidden rounded-[4px]" style={{ aspectRatio: "2390 / 1792", border: `1px solid ${luxe.line}` }}>
          <video
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/annapurna-hero.png"
            aria-label="Annapurna Restaurant & Bar — A Blend of Tradition & Flavor. Indian & Nepalese cuisine in Old Oakland."
          >
            <source src="/video/hero-anim.mp4" type="video/mp4" />
          </video>

          {/* Both baked-in hero pills are covered with matching solid-gold pills
              so label + destination agree and the two look identical. Coords
              measured from the source PNG (MENU 57.4–75.6%, second slot
              76.6–97.6%); %-based so they scale with the image. */}
          <Link
            href="/menu"
            aria-label="View menu"
            className="absolute z-10 inline-flex items-center justify-center uppercase"
            style={{
              top: "1.8%", left: "57.4%", width: "18.2%", height: "7.2%",
              border: `1px solid ${luxe.gold}`,
              borderRadius: "9999px",
              backgroundColor: luxe.gold,
              color: luxe.bg,
              fontFamily: "var(--font-serif-display), Georgia, serif",
              letterSpacing: "0.12em",
              fontSize: "clamp(8px, 1.15vw, 15px)",
              whiteSpace: "nowrap",
            }}
          >
            Menu
          </Link>
          <Link
            href="/menu"
            onClick={setPickup}
            aria-label="Order online"
            className="absolute z-10 inline-flex items-center justify-center uppercase"
            style={{
              top: "1.8%", left: "76.6%", width: "21%", height: "7.2%",
              border: `1px solid ${luxe.gold}`,
              borderRadius: "9999px",
              backgroundColor: luxe.gold,
              color: luxe.bg,
              fontFamily: "var(--font-serif-display), Georgia, serif",
              letterSpacing: "0.12em",
              fontSize: "clamp(8px, 1.15vw, 15px)",
              whiteSpace: "nowrap",
            }}
          >
            Order Online
          </Link>
        </div>

        {/* Matching button row — adds Order Online and gives reliable targets on
            mobile (where the in-image hotspots are tiny). */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/menu" className={PILL} style={{ backgroundColor: luxe.gold, color: luxe.bg }}>
            Menu
          </Link>
          <Link href="/reservations" className={PILL} style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}>
            Reservations
          </Link>
          <Link href="/menu" onClick={setPickup} className={PILL} style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}>
            Order Online
          </Link>
        </div>
      </div>
    </section>
  );
}
