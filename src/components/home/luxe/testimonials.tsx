"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import { luxe } from "@/lib/theme";

const GRUBHUB_URL =
  "https://www.grubhub.com/restaurant/annapurna-restaurant--bar-948-clay-st-oakland/333338";
const GRUBHUB_COUNT = 1500;

type Review = { rating: number; text: string; name: string; photo: string; when: string };
type ReviewsPayload = { rating: number | null; total: number | null; mapsUri: string | null; reviews: Review[] };

function StatBadge({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
      style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#F3E9D6" }}
    >
      {children}
    </a>
  );
}

export function Testimonials() {
  const [data, setData] = useState<ReviewsPayload | null>(null);

  useEffect(() => {
    let on = true;
    fetch("/api/reviews")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ReviewsPayload | null) => { if (on) setData(d); })
      .catch(() => { /* hide on failure */ });
    return () => { on = false; };
  }, []);

  if (!data || data.reviews.length === 0) return null;

  const toTestimonial = (r: Review): Testimonial => ({
    text: r.text.length > 240 ? r.text.slice(0, 237) + "…" : r.text,
    image: r.photo,
    name: r.name,
    role: `${"★".repeat(Math.round(r.rating))} · ${r.when}`,
  });

  const cols: Testimonial[][] = [[], [], []];
  data.reviews.forEach((r, i) => cols[i % 3]!.push(toTestimonial(r)));

  return (
    <section className="py-24 lg:py-28 relative" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="container z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[600px] mx-auto text-center"
        >
          <div className="mx-auto mb-6 h-px w-9" style={{ backgroundColor: luxe.gold }} />
          <p className="text-[10px] uppercase tracking-[0.34em]" style={{ color: luxe.gold }}>
            Loved in Oakland
          </p>
          <h2
            className="mt-5"
            style={{
              fontFamily: "var(--font-serif-display), Georgia, serif",
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              color: luxe.ink,
            }}
          >
            What our guests say.
          </h2>

          {/* Live aggregates */}
          <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
            <StatBadge href={data.mapsUri ?? "https://www.google.com/maps"}>
              <span style={{ color: "#C9A24B", fontWeight: 700 }}>{data.rating ?? "4.3"}</span>
              <Star className="h-4 w-4 fill-current" style={{ color: "#C9A24B" }} aria-hidden="true" />
              <span style={{ color: "#8A8276" }}>{data.total ?? 526} Google reviews</span>
            </StatBadge>
            <StatBadge href={GRUBHUB_URL}>
              <span style={{ color: "#F3E9D6", fontWeight: 600 }}>Grubhub</span>
              <span style={{ color: "#8A8276" }}>{GRUBHUB_COUNT.toLocaleString()}+ reviews</span>
            </StatBadge>
          </div>
        </motion.div>

        <div className="flex justify-center gap-6 mt-12 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[720px] overflow-hidden">
          <TestimonialsColumn testimonials={cols[0]!} duration={16} />
          <TestimonialsColumn testimonials={cols[1]!} className="hidden md:block" duration={20} />
          <TestimonialsColumn testimonials={cols[2]!} className="hidden lg:block" duration={18} />
        </div>

        <p className="text-center mt-8 text-xs" style={{ color: "#8A8276" }}>
          Reviews from Google ·{" "}
          <a href={data.mapsUri ?? "#"} target="_blank" rel="noopener noreferrer" style={{ color: "#C9A24B" }}>
            read all {data.total ?? 526} on Google
          </a>
        </p>
      </div>
    </section>
  );
}
