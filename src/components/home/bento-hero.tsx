"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { menu } from "@/data/menu";
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
    <section className="relative overflow-hidden bg-[#FDF4E4] pt-28 pb-12 lg:pt-32">
      {/* Eyebrow, in brand script */}
      <p
        className="text-center text-2xl lg:text-3xl"
        style={{ color: "#F2A545", fontFamily: "var(--font-caveat), cursive" }}
      >
        a Himalayan kitchen in Oakland.
      </p>

      <InteractiveBentoGallery
        mediaItems={mediaItems}
        title="Warm food. Served by family."
        description="Momos, live tandoor, and slow-cooked biryani — by the family that's run the kitchen since 2010. Drag a dish, tap to plate it."
      />

      {/* Order CTA — preserved from the old hero so conversion isn't lost */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 px-6">
        <Link
          href="/menu"
          className="group inline-flex items-center gap-3 rounded-full bg-[#2B1E16] text-[#FDF4E4] pl-7 pr-2 py-2 text-base font-semibold shadow-2xl shadow-[#2B1E16]/30 hover:bg-[#C85A3C] transition"
        >
          Start an order
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FDF4E4] text-[#2B1E16] transition group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link
          href="/menu"
          className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2B1E16]/70 hover:text-[#C85A3C] transition"
        >
          View the full menu
        </Link>
      </div>
    </section>
  );
}
