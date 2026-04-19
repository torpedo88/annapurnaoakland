import type { Metadata } from "next";
import { Instrument_Serif, Manrope, Caveat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/preview-cart";
import { TerracottaShell } from "@/components/preview/terracotta/shell";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annapurna Oakland — Warm food. Served by family.",
  description:
    "Family-run Nepali & North Indian restaurant at 948 Clay Street, Oakland. Order online for pickup or delivery. Open daily 11:00–21:30.",
  keywords: [
    "Nepali food Oakland",
    "Indian restaurant Oakland",
    "Annapurna",
    "momos",
    "butter chicken",
    "biryani",
    "948 Clay Street",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${hand.variable}`}
    >
      <body
        style={{
          backgroundColor: "#FDF4E4",
          color: "#2B1E16",
          fontFamily: "var(--font-manrope), sans-serif",
        }}
        className="antialiased min-h-screen"
      >
        <CartProvider>
          <TerracottaShell>{children}</TerracottaShell>
        </CartProvider>
      </body>
    </html>
  );
}
