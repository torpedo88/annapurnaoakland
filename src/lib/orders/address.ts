// Structured US address parsing/formatting. Google Places gives us a clean
// single-line string ("529 Buena Vista Ave, Alameda, CA 94501, USA"); we split
// it into parts for storage + display. A separate manual unit/apt field is
// merged in via formatAddress.

export interface AddressParts {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

const UNIT_RE = /\s+(?:#|apt\.?|unit|ste\.?|suite|fl\.?|floor|rm\.?|room)\s*\.?\s*([\w-]+)\s*$/i;
const STATE_ZIP_RE = /\b([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\b/;

const empty: AddressParts = { street: "", unit: "", city: "", state: "", zip: "" };

/** Best-effort parse of a single-line US address into structured parts. */
export function parseAddress(line: string | null | undefined): AddressParts {
  if (!line) return { ...empty };
  // Drop a trailing country segment ("USA" / "US").
  const cleaned = line.replace(/,\s*(usa|us|united states)\s*$/i, "").trim();
  const segs = cleaned.split(",").map((s) => s.trim()).filter(Boolean);
  if (segs.length === 0) return { ...empty };

  const out: AddressParts = { ...empty };

  // Last segment usually holds "STATE ZIP" (city may be glued or separate).
  const last = segs[segs.length - 1]!;
  const sz = last.match(STATE_ZIP_RE);
  if (sz) {
    out.state = sz[1]!.toUpperCase();
    out.zip = sz[2]!;
    const remainder = last.replace(STATE_ZIP_RE, "").replace(/,\s*$/, "").trim();
    segs[segs.length - 1] = remainder; // leftover (rarely the city)
  }

  // City is the segment before the state/zip one (or the leftover above).
  const cityIdx = sz ? segs.length - 2 : segs.length - 2;
  if (cityIdx >= 1 && segs[cityIdx]) {
    out.city = segs[cityIdx]!;
  } else if (sz && segs[segs.length - 1]) {
    out.city = segs[segs.length - 1]!;
  }

  // Street = everything before the city.
  const streetEnd = out.city ? cityIdx : segs.length - (sz ? 1 : 0);
  let street = segs.slice(0, Math.max(1, streetEnd)).join(", ").trim();

  // Pull a trailing unit token out of the street ("123 Main St #4B").
  const unitMatch = street.match(UNIT_RE);
  if (unitMatch) {
    out.unit = unitMatch[1]!;
    street = street.replace(UNIT_RE, "").trim();
  }
  out.street = street;
  return out;
}

/** Compose a single-line address from parts (unit folded into the street). */
export function formatAddress(p: Partial<AddressParts>): string {
  const street = [p.street, p.unit ? `#${p.unit}` : ""].filter(Boolean).join(" ").trim();
  const cityState = [p.city, [p.state, p.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [street, cityState].filter(Boolean).join(", ");
}
