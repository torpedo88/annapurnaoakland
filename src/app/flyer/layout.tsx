import { Inter, Cormorant_Garamond } from "next/font/google";

// The printable flyers are the only pages that use these two families, so they
// are scoped here rather than in the root layout — otherwise every mobile
// visitor downloads ~100 KiB of fonts (competing with the LCP image) to render
// text that only exists on a noindex print page.
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

export default function FlyerLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${serifDisplay.variable}`}>{children}</div>;
}
