"use client";

import Link from "next/link";
import Image from "next/image";
import { luxe } from "@/lib/theme";

// Homepage hero. Per owner request this shows the exact design image as the
// hero, with real clickable hotspots over the baked-in MENU / RESERVATIONS
// buttons, plus a matching button row below (adds Order Online and gives mobile
// users reliable targets). A visually-hidden <h1> keeps the page crawlable
// since the headline text lives inside the image.

const PILL =
  "uppercase tracking-[0.18em] text-[11px] font-medium px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition-colors";

// Transparent clickable overlay positioned (in %) over a region of the image.
function Hotspot({
  href, label, onClick, style,
}: {
  href: string; label: string; onClick?: () => void; style: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      className="absolute z-10 rounded-full focus:outline-none focus-visible:ring-2"
      style={style}
    />
  );
}

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
        {/* Exact design image; keeps its 2390×1792 (4:3) aspect so the % hotspots
            stay aligned at every width. */}
        <div className="relative w-full overflow-hidden rounded-[4px]" style={{ aspectRatio: "2390 / 1792", border: `1px solid ${luxe.line}` }}>
          <Image
            src="/images/annapurna-hero.png"
            alt="Annapurna Restaurant & Bar — A Blend of Tradition & Flavor. Indian & Nepalese cuisine in Old Oakland."
            fill
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-contain"
          />

          {/* Transparent hotspot over the baked-in MENU pill (image already
              reads "MENU"). %-based so it scales with the image. */}
          <Hotspot href="/menu" label="View menu" style={{ top: "1.8%", left: "57.4%", width: "18.2%", height: "7.2%" }} />

          {/* The image's second pill reads "RESERVATIONS"; per request that slot
              is Order Online. Cover it with a matching gold pill so the label and
              the destination agree. */}
          <Link
            href="/menu"
            onClick={setPickup}
            aria-label="Order online"
            className="absolute z-10 inline-flex items-center justify-center uppercase"
            style={{
              top: "1.8%", left: "76.6%", width: "21%", height: "7.2%",
              border: `1px solid ${luxe.gold}`,
              borderRadius: "9999px",
              backgroundColor: "rgba(20,16,13,0.92)",
              color: luxe.gold,
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
