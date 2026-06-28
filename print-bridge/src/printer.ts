// Star printer integration via react-native-star-io10 (StarXpand SDK / StarIO10).
//
// NOTE: the exact class namespacing in react-native-star-io10 can vary by
// version (some expose `StarXpandCommand.PrinterBuilder`, others bare
// `PrinterBuilder`; `getDocumentAsString()` vs `getCommands()`). The imports
// below follow the package README; if your installed version differs, adjust to
// match its sample app. The receipt text itself (buildReceiptText) is
// version-independent.
import {
  InterfaceType,
  StarConnectionSettings,
  StarPrinter,
  StarDeviceDiscoveryManager,
  StarXpandCommandBuilder,
  DocumentBuilder,
  PrinterBuilder,
  CutType,
} from "react-native-star-io10";
import type { PrintOrder } from "./types";

export type FoundPrinter = { identifier: string; model: string };

export async function discoverBluetoothPrinters(timeoutMs = 6000): Promise<FoundPrinter[]> {
  const manager = new StarDeviceDiscoveryManager(InterfaceType.Bluetooth);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const found: any[] = await manager.search(timeoutMs);
  return found.map((p) => ({ identifier: p.identifier as string, model: (p.model as string) ?? "Star" }));
}

// ── Receipt formatting (80mm thermal, ~42 cols at Font A) ───────────────────
const W = 42;
const rule = (ch = "-") => ch.repeat(W);
const money = (n: number) => `$${(n || 0).toFixed(2)}`;
function row(left: string, right: string): string {
  const gap = Math.max(1, W - left.length - right.length);
  return left + " ".repeat(gap) + right;
}

export function buildReceiptText(o: PrintOrder): string {
  const L: string[] = [];
  L.push("ANNAPURNA");
  L.push(`#${o.orderNumber ?? "?"}   ${o.orderType.toUpperCase()}`);
  L.push(new Date(o.createdAt).toLocaleString());
  L.push(rule());
  if (o.customerName) L.push(o.customerName);
  if (o.customerPhone) L.push(o.customerPhone);
  if (o.orderType === "delivery" && o.deliveryAddress) L.push(o.deliveryAddress);
  L.push(rule());
  for (const it of o.items) {
    L.push(`${it.qty} x ${it.name}`);
    const mods = [
      it.spiceLevel && `spice: ${it.spiceLevel}`,
      it.riceChoice && `rice: ${it.riceChoice}`,
      it.traySize && `tray: ${it.traySize}`,
      it.specialInstructions && `note: ${it.specialInstructions}`,
    ].filter(Boolean) as string[];
    for (const m of mods) L.push(`   - ${m}`);
  }
  L.push(rule());
  L.push(row("Subtotal", money(o.subtotal)));
  if (o.tax) L.push(row("Tax", money(o.tax)));
  if (o.tip) L.push(row("Tip", money(o.tip)));
  if (o.deliveryFee) L.push(row("Delivery", money(o.deliveryFee)));
  if (o.discount) L.push(row("Discount", `-${money(o.discount)}`));
  L.push(row("TOTAL", money(o.total)));
  L.push(`Payment: ${o.paymentStatus}`);
  L.push(rule("="));
  L.push("annapurnaoakland.com");
  return L.join("\n") + "\n\n\n";
}

export async function printOrder(printerIdentifier: string, order: PrintOrder): Promise<void> {
  const settings = new StarConnectionSettings();
  settings.interfaceType = InterfaceType.Bluetooth;
  settings.identifier = printerIdentifier;
  const printer = new StarPrinter(settings);

  try {
    const commands = await new StarXpandCommandBuilder()
      .addDocument(
        new DocumentBuilder().addPrinter(
          new PrinterBuilder().addText(buildReceiptText(order)).addCut(CutType.PartialCut),
        ),
      )
      .getDocumentAsString();

    await printer.open();
    await printer.print(commands);
  } finally {
    await printer.close().catch(() => {});
  }
}
