import Image from "next/image";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "./order-cta";

export function Visit() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/visit-bg.jpg"
          alt="Annapurna Restaurant & Bar"
          fill
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.34 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #14100D 0%, rgba(20,16,13,0.82) 45%, rgba(20,16,13,0.6) 100%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-5 h-px w-9" style={{ backgroundColor: luxe.gold }} />
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-5"
            style={{ color: luxe.gold }}
          >
            Come See Us
          </p>
          <h2
            className="brand-heading leading-[1.02] mb-10"
            style={{ fontSize: "clamp(2.4rem, 7vw, 4.6rem)" }}
          >
            Two minutes from 12th St Oakland BART.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {[
              { k: "Address", a: "948 Clay Street", b: "Oakland, CA 94607" },
              { k: "Hours", a: "Mon–Sat · 11–21:30", b: "Closed Sundays" },
              { k: "Call", a: "(510) 250-9696", b: "", href: "tel:+15102509696" },
            ].map((c) => (
              <div key={c.k}>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-2"
                  style={{ color: luxe.muted }}
                >
                  {c.k}
                </p>
                {c.href ? (
                  <a href={c.href} className="text-[19px]" style={{ color: luxe.ink, fontFamily: "var(--font-display), Georgia, serif" }}>
                    {c.a}
                  </a>
                ) : (
                  <p className="text-[19px]" style={{ color: luxe.ink, fontFamily: "var(--font-display), Georgia, serif" }}>
                    {c.a}
                  </p>
                )}
                {c.b && (
                  <p className="text-[19px]" style={{ color: luxe.ink, fontFamily: "var(--font-display), Georgia, serif" }}>
                    {c.b}
                  </p>
                )}
              </div>
            ))}
          </div>
          <OrderCTA />
        </div>
      </div>
    </section>
  );
}
