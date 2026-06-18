import type { Metadata } from "next";
import { Users, Utensils, Phone } from "lucide-react";
import { CateringForm } from "@/components/catering/catering-form";

export const metadata: Metadata = {
  title: "Catering — Nepali & Himalayan in Oakland",
  description:
    "Nepali & Himalayan catering in Oakland & the East Bay from Annapurna. Momos, butter chicken, biryani, and tandoori for parties, offices, and events. Request a quote.",
  alternates: { canonical: "/catering" },
};

export default function CateringPage() {
  return (
    <div className="min-h-screen">
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
              Catering for Your Event
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Bring Annapurna&apos;s Nepali &amp; Himalayan kitchen to your party, office, or
              celebration anywhere in Oakland and the East Bay. Tell us about your event and
              we&apos;ll send a quote.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" /> Parties &amp; offices, any size
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Utensils className="h-4 w-4 text-primary" /> Momos · biryani · tandoori
            </div>
            <a href="tel:+15102509696" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Phone className="h-4 w-4 text-primary" /> (510) 250-9696
            </a>
          </div>

          <div className="mt-10 rounded-2xl border border-input bg-card p-6 sm:p-8">
            <CateringForm />
          </div>
        </div>
      </section>
    </div>
  );
}
