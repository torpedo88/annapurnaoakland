import type { Metadata } from "next";
import { MapPin, Clock, Phone } from "lucide-react";
import { ReservationForm } from "@/components/reservations/reservation-form";

export const metadata: Metadata = {
  title: "Reservations — Book a Table",
  description:
    "Reserve a table at Annapurna, the family-run Indian & Nepalese restaurant at 948 Clay Street in downtown Oakland. Open Mon–Sat. Walk-ins and groups welcome.",
  alternates: { canonical: "/reservations" },
};

export default function ReservationsPage() {
  return (
    <div className="min-h-screen">
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
              Reserve a Table in Oakland
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Join us for Indian &amp; Nepalese cooking at Annapurna in downtown Oakland.
              Request a table below and we&apos;ll confirm by phone.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" /> Mon–Sat · 11:00 AM–9:30 PM
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> 948 Clay Street, Oakland
            </div>
            <a href="tel:+15102509696" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Phone className="h-4 w-4 text-primary" /> (510) 250-9696
            </a>
          </div>

          <div className="mt-10 rounded-2xl border border-input bg-card p-6 sm:p-8">
            <ReservationForm />
          </div>
        </div>
      </section>
    </div>
  );
}
