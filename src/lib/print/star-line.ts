import type { PrintOrder } from "./serialize";

// Renders a kitchen ticket as Star Line Mode command bytes for a Star network
// printer (TSP650II etc.), served over CloudPRNT as `application/vnd.star.line`.
// This is a KITCHEN ticket: items + modifiers only — no prices. A reorder QR is
// printed at the foot. All control codes are single bytes < 0x80, so the string
// is UTF-8 safe end to end.
//
// Star Line Mode control codes used:
//   ESC i n1 n2   (1B 69)        char expansion: n1 height, n2 width (0..)
//   ESC E / ESC F (1B 45 / 46)   emphasized (bold) on / off
//   ESC GS a n    (1B 1D 61)     alignment: 0 left, 1 center, 2 right
//   ESC d n       (1B 64)        feed n lines and cut
//   ESC GS y ...  (1B 1D 79)     2D barcode (QR) set/print

const PROMO_CODE = "REORDER10"; // 10% off next order
const REORDER_URL = `https://annapurnaoakland.com/menu?utm_source=receipt&promo=${PROMO_CODE}`;

const b = (...codes: number[]) => String.fromCharCode(...codes);

const SIZE = (h: number, w: number) => b(0x1b, 0x69, h, w);
const NORMAL = SIZE(0, 0);
const BIG = SIZE(1, 1); // double height + width
const TALL = SIZE(1, 0); // double height only
const BOLD_ON = b(0x1b, 0x45);
const BOLD_OFF = b(0x1b, 0x46);
const LEFT = b(0x1b, 0x1d, 0x61, 0x00);
const CENTER = b(0x1b, 0x1d, 0x61, 0x01);
const CUT = b(0x1b, 0x64, 0x03);

const W = 42;
const rule = (ch = "-") => ch.repeat(W);

// ASCII box framing (Line Mode can't draw rectangles; CP437 box bytes aren't
// UTF-8 safe, so we use +=| which always render). All box lines are NORMAL size
// so the borders stay aligned.
const INNER = W - 2;
const boxTop = "+" + "=".repeat(INNER) + "+\n";
function boxCenter(text: string, bold = false): string {
  const pad = Math.max(0, INNER - text.length);
  const l = Math.floor(pad / 2);
  const body = bold ? BOLD_ON + text + BOLD_OFF : text;
  return "|" + " ".repeat(l) + body + " ".repeat(pad - l) + "|\n";
}

// Star Line Mode QR: set model 2, error-correction M, cell size, store data, print.
function qr(data: string, cell = 6): string {
  const len = data.length;
  return (
    b(0x1b, 0x1d, 0x79, 0x53, 0x30, 0x02) + // model 2
    b(0x1b, 0x1d, 0x79, 0x53, 0x31, 0x01) + // EC level M
    b(0x1b, 0x1d, 0x79, 0x53, 0x32, cell) + // cell size
    b(0x1b, 0x1d, 0x79, 0x44, 0x31, 0x00, len & 0xff, (len >> 8) & 0xff) +
    data +
    b(0x1b, 0x1d, 0x79, 0x50) // print
  );
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function buildStarLineTicket(o: PrintOrder): string {
  let s = "";

  // ── Brand header: big, centered ──────────────────────────────────────────────
  s += CENTER + BIG + "ANNAPURNA\n" + NORMAL + LEFT;

  // ── Boxed order block: type + number + time (bold, framed) ────────────────────
  s += boxTop;
  s += boxCenter(o.orderType.toUpperCase(), true);
  s += boxCenter(`ORDER #${o.orderNumber ?? "?"}`, true);
  s += boxCenter(fmtTime(o.createdAt));
  s += boxTop;

  // ── Customer ────────────────────────────────────────────────────────────────
  s += "\n";
  if (o.customerName) s += BOLD_ON + o.customerName + "\n" + BOLD_OFF;
  if (o.customerPhone) s += o.customerPhone + "\n";
  if (o.orderType === "delivery" && o.deliveryAddress) s += o.deliveryAddress + "\n";

  // ── Items: header bar, then big bold "Nx Name" with mods indented ─────────────
  s += rule("=") + "\n";
  s += BOLD_ON + " ITEMS\n" + BOLD_OFF;
  s += rule("-") + "\n";
  for (const it of o.items) {
    s += TALL + BOLD_ON + `${it.qty}x ${it.name}\n` + BOLD_OFF + NORMAL;
    const mods = [
      it.spiceLevel && `spice: ${it.spiceLevel}`,
      it.riceChoice && `rice: ${it.riceChoice}`,
      it.traySize && `tray: ${it.traySize}`,
      it.specialInstructions && `note: ${it.specialInstructions}`,
    ].filter(Boolean) as string[];
    for (const m of mods) s += `    - ${m}\n`;
  }
  s += rule("=") + "\n";

  // ── Reorder QR footer ────────────────────────────────────────────────────────
  s += "\n" + CENTER;
  s += BOLD_ON + "Scan to reorder & save\n" + BOLD_OFF;
  s += qr(REORDER_URL) + "\n";
  s += "10% OFF your next order - use code\n";
  s += boxTop + boxCenter(PROMO_CODE, true) + boxTop;
  s += "annapurnaoakland.com\n";
  s += LEFT;

  s += "\n\n\n";
  s += CUT;
  return s;
}
