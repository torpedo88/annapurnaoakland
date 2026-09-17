import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Online — Indian & Nepalese Menu",
  description:
    "Order online for pickup or delivery in Oakland — momos, butter chicken, biryani, tandoori, and Indian & Nepalese specialties from Annapurna's full menu.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Order Online · Annapurna Oakland",
    description: "Order online — momos, butter chicken, biryani, tandoori & more. Pickup or delivery in Oakland.",
    url: "https://annapurnaoakland.com/menu",
  },
};

// NOTE: this layout also wraps /menu/[slug]. The full-menu JSON-LD lives in
// menu/page.tsx rather than here, so a dish page emits only its own MenuItem
// schema instead of repeating the entire menu 84 times.
export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
