import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StorySection() {
  return (
    <section className="bg-surface py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          {/* Image placeholder */}
          <div className="h-80 w-full rounded-xl bg-gradient-to-br from-amber-800 to-primary-dark flex items-center justify-center lg:h-[420px]">
            <span className="font-serif text-2xl font-bold text-white/70">
              Annapurna Kitchen
            </span>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-6">
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              From the Himalayas to Oakland
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Named after the sacred Himalayan mountain range in Nepal, Annapurna
              was born from a family&apos;s dream to share the rich culinary traditions
              of Nepal and Northern India with the Bay Area. Our recipes have been
              passed down through generations &mdash; each dish carries the warmth,
              spice, and soul of home.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Since opening our doors in Oakland, we have welcomed thousands of
              guests to our table. Whether you&apos;re discovering momo for the first
              time or returning for your weekly tikka masala, you&apos;re family here.
              Every meal is cooked fresh, with ingredients sourced locally and
              spices imported directly from the Subcontinent.
            </p>
            <Button variant="outline" className="w-fit" render={<Link href="/about" />}>
              Read Our Story
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
