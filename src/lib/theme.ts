// src/lib/theme.ts
// Single source of truth for the dark fine-dining palette.
// Use for inline style colors; layout utilities stay in Tailwind classes.
export const luxe = {
  bg: "#14100D",        // page background — espresso near-black
  surface: "#1C1712",   // raised cards / sections
  ink: "#F3E9D6",       // primary text — warm cream
  muted: "#8A8276",     // secondary text
  gold: "#C9A24B",      // primary accent / CTAs / active state
  ember: "#B9742F",     // sparing warm secondary (hover)
  line: "rgba(201,162,75,0.15)", // hairline borders / dividers
} as const;

export type LuxeColor = keyof typeof luxe;
