"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { luxe } from "@/lib/theme";

// Homepage hero. Shows the exact design image (animated, looping version of the
// same artwork) full-bleed — edge to edge across the viewport. A compressed JPG
// poster paints first as the LCP element; the video is deferred until after page
// load (preload=none) so it never blocks LCP or Core Web Vitals. Matching
// solid-gold pills cover the baked-in MENU and second (Order Online) buttons,
// plus a matching button row below for mobile. A visually-hidden <h1> keeps the
// page crawlable since the headline lives in the image.

const PILL =
  "uppercase tracking-[0.18em] text-[11px] font-medium px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition-colors";

function setPickup() {
  try { localStorage.setItem("annapurna:fulfillment", "pickup"); } catch { /* ignore */ }
}

export function HomeHero() {
  // Defer the hero video until the page has loaded so the lightweight poster
  // image is the LCP and the video never competes for initial bandwidth.
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    if (document.readyState === "complete") { setShowVideo(true); return; }
    const on = () => setShowVideo(true);
    window.addEventListener("load", on, { once: true });
    return () => window.removeEventListener("load", on);
  }, []);

  return (
    <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28" style={{ backgroundColor: luxe.bg }}>
      <h1 className="sr-only">
        Annapurna Restaurant &amp; Bar — Indian &amp; Nepalese cuisine in Oakland. A blend of tradition &amp; flavor.
      </h1>

      {/* Full-bleed hero — spans the viewport edge to edge (no max-width box,
          padding, border or rounding). The box keeps the 2390×1792 (4:3) aspect
          so the whole designed artwork stays visible (nothing cropped) and the
          %-based pill overlays stay aligned at every width. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2390 / 1792" }}>
        <Image
          src="/images/hero-poster.jpg"
          alt="Annapurna Restaurant & Bar — A Blend of Tradition & Flavor. Indian & Nepalese cuisine in Old Oakland."
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
        {showVideo && (
          <video
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster="/images/hero-poster.jpg"
            aria-hidden
            tabIndex={-1}
          >
            <source src="/video/hero-anim.mp4" type="video/mp4" />
          </video>
        )}

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
          mobile (where the in-image hotspots are tiny). Stays in a centered,
          padded container even though the image above is full-bleed. */}
      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-center gap-3 px-4">
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
    </section>
  );
}
