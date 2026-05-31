import Link from "next/link";
import { luxe } from "@/lib/theme";

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
      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
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
            A family-run Himalayan kitchen in downtown Oakland. Open since 2010,
            cooking the recipes we grew up on.
          </p>
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
            { href: "/about", label: "Our story" },
            {
              href: "https://maps.google.com/?q=948+Clay+Street+Oakland+CA",
              label: "Directions",
            },
            { href: "tel:+15102509696", label: "(510) 250-9696" },
          ]}
        />
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
