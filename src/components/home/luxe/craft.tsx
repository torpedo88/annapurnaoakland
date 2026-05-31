import Image from "next/image";
import { luxe } from "@/lib/theme";

const moments = [
  {
    label: "Hand-pleated",
    detail: "Every momo, every morning",
    img: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=1100&q=85&auto=format&fit=crop",
  },
  {
    label: "Live tandoor",
    detail: "650°C clay oven since 2010",
    img: "https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg",
  },
  {
    label: "House-pressed paneer",
    detail: "Monday mornings, by hand",
    img: "https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg",
  },
  {
    label: "Slow-cooked",
    detail: "Rogan josh, six hours",
    img: "https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg",
  },
];

export function Craft() {
  return (
    <section
      className="py-24 lg:py-32"
      style={{ borderTop: `1px solid ${luxe.line}` }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="text-center mb-14">
          <p
            className="text-[10px] uppercase tracking-[0.34em] mb-5"
            style={{ color: luxe.gold }}
          >
            The Work
          </p>
          <h2
            className="leading-[1.1] mx-auto max-w-[16ch]"
            style={{
              color: luxe.ink,
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
            }}
          >
            Four things we never speed up.
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {moments.map((m, i) => (
            <figure
              key={i}
              className="relative aspect-[3/4] overflow-hidden rounded-[3px]"
              style={{ border: `1px solid ${luxe.line}` }}
            >
              <Image
                src={m.img}
                alt={m.label}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20,16,13,0.15) 20%, rgba(20,16,13,0.9) 100%)",
                }}
              />
              <figcaption className="absolute bottom-5 left-5 right-5">
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-1.5"
                  style={{ color: luxe.gold }}
                >
                  № {String(i + 1).padStart(2, "0")}
                </p>
                <p
                  className="text-lg leading-tight"
                  style={{ color: luxe.ink, fontFamily: "var(--font-display)" }}
                >
                  {m.label}
                </p>
                <p className="text-[12px] mt-1" style={{ color: luxe.muted }}>
                  {m.detail}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
