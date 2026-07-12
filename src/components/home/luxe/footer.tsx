import Link from "next/link";
import { luxe } from "@/lib/theme";

// External profiles — kept in sync with the schema.org `sameAs` list in
// src/components/seo/restaurant-jsonld.tsx (crawlable social signals + user reach).
const SOCIALS = [
  { href: "https://www.instagram.com/annapurnarestaurant510/", label: "Instagram" },
  { href: "https://www.facebook.com/annapurnarestaurantandbar/", label: "Facebook" },
  { href: "https://www.yelp.com/biz/annapurna-restaurant-and-bar-oakland-3", label: "Yelp" },
];

function Col({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[0.3em] mb-4"
        style={{ color: luxe.gold }}
      >
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[13px] opacity-80 transition hover:opacity-100"
              style={{ color: luxe.ink }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LuxeFooter() {
  return (
    <footer
      className="pt-20 pb-10"
      style={{ borderTop: `1px solid ${luxe.line}`, backgroundColor: luxe.bg }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid md:grid-cols-[1.4fr_0.8fr_0.8fr_1.3fr] gap-12">
        <div>
          <span
            className="uppercase tracking-[0.14em] text-2xl"
            style={{ color: luxe.ink, fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            Annapurna
          </span>
          <p
            className="mt-4 max-w-sm text-[14px] leading-[1.8]"
            style={{ color: luxe.muted }}
          >
            A family-run Indian & Nepalese kitchen in downtown Oakland. Open since 2010,
            cooking the recipes we grew up on.
          </p>
          <div className="mt-6 flex items-center gap-5">
            {SOCIALS.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Annapurna on ${label}`}
                className="text-[12px] uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
                style={{ color: luxe.ink }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <Col
          title="Order"
          links={[
            { href: "/menu", label: "Full menu" },
            { href: "/menu", label: "Pickup" },
          ]}
        />
        <Col
          title="Visit"
          links={[
            { href: "/reservations", label: "Reservations" },
            { href: "/catering", label: "Catering" },
            { href: "/about", label: "Our story" },
            {
              href: "https://maps.google.com/?q=948+Clay+Street+Oakland+CA",
              label: "Directions",
            },
            { href: "tel:+15102509696", label: "(510) 250-9696" },
          ]}
        />
        {/* Find us — embedded map (keyless Google Maps embed, no API key). */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-4"
            style={{ color: luxe.gold }}
          >
            Find us
          </p>
          <address
            className="not-italic text-[13px] leading-[1.7] mb-3"
            style={{ color: luxe.muted }}
          >
            948 Clay Street
            <br />
            Oakland, CA 94607
          </address>
          <a
            href="https://maps.google.com/?q=948+Clay+Street+Oakland+CA+94607"
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg"
            style={{ border: `1px solid ${luxe.line}` }}
            aria-label="Open Annapurna location in Google Maps"
          >
            <iframe
              title="Map to Annapurna — 948 Clay Street, Oakland CA 94607"
              src="https://www.google.com/maps?q=948%20Clay%20Street%2C%20Oakland%2C%20CA%2094607&output=embed"
              className="w-full h-40 pointer-events-none"
              style={{ border: 0, filter: "grayscale(0.2)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </a>
        </div>
      </div>
      <div
        className="mx-auto max-w-7xl px-6 lg:px-10 mt-14 pt-6 text-[11px]"
        style={{ borderTop: `1px solid ${luxe.line}`, color: luxe.muted }}
      >
        © 2026 Annapurna · 948 Clay Street, Oakland CA
      </div>
    </footer>
  );
}
