import Link from "next/link";
import { Cormorant_Garamond, Manrope, DM_Mono } from "next/font/google";

const display = Cormorant_Garamond({
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});
const body = Manrope({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-manrope-sp",
  display: "swap",
});
const mono = DM_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-dmmono-sp",
  display: "swap",
});

const tastingMenu = [
  {
    n: "I.",
    kind: "Opening",
    name: "Momo, Jhol",
    notes: "Hand-pleated. Himalayan sesame broth. Sichuan pepper bloom.",
    price: "16",
  },
  {
    n: "II.",
    kind: "Vegetable",
    name: "Saag, Aged Paneer",
    notes: "Three-day spinach reduction. House-set paneer, twelve-week aged.",
    price: "18",
  },
  {
    n: "III.",
    kind: "Tandoor",
    name: "Lamb Raan",
    notes: "Forty-eight hour marination. Bone-in. Clay oven. Smoked salt crust.",
    price: "38",
  },
  {
    n: "IV.",
    kind: "Rice",
    name: "Dum Biryani",
    notes: "Basmati, saffron, rosewater. Sealed in dough, opened at table.",
    price: "26",
  },
  {
    n: "V.",
    kind: "Closing",
    name: "Kheer, Pistachio",
    notes: "Reduced overnight. Cardamom. Silver leaf.",
    price: "12",
  },
];

export default function ShadowPeakPage() {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen`}
      style={{
        backgroundColor: "#0A0908",
        color: "#EEE8DB",
        fontFamily: "var(--font-manrope-sp), sans-serif",
      }}
    >
      {/* Subtle gold grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* ─── Nav ────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-30 backdrop-blur-md bg-[#0A0908]/60 border-b border-[#EEE8DB]/10">
        <div className="mx-auto max-w-[1400px] px-8 lg:px-12 py-5 flex items-center justify-between">
          <Link
            href="/preview"
            className={`${mono.className} text-[10px] uppercase tracking-[0.35em] opacity-60 hover:opacity-100 transition`}
          >
            ← Designs
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              href="/preview/shadow-peak"
              className={`${display.className} text-2xl tracking-[0.2em] font-light`}
              style={{ color: "#EEE8DB" }}
            >
              ANNAPURNA
            </Link>
          </div>

          <div className={`${mono.className} hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.35em]`}>
            <a href="#menu" className="opacity-60 hover:opacity-100 transition">Menu</a>
            <a href="#philosophy" className="opacity-60 hover:opacity-100 transition">Philosophy</a>
            <a href="#visit" className="opacity-60 hover:opacity-100 transition">Visit</a>
            <Link
              href="/reservations"
              className="px-4 py-1.5 border border-[#C9A64B] text-[#C9A64B] hover:bg-[#C9A64B] hover:text-[#0A0908] transition"
            >
              Reserve
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Cinematic hero ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end">
        {/* BG Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=2000&q=95&auto=format&fit=crop"
            alt="Dimly lit tandoor and dish"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,9,8,0.88) 0%, rgba(10,9,8,0.55) 45%, rgba(10,9,8,0.95) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-[1400px] w-full px-8 lg:px-12 pb-20 pt-40 lg:pt-0 lg:pb-28">
          <p
            className={`${mono.className} text-[10px] uppercase tracking-[0.5em] mb-8`}
            style={{ color: "#C9A64B" }}
          >
            Est. MMX · Oakland, California
          </p>
          <h1
            className={`${display.className} text-[clamp(4rem,14vw,13rem)] leading-[0.82] font-light tracking-[-0.02em]`}
          >
            <span className="block">Annapurna</span>
            <span className="block italic" style={{ color: "#C9A64B" }}>
              after dark.
            </span>
          </h1>
          <div className="mt-12 flex items-end justify-between flex-wrap gap-8">
            <p
              className={`${display.className} italic text-2xl md:text-3xl max-w-xl leading-snug font-light text-[#EEE8DB]/85`}
            >
              A five-course tasting drawn from one family&apos;s Himalayan memory — served by
              reservation, seven nights a week.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/reservations"
                className={`${mono.className} inline-flex items-center gap-3 bg-[#C9A64B] text-[#0A0908] px-10 py-5 text-[11px] uppercase tracking-[0.35em] hover:bg-[#EEE8DB] transition`}
              >
                Reserve a table
                <span>→</span>
              </Link>
              <Link
                href="/menu"
                className={`${mono.className} inline-flex items-center gap-3 border border-[#EEE8DB]/40 px-10 py-5 text-[11px] uppercase tracking-[0.35em] hover:border-[#C9A64B] hover:text-[#C9A64B] transition`}
              >
                Order to take home
              </Link>
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <div className={`${mono.className} absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.5em] opacity-40`}>
          ↓ Scroll
        </div>
      </section>

      {/* ─── Menu ───────────────────────────────────────────── */}
      <section id="menu" className="py-32 lg:py-44">
        <div className="mx-auto max-w-[1200px] px-8 lg:px-12">
          <div className="flex items-start justify-between mb-20 flex-wrap gap-6">
            <div>
              <p className={`${mono.className} text-[10px] uppercase tracking-[0.5em] mb-6`} style={{ color: "#C9A64B" }}>
                The Tasting
              </p>
              <h2 className={`${display.className} text-6xl md:text-8xl leading-[0.9] font-light`}>
                Five courses,
                <br />
                <span className="italic">four hours,</span>
                <br />
                one table.
              </h2>
            </div>
            <div className="max-w-sm">
              <p className="text-[#EEE8DB]/70 leading-relaxed">
                The à la carte menu remains. This is a new thing. An evening designed by the chef,
                paced by the kitchen, priced as one. Optional pairing from our Himalayan wine
                cellar.
              </p>
              <p className={`${mono.className} mt-6 text-[11px] uppercase tracking-[0.3em]`} style={{ color: "#C9A64B" }}>
                $110 per guest · pairings $65
              </p>
            </div>
          </div>

          <div className="border-t border-[#EEE8DB]/15">
            {tastingMenu.map((course) => (
              <div
                key={course.n}
                className="group grid md:grid-cols-12 gap-6 py-10 border-b border-[#EEE8DB]/15 items-baseline"
              >
                <div className="md:col-span-1">
                  <span
                    className={`${display.className} text-4xl italic font-light`}
                    style={{ color: "#C9A64B" }}
                  >
                    {course.n}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className={`${mono.className} text-[10px] uppercase tracking-[0.35em] text-[#EEE8DB]/55`}>
                    {course.kind}
                  </span>
                </div>
                <div className="md:col-span-6">
                  <h3 className={`${display.className} text-4xl md:text-5xl font-light leading-[0.95] group-hover:italic transition-all`}>
                    {course.name}
                  </h3>
                  <p className="mt-3 text-[#EEE8DB]/65 leading-relaxed max-w-md">{course.notes}</p>
                </div>
                <div className="md:col-span-3 md:text-right">
                  <span className={`${display.className} text-3xl font-light`} style={{ color: "#C9A64B" }}>
                    ${course.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap justify-between items-center gap-4">
            <p className={`${mono.className} text-[11px] uppercase tracking-[0.3em] text-[#EEE8DB]/55`}>
              Vegetarian & pescatarian menus available on request
            </p>
            <Link
              href="/menu"
              className={`${mono.className} inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] hover:text-[#C9A64B] transition`}
            >
              The full à la carte →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Philosophy ─────────────────────────────────────── */}
      <section id="philosophy" className="relative py-32 lg:py-44 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(201,166,75,0.08), transparent 50%), radial-gradient(circle at 80% 70%, rgba(110,29,46,0.18), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-[1100px] px-8 lg:px-12">
          <p className={`${mono.className} text-[10px] uppercase tracking-[0.5em] mb-10`} style={{ color: "#C9A64B" }}>
            Philosophy
          </p>
          <blockquote className={`${display.className} text-4xl md:text-6xl lg:text-7xl font-light italic leading-[1.05]`}>
            <span style={{ color: "#C9A64B" }} className="not-italic">&mdash;&nbsp;</span>
            There is one recipe in our kitchen older than the restaurant, older than the
            building, older than most of Oakland. We do not adapt it. We cook it, and we wait
            for the city to catch up.
          </blockquote>
          <div className="mt-16 flex items-center justify-between flex-wrap gap-6 border-t border-[#EEE8DB]/15 pt-6">
            <div>
              <p className={`${display.className} text-2xl font-light`}>Safal Basnet</p>
              <p className={`${mono.className} text-[10px] uppercase tracking-[0.35em] text-[#EEE8DB]/55 mt-1`}>
                Chef &amp; Owner · Kathmandu → Oakland
              </p>
            </div>
            <div className={`${mono.className} text-[10px] uppercase tracking-[0.35em] text-[#EEE8DB]/45 text-right`}>
              Third generation
              <br />
              One recipe book
            </div>
          </div>
        </div>
      </section>

      {/* ─── Reservation card ───────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-[1100px] px-8 lg:px-12">
          <div className="relative overflow-hidden border border-[#EEE8DB]/15">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=2000&q=90&auto=format&fit=crop"
              alt="Dining table"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(10,9,8,0.95) 0%, rgba(10,9,8,0.75) 55%, rgba(10,9,8,0.4) 100%)",
              }}
            />
            <div className="relative p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className={`${mono.className} text-[10px] uppercase tracking-[0.5em] mb-6`} style={{ color: "#C9A64B" }}>
                  Book the table
                </p>
                <h2 className={`${display.className} text-5xl md:text-6xl font-light leading-[0.95]`}>
                  Two seatings
                  <br />
                  <span className="italic">nightly.</span>
                </h2>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between border-b border-[#EEE8DB]/15 pb-4">
                  <span className={`${mono.className} text-[11px] uppercase tracking-[0.3em]`}>First seating</span>
                  <span className={`${display.className} text-xl`}>5:30 PM</span>
                </div>
                <div className="flex justify-between border-b border-[#EEE8DB]/15 pb-4">
                  <span className={`${mono.className} text-[11px] uppercase tracking-[0.3em]`}>Second seating</span>
                  <span className={`${display.className} text-xl`}>8:15 PM</span>
                </div>
                <div className="flex justify-between border-b border-[#EEE8DB]/15 pb-4">
                  <span className={`${mono.className} text-[11px] uppercase tracking-[0.3em]`}>Bar</span>
                  <span className={`${display.className} text-xl`}>5:00 – 22:00</span>
                </div>
                <Link
                  href="/reservations"
                  className={`${mono.className} inline-flex items-center gap-3 bg-[#C9A64B] text-[#0A0908] px-8 py-4 text-[11px] uppercase tracking-[0.35em] hover:bg-[#EEE8DB] transition`}
                >
                  Check availability →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Visit ─────────────────────────────────────────── */}
      <section id="visit" className="py-32">
        <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
          <div className="grid lg:grid-cols-4 gap-10 border-t border-[#EEE8DB]/15 pt-12">
            <div className="lg:col-span-1">
              <p className={`${mono.className} text-[10px] uppercase tracking-[0.5em]`} style={{ color: "#C9A64B" }}>
                Visit
              </p>
            </div>
            <div>
              <h4 className={`${display.className} text-2xl italic font-light mb-3`}>Address</h4>
              <p className="text-[#EEE8DB]/75 leading-relaxed">
                948 Clay Street
                <br />
                Oakland, CA 94607
              </p>
            </div>
            <div>
              <h4 className={`${display.className} text-2xl italic font-light mb-3`}>Hours</h4>
              <p className="text-[#EEE8DB]/75 leading-relaxed">
                Nightly · 17:00 — 22:00
                <br />
                Takeout · 11:00 — 21:30
              </p>
            </div>
            <div>
              <h4 className={`${display.className} text-2xl italic font-light mb-3`}>Contact</h4>
              <p className="text-[#EEE8DB]/75 leading-relaxed">
                <a href="tel:+15102509696" className="hover:text-[#C9A64B] transition">
                  (510) 250-9696
                </a>
                <br />
                <a href="mailto:reserve@annapurnaoakland.com" className="hover:text-[#C9A64B] transition">
                  reserve@annapurnaoakland.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-[#EEE8DB]/10 py-14">
        <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
          <div
            className={`${display.className} text-center text-[clamp(3rem,10vw,10rem)] font-light tracking-[-0.02em] leading-[0.85]`}
            style={{ color: "#EEE8DB" }}
          >
            ANN<span style={{ color: "#C9A64B" }} className="italic">a</span>PURNA
          </div>
          <p className={`${mono.className} mt-8 text-center text-[10px] uppercase tracking-[0.5em] text-[#EEE8DB]/40`}>
            MMX &middot; Oakland &middot; California
          </p>
          <div className={`${mono.className} mt-12 flex flex-col sm:flex-row justify-between gap-4 text-[10px] uppercase tracking-[0.35em] text-[#EEE8DB]/45`}>
            <span>© 2026 · Basnet Family Kitchen LLC</span>
            <span>
              <Link href="/preview" className="hover:text-[#C9A64B] transition">
                Explore all designs →
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
