// Restaurant ordering window. Open Mon–Sat 11:00–21:30 (America/Los_Angeles),
// closed Sundays. Online orders stop 10 minutes before close so the kitchen can
// finish — last order 21:20. Server-authoritative (the client cannot bypass).

export const OPEN_MIN = 11 * 60; // 11:00
export const CLOSE_MIN = 21 * 60 + 30; // 21:30
export const LAST_ORDER_BUFFER_MIN = 10; // stop ordering this many minutes before close
const CLOSED_DAYS = new Set([0]); // 0 = Sunday
const TZ = "America/Los_Angeles";

// ── Schema.org / SEO helpers (single source of truth for published hours) ──
const SCHEMA_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const OPENS_HHMM = hhmm(OPEN_MIN); // "11:00"
export const CLOSES_HHMM = hhmm(CLOSE_MIN); // "21:30"
/** Day names the restaurant is open, for schema.org openingHoursSpecification. */
export function openDayNames(): string[] {
  return SCHEMA_DAY_NAMES.filter((_, day) => !CLOSED_DAYS.has(day));
}

export interface OrderingWindow {
  open: boolean;
  reason: string | null;
}

/** Pure check given a day-of-week (0=Sun) and minutes-since-midnight. */
export function isOpenAt(day: number, minutes: number): OrderingWindow {
  if (CLOSED_DAYS.has(day)) return { open: false, reason: "We're closed on Sundays — see you Monday!" };
  if (minutes < OPEN_MIN) return { open: false, reason: "We open at 11:00 AM. Please order then." };
  if (minutes >= CLOSE_MIN - LAST_ORDER_BUFFER_MIN) {
    return { open: false, reason: "Online ordering closes 10 minutes before we close (last order 9:20 PM)." };
  }
  return { open: true, reason: null };
}

/** Resolve the restaurant-local day + minutes for an instant, then check the window. */
export function isOrderingOpen(now: Date = new Date()): OrderingWindow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const DAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = DAYS[get("weekday")] ?? 0;
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some platforms format midnight as 24
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  return isOpenAt(day, minutes);
}
