import Image from "next/image";
import Link from "next/link";
import { menu } from "@/data/menu";
import { luxe } from "@/lib/theme";

const IDS = [
  "appetizer-chicken-momo",
  "vegetarian-dish-palak-paneer",
  "biryani-lamb-biryani",
  "chicken-dish-chicken-nauni-butter-chicken",
];

const dishes = IDS.map((id) => menu.find((m) => m.id === id)).filter(
  (m): m is NonNullable<typeof m> => Boolean(m),
);

export function SignatureGrid() {
  return (
    <section
      className="py-24 lg:py-32"
      style={{ borderTop: `1px solid ${luxe.line}` }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="text-center mb-14">
          <div
            className="mx-auto mb-6 h-px w-9"
            style={{ backgroundColor: luxe.gold }}
          />
          <p
            className="text-[10px] uppercase tracking-[0.34em]"
            style={{ color: luxe.gold }}
          >
            House Signatures
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {dishes.map((d) => (
            <Link
              key={d.id}
              href="/menu"
              className="group relative block aspect-[3/4] overflow-hidden rounded-[3px]"
            >
              <Image
                src={d.image}
                alt={d.name}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(20,16,13,0.92))",
                }}
              />
              <div className="absolute left-4 right-4 bottom-4">
                <h3
                  className="text-[15px] leading-tight"
                  style={{ color: luxe.ink, fontFamily: "var(--font-display)" }}
                >
                  {d.name}
                </h3>
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: luxe.gold }}
                >
                  ${d.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
