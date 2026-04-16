import type { Metadata } from "next";
import { Playfair_Display, Inter, DM_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annapurna — Taste of the Himalayas",
  description:
    "Family-owned Nepali-Indian restaurant in Oakland, CA. Authentic momos, tikka masala, tandoori, and more. Order online for pickup or delivery.",
  keywords: ["Nepali food Oakland", "Indian restaurant Oakland", "momos", "tikka masala", "Annapurna"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(playfair.variable, inter.variable, dmMono.variable, "font-sans", geist.variable)}
    >
      <body className="font-sans bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
