import type { Metadata } from "next";
import { Jost, Inter, Cormorant_Garamond } from "next/font/google";
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
const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});
const serifDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

const DESCRIPTION =
  "Family-run Himalayan & Nepali kitchen at 948 Clay Street, Oakland, since 2010. Momos, butter chicken, biryani, tandoori. Order pickup or delivery. Open Mon–Sat 11:00–21:30, closed Sundays.";

export const metadata: Metadata = {
  metadataBase: new URL("https://annapurnaoakland.com"),
  title: {
    default: "Annapurna — Himalayan & Nepali Restaurant · Oakland",
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
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Annapurna Oakland",
    title: "Annapurna — Himalayan & Nepali Restaurant · Oakland",
    description: DESCRIPTION,
    url: "https://annapurnaoakland.com",
    locale: "en_US",
    images: [{ url: "/images/annapurna-logo.png", width: 1200, height: 1200, alt: "Annapurna Restaurant & Bar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Annapurna — Himalayan & Nepali Restaurant · Oakland",
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
      className={`${display.variable} ${body.variable} ${serifDisplay.variable}`}
    >
      <body
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -8%, rgba(201,162,75,0.07), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(185,96,63,0.05), transparent 70%), #14100D",
          backgroundAttachment: "fixed",
          color: "#F3E9D6",
          fontFamily: "var(--font-body), sans-serif",
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
