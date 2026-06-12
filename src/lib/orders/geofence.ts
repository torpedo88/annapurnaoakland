import "server-only";
import { env } from "@/lib/env";
import { haversineMiles, type Coords } from "@/lib/orders/distance";

export class OutOfRangeError extends Error {
  constructor(public miles: number, public maxMiles: number) {
    super("Address is outside the delivery radius");
    this.name = "OutOfRangeError";
  }
}

/** Geocode a US address via the server-side Google Geocoding key. Null on any failure. */
async function geocode(address: string): Promise<Coords | null> {
  const key = env.geocoding().apiKey;
  if (!key || !address) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(address)}&components=country:US&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: { geometry?: { location?: { lat: number; lng: number } } }[];
    };
    if (data.status !== "OK") return null;
    const loc = data.results?.[0]?.geometry?.location;
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

// Geocode the restaurant once per server instance.
let originPromise: Promise<Coords | null> | null = null;
function restaurantOrigin(): Promise<Coords | null> {
  if (!originPromise) originPromise = geocode(env.restaurant().pickupAddress);
  return originPromise;
}

/**
 * Enforces the delivery geofence. Throws OutOfRangeError if `address` is beyond
 * `maxMiles` from the restaurant. Fails open: if geocoding is unconfigured or
 * either address can't be resolved, it does NOT block the order (so a geocode
 * hiccup never silently kills a legitimate in-range delivery).
 */
export async function assertWithinDeliveryRadius(address: string, maxMiles: number): Promise<void> {
  if (!maxMiles || maxMiles <= 0) return;
  const [origin, dest] = await Promise.all([restaurantOrigin(), geocode(address)]);
  if (!origin || !dest) {
    console.warn("[geofence] could not geocode; skipping radius check for:", address.slice(0, 60));
    return;
  }
  const miles = haversineMiles(origin, dest);
  if (miles > maxMiles) throw new OutOfRangeError(miles, maxMiles);
}
