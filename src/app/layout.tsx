import type { Metadata } from "next";
import { Jost, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/preview-cart";
import { TerracottaShell } from "@/components/preview/terracotta/shell";

const display = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annapurna — A tasting of the Himalayas · Oakland",
  description:
    "Family-run Himalayan kitchen at 948 Clay Street, Oakland, since 2010. Order pickup or delivery. Open daily 11:00–21:30.",
  keywords: [
    "Nepali food Oakland",
    "Himalayan restaurant Oakland",
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
      className={`${display.variable} ${body.variable}`}
    >
      <body
        style={{
          backgroundColor: "#14100D",
          color: "#F3E9D6",
          fontFamily: "var(--font-body), sans-serif",
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
