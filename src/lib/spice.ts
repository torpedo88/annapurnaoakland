export const SPICE_LEVELS = ["Mild", "Medium", "Hot"] as const;
export type SpiceLevel = (typeof SPICE_LEVELS)[number];
export const DEFAULT_SPICE: SpiceLevel = "Medium";
/** Spice applies to savory mains only — not appetizers, breads, sides, drinks, desserts. */
export function hasSpiceOptions(category: string): boolean {
  return !/appetizer|bread|side|beverage|dessert/i.test(category);
}
