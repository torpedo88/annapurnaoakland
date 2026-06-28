import type { PrintOrder } from "./serialize";

// Renders a kitchen ticket as Star Line Mode command bytes for a Star network
// printer (TSP650II etc.) served over CloudPRNT as `application/vnd.star.line`.
// Control codes used (all single-byte, < 0x80, so UTF-8 safe):
//   ESC i n1 n2  (1B 69)  character expansion: 1 1 = double height+width, 0 0 = normal
//   ESC d n      (1B 64)  print buffer, feed, and cut (n = feed lines before cut)
// The plain-text layout mirrors the existing kitchen receipt + the bridge
// formatter, so all consumers print the same ticket.

const ESC = "\x1b";
const BIG = ESC + "i\x01\x01"; // double height + width on
const NORMAL = ESC + "i\x00\x00"; // back to normal
const CUT = ESC + "d\x03"; // feed 3 lines and partial-cut

const W = 42; // ~42 cols at Font A on 80mm; 58mm/80mm both tolerate this
const rule = (ch = "-") => ch.repeat(W);
const money = (n: number) => `$${(n || 0).toFixed(2)}`;
function row(left: string, right: string): string {
  const gap = Math.max(1, W - left.length - right.length);
  return left + " ".repeat(gap) + right;
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
  let s = "\n";
  s += BIG;
  s += "  ANNAPURNA\n";
  s += `  #${o.orderNumber ?? "?"}  ${o.orderType.toUpperCase()}\n`;
  s += NORMAL;
  s += `${fmtTime(o.createdAt)}\n`;
  s += rule() + "\n";

  if (o.customerName) s += o.customerName + "\n";
  if (o.customerPhone) s += o.customerPhone + "\n";
  if (o.orderType === "delivery" && o.deliveryAddress) s += o.deliveryAddress + "\n";
  s += rule() + "\n";

  for (const it of o.items) {
    s += `${it.qty} x ${it.name}\n`;
    const mods = [
      it.spiceLevel && `spice: ${it.spiceLevel}`,
      it.riceChoice && `rice: ${it.riceChoice}`,
      it.traySize && `tray: ${it.traySize}`,
      it.specialInstructions && `note: ${it.specialInstructions}`,
    ].filter(Boolean) as string[];
    for (const m of mods) s += `   - ${m}\n`;
  }
  s += rule() + "\n";

  s += row("Subtotal", money(o.subtotal)) + "\n";
  if (o.tax) s += row("Tax", money(o.tax)) + "\n";
  if (o.tip) s += row("Tip", money(o.tip)) + "\n";
  if (o.deliveryFee) s += row("Delivery", money(o.deliveryFee)) + "\n";
  if (o.discount) s += row("Discount", `-${money(o.discount)}`) + "\n";
  s += row("TOTAL", money(o.total)) + "\n";
  s += `Payment: ${o.paymentStatus}\n`;
  s += rule("=") + "\n";
  s += "annapurnaoakland.com\n";
  s += "\n\n\n";
  s += CUT;
  return s;
}
