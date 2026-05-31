import { luxe } from "@/lib/theme";

export function KitchenStatement() {
  return (
    <section
      className="py-24 lg:py-32"
      style={{ borderTop: `1px solid ${luxe.line}` }}
    >
      <div className="mx-auto max-w-3xl px-6 lg:px-10 text-center">
        <div
          className="mx-auto mb-6 h-px w-9"
          style={{ backgroundColor: luxe.gold }}
        />
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-6"
          style={{ color: luxe.gold }}
        >
          The Kitchen
        </p>
        <h2
          className="leading-[1.15]"
          style={{
            color: luxe.ink,
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            letterSpacing: "0.02em",
            fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
          }}
        >
          A tasting of the Himalayas, plated with patience.
        </h2>
        <p
          className="mt-6 text-[15px] leading-[1.8] max-w-xl mx-auto"
          style={{ color: luxe.muted }}
        >
          Every momo hand-pleated each morning. Paneer pressed by hand. The
          tandoor lit before dawn. Nothing leaves the kitchen unless we would
          serve it at our own table.
        </p>
      </div>
    </section>
  );
}
