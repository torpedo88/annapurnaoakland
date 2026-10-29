import type { Metadata } from "next";
import { Users, Utensils, Phone } from "lucide-react";
import { CateringForm } from "@/components/catering/catering-form";

export const metadata: Metadata = {
  title: "Indian Catering in Oakland — Parties, Offices & Events",
  description:
    "Indian & Nepalese catering in Oakland and the East Bay from Annapurna, 948 Clay Street. Momos, butter chicken, biryani and tandoori for office lunches, parties and events. Tell us the date and headcount for a quote.",
  alternates: { canonical: "/catering" },
  // Set per page: Next merges metadata shallowly, so without this the page
  // inherits the root's og:url and tells social and search crawlers it is the homepage.
  openGraph: {
    url: "https://annapurnaoakland.com/catering",
    title: "Indian Catering in Oakland — Annapurna",
    description: "Indian & Nepalese catering for office lunches, parties and events in Oakland and the East Bay.",
    images: [{ url: "/images/annapurna-logo.png", width: 1200, height: 1200, alt: "Annapurna Restaurant & Bar" }],
  },
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
              Bring Annapurna&apos;s Indian &amp; Nepalese kitchen to your party, office, or
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
