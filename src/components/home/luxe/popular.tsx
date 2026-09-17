import { getPopularItems } from "@/lib/menu/popular";
import { luxe } from "@/lib/theme";
import { PopularGrid } from "./popular-grid";

/**
 * "Popular right now" — the four best-selling dishes.
 *
 * Server-rendered on purpose: the dish names and photos land in the HTML (so
 * they are crawlable) and the section occupies its final height on first paint.
 * It used to fetch `/api/menu/popular` from the client and render `null` until
 * that resolved, which pushed everything below it down — that single injection
 * was the homepage's entire 0.243 CLS. The interactive parts (add-to-cart, the
 * dish modal) live in the `PopularGrid` client child.
 */
export async function Popular() {
  const items = await getPopularItems();
  if (items.length === 0) return null;

  return (
    <section className="py-4 lg:py-6" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-6 h-px w-9" style={{ backgroundColor: luxe.gold }} />
        <h2
          className="brand-heading text-center mb-6"
          style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
        >
          Popular right now.
        </h2>

        <PopularGrid items={items} />
      </div>
    </section>
  );
}
