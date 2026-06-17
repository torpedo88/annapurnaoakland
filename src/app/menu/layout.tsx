import type { Metadata } from "next";
import { MenuJsonLd } from "@/components/seo/menu-jsonld";

export const metadata: Metadata = {
  title: "Menu — Nepali & Himalayan Food",
  description:
    "The full Annapurna menu — momos, butter chicken, biryani, tandoori, and Nepali & Himalayan specialties. Order pickup or delivery in Oakland.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menu · Annapurna Oakland",
    description: "Momos, butter chicken, biryani, tandoori & more. Pickup or delivery in Oakland.",
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
