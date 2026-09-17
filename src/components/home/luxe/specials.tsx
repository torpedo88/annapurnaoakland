import { getSettings } from "@/lib/settings";
import { getMenuCatalog } from "@/lib/menu/catalog";
import { luxe } from "@/lib/theme";
import { SpecialsBanner, type DishOfDay } from "./specials-banner";

const LOGO = "/images/annapurna-logo.png";

/**
 * "Today's specials" — the dish of the day.
 *
 * Server-rendered for the same reason as `Popular`: the banner is ~340px tall
 * and used to appear only after a client fetch of `/api/settings/public`,
 * shoving the sections below it down the page. Name, description and price now
 * ship in the HTML; only the add-to-cart button is client-side.
 */
export async function Specials() {
  const [s, catalog] = await Promise.all([getSettings(), getMenuCatalog()]);
  const item = s.dish_of_day.itemId
    ? catalog.items.find((m) => m.id === s.dish_of_day.itemId)
    : undefined;
  if (!item) return null;

  const dish: DishOfDay = {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image || LOGO,
    discountPercent: s.dish_of_day.discountPercent,
    discountedPrice:
      s.dish_of_day.discountPercent > 0
        ? +(item.price * (1 - s.dish_of_day.discountPercent / 100)).toFixed(2)
        : null,
  };

  return (
    <section className="py-4 lg:py-6" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-6 h-px w-9" style={{ backgroundColor: luxe.gold }} />
        <p
          className="text-[10px] uppercase tracking-[0.34em] mb-10 text-center"
          style={{ color: luxe.gold }}
        >
          Today&apos;s specials
        </p>

        <div className="flex flex-col items-center gap-8">
          <SpecialsBanner dish={dish} />
        </div>
      </div>
    </section>
  );
}
