import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/preview-cart";
import { TerracottaShell } from "@/components/preview/terracotta/shell";
import { RestaurantJsonLd } from "@/components/seo/restaurant-jsonld";
import { Analytics } from "@/components/analytics/analytics";

const display = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});
// Inter (--font-body) and Cormorant Garamond (--font-serif-display) are only
// used by the /flyer print pages, so they are declared in src/app/flyer/layout.tsx
// instead of here. Loading them globally cost every mobile visitor ~100 KiB of
// font downloads that competed with the LCP image for bandwidth, to render text
// no customer ever sees.

const DESCRIPTION =
  "Family-run Indian & Nepalese kitchen at 948 Clay Street, Oakland, since 2010. Momos, butter chicken, biryani, tandoori. Pickup or delivery. Closed Sundays.";

export const metadata: Metadata = {
  metadataBase: new URL("https://annapurnaoakland.com"),
  title: {
    default: "Annapurna — Indian & Nepalese Restaurant · Oakland",
    template: "%s · Annapurna Oakland",
  },
  description: DESCRIPTION,
  keywords: [
    "Nepali food Oakland",
    "Himalayan restaurant Oakland",
    "Nepali restaurant Oakland",
    "momos Oakland",
    "Annapurna",
    "butter chicken",
    "biryani",
    "tandoori Oakland",
    "948 Clay Street",
    "Oakland delivery",
    "Indian restaurant Oakland",
    "Indian food Oakland",
    "chicken tikka masala Oakland",
    "butter chicken Oakland",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Annapurna Oakland",
    title: "Annapurna — Indian & Nepalese Restaurant · Oakland",
    description: DESCRIPTION,
    url: "https://annapurnaoakland.com",
    locale: "en_US",
    images: [{ url: "/images/annapurna-logo.png", width: 1200, height: 1200, alt: "Annapurna Restaurant & Bar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Annapurna — Indian & Nepalese Restaurant · Oakland",
    description: DESCRIPTION,
    images: ["/images/annapurna-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={display.variable}
    >
      <body
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -8%, rgba(201,162,75,0.07), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(185,96,63,0.05), transparent 70%), #14100D",
          backgroundAttachment: "fixed",
          color: "#F3E9D6",
          fontFamily: "var(--font-display), sans-serif",
        }}
        className="antialiased min-h-screen"
      >
        <CartProvider>
          <TerracottaShell>{children}</TerracottaShell>
        </CartProvider>
        <RestaurantJsonLd />
        <Analytics />
      </body>
    </html>
  );
}
