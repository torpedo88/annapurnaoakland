import Image from "next/image";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "./order-cta";

export function Visit() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg"
          alt="Biryani"
          fill
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.4 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #14100D 0%, rgba(20,16,13,0.85) 50%, rgba(20,16,13,0.7) 100%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-5"
            style={{ color: luxe.gold }}
          >
            Come See Us
          </p>
          <h2
            className="leading-[1.05] mb-10"
            style={{
              color: luxe.ink,
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(2rem, 6vw, 4rem)",
            }}
          >
            Ten minutes from Lake Merritt BART.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {[
              { k: "Address", a: "948 Clay Street", b: "Oakland, CA 94607" },
              { k: "Hours", a: "Open daily", b: "11:00 — 21:30" },
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
                  <a href={c.href} className="text-[15px]" style={{ color: luxe.ink }}>
                    {c.a}
                  </a>
                ) : (
                  <p className="text-[15px]" style={{ color: luxe.ink }}>
                    {c.a}
                  </p>
                )}
                {c.b && (
                  <p className="text-[15px]" style={{ color: luxe.ink }}>
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
