import "server-only";
import { env } from "@/lib/env";

export class OutOfRangeError extends Error {
  constructor(public miles: number, public maxMiles: number) {
    super("Address is outside the delivery radius");
    this.name = "OutOfRangeError";
  }
}

type Coords = { lat: number; lng: number };

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

/** Great-circle distance in miles. */
function haversineMiles(a: Coords, b: Coords): number {
  const R = 3958.7613; // earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
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
