/**
 * Which menu items get their own indexable page at `/menu/<slug>`.
 *
 * Deliberately NOT `server-only`: the menu grid is a client component and has to
 * apply the same rule, otherwise it links dishes that have no page and hands
 * Google (and visitors) a 404.
 *
 * Two exclusions:
 *
 * 1. **Catering items.** Half/full-tray versions of dishes that already have a
 *    page — same name, same photo, near-identical text. Giving each one a URL
 *    would roughly double the page count with duplicates, which is how you earn
 *    a thin-content problem rather than solve one. Catering has `/catering`.
 * 2. **Packaged drinks.** Nobody searches for "bottled water in Oakland", and a
 *    page that only says "chilled bottled still water" is exactly the thin page
 *    Google drops. Everything the kitchen actually prepares — chai, lassi, iced
 *    tea — keeps its page.
 *
 * Items that are temporarily 86'd still keep their page; availability flips
 * daily and the page says so rather than 404ing.
 */
const PACKAGED_DRINKS = new Set([
  "beverages-soda-coke-diet-coke-sprite",
  "beverages-sparkling-water",
  "beverages-regular-water",
]);

export function hasDishPage(item: { id: string; isCatering: boolean }): boolean {
  return !item.isCatering && !PACKAGED_DRINKS.has(item.id);
}
