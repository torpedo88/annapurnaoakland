"use client";

import { menu } from "@/data/menu";
import { luxe } from "@/lib/theme";
import { OrderCTA } from "@/components/home/luxe/order-cta";
import InteractiveBentoGallery, {
  type MediaItemType,
} from "@/components/ui/interactive-bento-gallery";

// Bento layout spans, ordered. Position 2 (wide) is reserved for the tandoor video.
// Base (no-prefix) spans are the MOBILE 2-col mosaic — without them tiles collapse
// to a single 60px row and the hero images become unreadable slivers.
const SPANS = [
  "col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-3",
  "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2",
  "col-span-1 row-span-3 sm:col-span-2 sm:row-span-2 md:col-span-1 md:row-span-3",
  "col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 md:col-span-2 md:row-span-2",
  "col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-3",
  "col-span-1 row-span-3 sm:col-span-1 sm:row-span-2 md:col-span-2 md:row-span-2",
  "col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-3",
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

const tandoorVideo: Omit<MediaItemType, "span"> = {
  id: 901,
  type: "video",
  title: "Live tandoor",
  desc: "650°C clay oven, fired since 2010.",
  url: "/video/live-tandoor.mp4",
};

const kitchenVideo: Omit<MediaItemType, "span"> = {
  id: 902,
  type: "video",
  title: "Annapurna, Oakland",
  desc: "Dine in · pickup · delivery.",
  url: "/video/hero-clip.mp4",
};

const dishMedia: Omit<MediaItemType, "span">[] = dishItems.map((m, i) => ({
  id: i + 1,
  type: "image",
  title: m.name,
  desc: m.description,
  url: m.image,
}));

// 7 tiles: 5 dishes + 2 videos. The portrait kitchen clip leads top-left in a
// tall slot (SPANS[0] is row-span-3 on desktop) so it's seen first.
const ordered: Omit<MediaItemType, "span">[] = [
  kitchenVideo,
  dishMedia[0],
  tandoorVideo,
  dishMedia[1],
  dishMedia[2],
  dishMedia[3],
  dishMedia[4],
].filter(Boolean) as Omit<MediaItemType, "span">[];

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
