import { cache } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { restaurantSettings } from "@/db/schema";

export interface DeliverySettings {
  mode: "live" | "flat";
  flatFeeCents: number;
  markupCents: number;
  markupPercent: number;
  freeThresholdCents: number; // 0 = disabled
  minOrderCents: number;
  maxRadiusMiles: number;
}

export interface Settings {
  tax_rate: number;
  delivery: DeliverySettings;
  ordering_paused: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tax_rate: 0.0925,
  delivery: {
    mode: "live",
    flatFeeCents: 599,
    markupCents: 0,
    markupPercent: 0,
    freeThresholdCents: 0,
    minOrderCents: 0,
    maxRadiusMiles: 8,
  },
  ordering_paused: false,
  pickup_enabled: true,
  delivery_enabled: true,
};

type Row = { key: string; value: unknown };

/** Pure: fold DB rows over the typed defaults. Bad types fall back to defaults. */
export function mergeSettings(rows: Row[]): Settings {
  const out: Settings = structuredClone(DEFAULT_SETTINGS);
  for (const { key, value } of rows) {
    switch (key) {
      case "tax_rate":
        if (typeof value === "number" && value >= 0 && value < 1) out.tax_rate = value;
        break;
      case "ordering_paused":
        if (typeof value === "boolean") out.ordering_paused = value;
        break;
      case "pickup_enabled":
        if (typeof value === "boolean") out.pickup_enabled = value;
        break;
      case "delivery_enabled":
        if (typeof value === "boolean") out.delivery_enabled = value;
        break;
      case "delivery":
        if (value && typeof value === "object") {
          const v = value as Partial<DeliverySettings>;
          const d = out.delivery;
          if (v.mode === "live" || v.mode === "flat") d.mode = v.mode;
          for (const k of [
            "flatFeeCents", "markupCents", "markupPercent",
            "freeThresholdCents", "minOrderCents", "maxRadiusMiles",
          ] as const) {
            const val = v[k];
            if (typeof val === "number" && Number.isFinite(val) && val >= 0) {
              d[k] = val;
            }
          }
        }
        break;
    }
  }
  return out;
}

/** Read all settings (per-request memoized). */
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db
    .select({ key: restaurantSettings.key, value: restaurantSettings.value })
    .from(restaurantSettings);
  return mergeSettings(rows as Row[]);
});

/** Upsert a single setting key. Caller is responsible for role-gating. */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(restaurantSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: restaurantSettings.key,
      set: { value: sql`excluded.value`, updatedAt: sql`now()` },
    });
}
