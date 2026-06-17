"use client";

import { luxe } from "@/lib/theme";
import { OrderCTA } from "@/components/home/luxe/order-cta";
import InteractiveBentoGallery, {
  type MediaItemType,
} from "@/components/ui/interactive-bento-gallery";

// Two bento tiles: side-by-side on desktop, stacked full-width on mobile/tablet.
const SPANS = [
  "col-span-2 row-span-3 sm:col-span-3 sm:row-span-3 md:col-span-2 md:row-span-3",
  "col-span-2 row-span-3 sm:col-span-3 sm:row-span-3 md:col-span-2 md:row-span-3",
];

const ordered: Omit<MediaItemType, "span">[] = [
  { id: 1, type: "video", title: "Live tandoor", desc: "650°C clay oven, fired since 2010.", url: "/video/live-tandoor.mp4" },
  { id: 2, type: "video", title: "In our kitchen", desc: "Fresh, made to order — every day.", url: "/video/hero-clip.mp4" },
];

const mediaItems: MediaItemType[] = ordered.map((item, i) => ({
  ...item,
  span: SPANS[i] ?? SPANS[SPANS.length - 1]!,
}));

export function BentoHero() {
  return (
    <section
      className="relative overflow-hidden pt-28 pb-14 lg:pt-32"
      style={{ backgroundColor: luxe.bg }}
    >
      <p
        className="text-center text-[10px] uppercase tracking-[0.34em]"
        style={{ color: luxe.gold }}
      >
        Nepali &amp; Himalayan Restaurant · Oakland
      </p>

      <InteractiveBentoGallery
        mediaItems={mediaItems}
        title="Annapurna"
        description="A Nepali & Himalayan restaurant in Oakland — momos, live tandoor, and slow-cooked biryani, by the family that has run the kitchen since 2010. Drag a tile, tap to open."
      />

      <div className="mt-2 px-6">
        <OrderCTA align="center" />
      </div>
    </section>
  );
}
