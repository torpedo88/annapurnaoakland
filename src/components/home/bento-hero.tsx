"use client";

import { menu } from "@/data/menu";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "@/components/home/luxe/order-cta";
import InteractiveBentoGallery, {
  type MediaItemType,
} from "@/components/ui/interactive-bento-gallery";

// Bento layout spans, ordered. Position 2 (wide) is reserved for the tandoor video.
const SPANS = [
  "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
  "md:col-span-2 md:row-span-2 col-span-1 sm:col-span-2 sm:row-span-2",
  "md:col-span-1 md:row-span-3 sm:col-span-2 sm:row-span-2",
  "md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2",
  "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
  "md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2",
  "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
];

// Dishes pulled from the live menu so titles/images/descriptions stay in sync.
const DISH_IDS = [
  "chicken-dish-chicken-nauni-butter-chicken",
  "appetizer-chicken-momo",
  "biryani-lamb-biryani",
  "vegetarian-dish-palak-paneer",
  "tandoori-dish-chicken-tandoori-tikka",
  "appetizer-chicken-jhol-momo",
];

const dish = (id: string) => menu.find((m) => m.id === id);

// Build gallery items: 3 dishes, the live-tandoor video at slot 2, then 3 more dishes.
const dishItems = DISH_IDS.map((id) => dish(id)).filter(
  (m): m is NonNullable<typeof m> => Boolean(m),
);

const videoItem: Omit<MediaItemType, "span"> = {
  id: 999,
  type: "video",
  title: "Live tandoor",
  desc: "650°C clay oven, fired since 2010.",
  url: "/video/live-tandoor.mp4",
};

const ordered: Omit<MediaItemType, "span">[] = [
  ...dishItems.slice(0, 1).map((m, i) => ({
    id: i + 1,
    type: "image",
    title: m.name,
    desc: m.description,
    url: m.image,
  })),
  videoItem,
  ...dishItems.slice(1).map((m, i) => ({
    id: i + 2,
    type: "image",
    title: m.name,
    desc: m.description,
    url: m.image,
  })),
];

const mediaItems: MediaItemType[] = ordered
  .slice(0, SPANS.length)
  .map((item, i) => ({ ...item, span: SPANS[i] ?? SPANS[SPANS.length - 1]! }));

export function BentoHero() {
  return (
    <section
      className="relative overflow-hidden pt-28 pb-14 lg:pt-32"
      style={{ backgroundColor: luxe.bg }}
    >
      {/* Eyebrow */}
      <p
        className="text-center text-[10px] uppercase tracking-[0.34em]"
        style={{ color: luxe.gold }}
      >
        A Himalayan Kitchen · Oakland
      </p>

      <InteractiveBentoGallery
        mediaItems={mediaItems}
        title="Annapurna"
        description="Momo, live tandoor, and slow-cooked biryani — by the family that has run the kitchen since 2010. Drag a dish, tap to plate it."
      />

      {/* Order CTA */}
      <div className="mt-2 px-6">
        <OrderCTA align="center" />
      </div>
    </section>
  );
}
