import { Clock, MapPin, Phone } from "lucide-react";

export function InfoSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Info */}
          <div className="flex flex-col gap-8">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Visit Us
            </h2>

            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Hours</p>
                <p className="text-muted-foreground">Open Daily</p>
                <p className="text-muted-foreground">11:00 AM – 9:30 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Address</p>
                <p className="text-muted-foreground">948 Clay Street</p>
                <p className="text-muted-foreground">Oakland, CA 94607</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Phone</p>
                <a
                  href="tel:+15102509696"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  (510) 250-9696
                </a>
              </div>
            </div>
          </div>

          {/* Google Maps */}
          <div className="overflow-hidden rounded-xl">
            <iframe
              title="Annapurna Restaurant location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.2!2d-122.2749!3d37.8044!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ4JzE2LjAiTiAxMjLCsDE2JzI5LjYiVw!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
