"use client";

import { motion } from "motion/react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import { luxe } from "@/lib/theme";

const testimonials: Testimonial[] = [
  {
    text: "Best momos in the East Bay — pillowy, juicy, and the achar has the perfect kick. We order every week.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Priya N.",
    role: "Oakland, CA",
  },
  {
    text: "The butter chicken is unreal and the naan comes straight from the tandoor. Pickup was ready right on time.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Marcus T.",
    role: "Lake Merritt",
  },
  {
    text: "Family-run and you can taste it. The lamb biryani is layered and fragrant — comfort food done right.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Sofia R.",
    role: "Regular since 2019",
  },
  {
    text: "Delivery showed up hot and fast. Palak paneer and garlic naan are our go-to after a long day.",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
    name: "David K.",
    role: "Jack London Square",
  },
  {
    text: "Spice levels are spot on — asked for hot and they delivered. The chili momo is dangerously good.",
    image: "https://randomuser.me/api/portraits/women/21.jpg",
    name: "Aisha M.",
    role: "Downtown Oakland",
  },
  {
    text: "Catered our office lunch and everyone raved. Half trays of tikka and biryani disappeared instantly.",
    image: "https://randomuser.me/api/portraits/men/76.jpg",
    name: "Greg P.",
    role: "Office manager",
  },
  {
    text: "Authentic Himalayan flavors you don't find anywhere else nearby. The thakali set is a must-try.",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    name: "Lhamo D.",
    role: "Berkeley, CA",
  },
  {
    text: "Online ordering is so smooth — tracked my order the whole way. Tandoori chicken was perfectly charred.",
    image: "https://randomuser.me/api/portraits/men/91.jpg",
    name: "Ryan C.",
    role: "Temescal",
  },
  {
    text: "Cozy spot, warm people, incredible food. Ten minutes from BART and worth every step.",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    name: "Hannah L.",
    role: "Alameda, CA",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function Testimonials() {
  return (
    <section className="py-20 relative" style={{ borderTop: `1px solid ${luxe.line}` }}>
      <div className="container z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.34em]" style={{ color: luxe.gold }}>
            Loved in Oakland
          </p>
          <h2
            className="mt-5"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(1.8rem, 5vw, 3rem)",
              color: luxe.ink,
            }}
          >
            What our guests say.
          </h2>
          <p className="mt-4 text-sm" style={{ color: luxe.muted }}>
            From momo runs to office catering — here&apos;s what the neighborhood thinks.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-12 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[720px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}
