import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story \u2014 Annapurna",
  description:
    "Learn about the family story behind Annapurna, Oakland\u2019s authentic Nepali-Indian restaurant \u2014 from the Himalayan mountains to your table.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
            Our Story
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From the peaks of the Himalayas to the heart of Oakland \u2014 a
            family&apos;s journey, one dish at a time.
          </p>
        </div>
      </section>

      {/* Image placeholder */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="h-72 w-full rounded-2xl bg-gradient-to-br from-amber-900 via-primary-dark to-secondary flex items-center justify-center sm:h-96">
          <span className="font-serif text-2xl font-bold text-white/70">
            Annapurna Restaurant
          </span>
        </div>
      </div>

      {/* Story sections */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16 space-y-14">
        {/* Section 1 */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Named After the Mountains
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Annapurna \u2014 meaning &ldquo;goddess of the harvest&rdquo; or &ldquo;full of food&rdquo; in
            Sanskrit \u2014 is the name of one of the most majestic mountain ranges
            in Nepal. It is a name that conjures abundance, nourishment, and
            the sacred bond between the land and the people who live upon it.
            When our family chose this name for our restaurant, it was not just
            a tribute to the mountains we called home \u2014 it was a promise to
            bring that same spirit of generosity and abundance to every plate we
            serve.
          </p>
        </section>

        <Separator />

        {/* Section 2 */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            From Nepal to Oakland
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Our family emigrated from the Kathmandu Valley in Nepal, carrying
            little more than memories of home-cooked feasts and a suitcase full
            of spices. When we arrived in the Bay Area, we found a community
            hungry for the bold, layered flavors of the Subcontinent \u2014 but few
            places that truly honored the Nepali side of that tradition. Momos
            steamed just so, dal bhat that tastes like it was made by a
            grandmother, fermented greens and achar that take you straight to a
            hillside kitchen. We opened Annapurna to fill that gap, and to
            create a home away from home for Nepali and South Asian families
            across the East Bay.
          </p>
        </section>

        <Separator />

        {/* Section 3 */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Our Kitchen, Your Table
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Everything we serve is made from scratch, every day. Our tandoor oven
            runs from early morning; our sauces are slow-cooked in the old way,
            never rushed. We source our produce from local Bay Area farms and
            import our whole spices directly from Nepal and Northern India to
            ensure authenticity in every bite. We believe food is medicine, food
            is memory, and food is how we tell the people we love that they
            matter. Pull up a chair \u2014 this table is for everyone.
          </p>
        </section>

        <Separator />

        {/* Contact CTA */}
        <section className="rounded-2xl bg-surface p-8 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Come Visit Us
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Address</p>
                <p className="text-sm text-muted-foreground">948 Clay Street</p>
                <p className="text-sm text-muted-foreground">Oakland, CA 94607</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Hours</p>
                <p className="text-sm text-muted-foreground">Open Daily</p>
                <p className="text-sm text-muted-foreground">11:00 AM \u2013 9:30 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <a
                  href="tel:+15102509696"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  (510) 250-9696
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/reservations">Reserve a Table</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/menu">View Menu</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
