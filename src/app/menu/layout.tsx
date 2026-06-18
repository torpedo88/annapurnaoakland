import type { Metadata } from "next";
import { MenuJsonLd } from "@/components/seo/menu-jsonld";

export const metadata: Metadata = {
  title: "Order Online — Nepali & Himalayan Menu",
  description:
    "Order online for pickup or delivery in Oakland — momos, butter chicken, biryani, tandoori, and Nepali & Himalayan specialties from Annapurna's full menu.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Order Online · Annapurna Oakland",
    description: "Order online — momos, butter chicken, biryani, tandoori & more. Pickup or delivery in Oakland.",
    url: "https://annapurnaoakland.com/menu",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MenuJsonLd />
      {children}
    </>
  );
}
