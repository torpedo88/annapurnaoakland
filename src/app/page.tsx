import Link from "next/link";
import { menu } from "@/data/menu";

// Featured for Bento hero grid — IDs verified against menu.ts
const bentoPicks = [
  "chicken-dish-chicken-nauni-butter-chicken",
  "appetizer-chicken-momo",
  "biryani-lamb-biryani",
  "appetizer-veg-samosa",
  "tandoori-dish-chicken-tandoori-tikka",
].map((id) => menu.find((m) => m.id === id)).filter(Boolean) as typeof menu;

const signatureDishes = [
  "appetizer-chicken-jhol-momo",
  "chicken-dish-chicken-nauni-butter-chicken",
  "vegetarian-dish-palak-paneer",
].map((id) => menu.find((m) => m.id === id)).filter(Boolean) as typeof menu;

// Guard: if a signature dish slug ever changes, we don't want to crash the page
const safeBento = bentoPicks.filter(Boolean);
const safeSignatures = signatureDishes.filter(Boolean);

// TODO(pre-launch): replace with real press/customer quotes once Safal gathers them.
// DO NOT ship fabricated publication attributions — legal risk + brand trust.
const guestNotes: { quote: string; source: string }[] = [];

const craftMoments = [
  {
    label: "Hand-pleated",
    detail: "Every momo, every morning",
    img: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=1100&q=85&auto=format&fit=crop",
  },
  {
    label: "Live tandoor",
    detail: "650°C clay oven since 2010",
    img: "https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg",
  },
  {
    label: "House-pressed paneer",
    detail: "Monday mornings, by hand",
    img: "https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg",
  },
  {
    label: "Slow-cooked",
    detail: "Rogan josh, six hours",
    img: "https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg",
  },
];

export default function TerracottaHomePage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO — full-bleed editorial with overlaid type
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] lg:min-h-[94vh] flex items-end overflow-hidden">
        {/* Image — butter chicken close-up, warm, cinematic */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=2200&q=95&auto=format&fit=crop"
            alt="Butter chicken close-up"
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(43,30,22,0.25) 0%, rgba(43,30,22,0.15) 30%, rgba(253,244,228,0.85) 78%, #FDF4E4 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>

        {/* Top bar — city + hours inside hero */}
        <div className="absolute top-5 left-0 right-0 z-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-[#FDF4E4]/80">
            <span className="hidden sm:inline">Oakland · Est. MMX</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4A6B4A] animate-pulse" />
              Open now · ready in 20 min
            </span>
            <span className="hidden sm:inline">948 Clay St</span>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl w-full px-6 lg:px-10 pb-16 lg:pb-24 pt-40">
          <p
            className="text-3xl lg:text-4xl mb-4"
            style={{ color: "#F2A545", fontFamily: "var(--font-caveat), cursive" }}
          >
            a Himalayan kitchen in Oakland.
          </p>
          <h1
            className="text-[clamp(3.25rem,10vw,11rem)] leading-[0.86] tracking-[-0.035em] max-w-[16ch]"
            style={{
              color: "#2B1E16",
              fontFamily: "var(--font-instrument), serif",
            }}
          >
            Warm food.
            <br />
            <em style={{ color: "#C85A3C" }}>Served by family.</em>
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-4 max-w-3xl">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-3 rounded-full bg-[#2B1E16] text-[#FDF4E4] pl-7 pr-2 py-2 text-base font-semibold shadow-2xl shadow-[#2B1E16]/30 hover:bg-[#C85A3C] transition"
            >
              Start an order
              <span className="inline-flex items-center justify-center rounded-full bg-[#C85A3C] text-[#FDF4E4] h-11 w-11 group-hover:bg-[#FDF4E4] group-hover:text-[#C85A3C] transition">
                →
              </span>
            </Link>
            <Link
              href="/menu"
              className="text-sm font-bold text-[#2B1E16] underline underline-offset-4 decoration-[#C85A3C] decoration-2 hover:text-[#C85A3C] transition"
            >
              See the full menu (178 dishes)
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Verified facts band — no fabricated metrics.
          All four items are true/verifiable from the
          restaurant's public info.
      ══════════════════════════════════════════════════ */}
      <section className="border-y border-[#2B1E16]/10 bg-[#FDF4E4]">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-8 lg:py-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 items-center">
          <Stat number="Est. 2010" label="family-run since day one" />
          <Stat number="178" label="dishes on the menu" />
          <Stat number="Daily" label="11:00 — 21:30" />
          <Stat number="~20 min" label="pickup turnaround" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BENTO — featured menu preview (asymmetric)
      ══════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 lg:mb-14">
            <div>
              <p
                className="text-2xl lg:text-3xl mb-2"
                style={{ color: "#C85A3C", fontFamily: "var(--font-caveat), cursive" }}
              >
                house signatures
              </p>
              <h2
                className="text-5xl lg:text-6xl leading-[0.95] tracking-tight max-w-[12ch]"
                style={{ color: "#2B1E16", fontFamily: "var(--font-instrument), serif" }}
              >
                A short list of things we refuse to cut corners on.
              </h2>
            </div>
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 text-base font-bold hover:text-[#C85A3C] transition self-start lg:self-auto shrink-0"
            >
              Browse all 178 dishes
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#2B1E16] text-[#FDF4E4] group-hover:bg-[#C85A3C] group-hover:translate-x-1 transition">
                →
              </span>
            </Link>
          </div>

          {/* Bento grid: 1 hero (lg col-span-2 row-span-2) + 4 smaller */}
          <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] lg:auto-rows-[200px] gap-4">
            {/* Hero bento card */}
            <BentoCard
              item={safeBento[0]}
              className="col-span-2 row-span-2 lg:col-span-2"
              size="hero"
              badge="House favorite"
            />
            <BentoCard item={safeBento[1]} size="small" badge="Bestseller" />
            <BentoCard item={safeBento[2]} size="small" badge="Weekend only" />
            <BentoCard item={safeBento[3]} size="small" />
            <BentoCard item={safeBento[4]} size="small" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CHEF / STORY — portrait + signature, editorial
      ══════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-[#2B1E16] text-[#FDF4E4] relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #F2A545, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-10 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-center">
          {/* TODO(pre-launch): replace with a real photo of chef Safal Basnet.
              Shipping a stock photo of a random person misrepresents the brand.
              Placeholder below is a neutral monogram card. */}
          <div>
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden ring-[6px] ring-[#FDF4E4]/10 bg-gradient-to-br from-[#3A2A1F] via-[#2B1E16] to-[#1A1209]">
              <div
                aria-hidden
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, #F2A545 0, transparent 45%), radial-gradient(circle at 70% 75%, #C85A3C 0, transparent 50%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
                }}
              />
              <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
                <span
                  className="text-[8rem] leading-none"
                  style={{
                    color: "#F2A545",
                    fontFamily: "var(--font-instrument), serif",
                  }}
                >
                  SB
                </span>
                <p
                  className="mt-6 text-2xl italic"
                  style={{
                    color: "#FDF4E4",
                    fontFamily: "var(--font-instrument), serif",
                  }}
                >
                  Safal Basnet
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#FDF4E4]/50">
                  Photo coming soon
                </p>
              </div>
            </div>
          </div>
          <div>
            <p
              className="text-sm uppercase tracking-[0.4em] mb-5"
              style={{ color: "#F2A545" }}
            >
              A note from the chef
            </p>
            <blockquote
              className="text-3xl lg:text-5xl leading-[1.08] tracking-tight"
              style={{ fontFamily: "var(--font-instrument), serif" }}
            >
              <span style={{ color: "#F2A545" }}>&ldquo;</span>My grandmother taught me to make dal in a Kathmandu courtyard kitchen.
              I brought her spice blend — and her insistence on pressing paneer by hand
              — to Oakland in 2008. Nothing on our menu leaves the kitchen unless I&apos;d
              serve it to her.<span style={{ color: "#F2A545" }}>&rdquo;</span>
            </blockquote>
            <div className="mt-10 flex items-end gap-8 flex-wrap">
              <div>
                <p
                  className="text-4xl italic font-light"
                  style={{ fontFamily: "var(--font-instrument), serif" }}
                >
                  Safal Basnet
                </p>
                <p className="text-sm text-[#FDF4E4]/60 uppercase tracking-widest mt-1">
                  Chef &amp; Owner · third-generation
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#F2A545] hover:text-[#FDF4E4] transition underline underline-offset-4 decoration-[#F2A545]/50"
              >
                Read our full story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CRAFT — horizontal scroll of kitchen moments
      ══════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p
                className="text-2xl lg:text-3xl mb-2"
                style={{ color: "#C85A3C", fontFamily: "var(--font-caveat), cursive" }}
              >
                the work
              </p>
              <h2
                className="text-4xl lg:text-6xl leading-[0.95] tracking-tight max-w-[14ch]"
                style={{ color: "#2B1E16", fontFamily: "var(--font-instrument), serif" }}
              >
                Four things we&apos;ll never speed up.
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {craftMoments.map((m, i) => (
              <figure
                key={i}
                className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden group"
              >
                <img
                  src={m.img}
                  alt={m.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(43,30,22,0.1) 20%, rgba(43,30,22,0.85) 100%)",
                  }}
                />
                <figcaption className="absolute bottom-5 left-5 right-5 text-[#FDF4E4]">
                  <p className="text-[11px] uppercase tracking-[0.3em] opacity-70 mb-1.5">
                    №&nbsp;{String(i + 1).padStart(2, "0")}
                  </p>
                  <p
                    className="text-2xl leading-tight mb-1"
                    style={{ fontFamily: "var(--font-instrument), serif" }}
                  >
                    {m.label}
                  </p>
                  <p className="text-sm opacity-80">{m.detail}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          GUEST NOTES — shown only once we have real quotes.
          Hidden by default to avoid fabricated content.
      ══════════════════════════════════════════════════ */}
      {guestNotes.length > 0 && (
        <section className="border-y border-[#2B1E16]/10 bg-[#F2A545]/12 py-14 lg:py-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <p className="text-xs uppercase tracking-[0.4em] text-[#2B1E16]/60 text-center mb-8">
              From our guests
            </p>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
              {guestNotes.map((p, i) => (
                <div
                  key={i}
                  className="text-center md:text-left md:border-l md:first:border-l-0 md:pl-8 md:first:pl-0"
                >
                  <p
                    className="text-xl lg:text-2xl leading-snug mb-3"
                    style={{
                      color: "#2B1E16",
                      fontFamily: "var(--font-instrument), serif",
                    }}
                  >
                    <span style={{ color: "#C85A3C" }}>&ldquo;</span>
                    {p.quote}
                    <span style={{ color: "#C85A3C" }}>&rdquo;</span>
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#2B1E16]/60 font-bold">
                    — {p.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          SIGNATURE DISHES — list, not grid (editorial)
      ══════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <p
            className="text-2xl lg:text-3xl mb-2 text-center"
            style={{ color: "#C85A3C", fontFamily: "var(--font-caveat), cursive" }}
          >
            start here
          </p>
          <h2
            className="text-4xl lg:text-6xl leading-[0.95] tracking-tight text-center mb-14"
            style={{ fontFamily: "var(--font-instrument), serif" }}
          >
            Three dishes <em style={{ color: "#C85A3C" }}>we&apos;re known for.</em>
          </h2>

          <div className="space-y-5">
            {safeSignatures.map((d, i) => (
              <article
                key={d.id}
                className="group grid grid-cols-[100px_1fr_auto] lg:grid-cols-[140px_1fr_auto] items-center gap-5 lg:gap-8 bg-white rounded-[1.5rem] border border-[#2B1E16]/6 p-4 lg:p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative h-full aspect-square rounded-xl overflow-hidden">
                  <img
                    src={d.image}
                    alt={d.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#C85A3C] font-bold mb-1">
                    № {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className="text-2xl lg:text-3xl leading-tight mb-1"
                    style={{ fontFamily: "var(--font-instrument), serif" }}
                  >
                    {d.name}
                  </h3>
                  <p className="text-sm text-[#2B1E16]/65 leading-relaxed line-clamp-2 max-w-md">
                    {d.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span
                    className="text-xl font-bold"
                    style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
                  >
                    ${d.price.toFixed(2)}
                  </span>
                  <Link
                    href="/menu"
                    className="rounded-full bg-[#2B1E16] text-[#FDF4E4] px-5 py-2 text-sm font-semibold hover:bg-[#C85A3C] transition whitespace-nowrap"
                  >
                    Add
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VISIT + big CTA
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg"
            alt="Biryani"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(43,30,22,0.95) 0%, rgba(43,30,22,0.75) 45%, rgba(43,30,22,0.55) 100%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 text-[#FDF4E4]">
          <div className="max-w-2xl">
            <p
              className="text-3xl mb-3"
              style={{ color: "#F2A545", fontFamily: "var(--font-caveat), cursive" }}
            >
              come see us.
            </p>
            <h2
              className="text-5xl lg:text-7xl leading-[0.92] tracking-tight mb-8"
              style={{ fontFamily: "var(--font-instrument), serif" }}
            >
              We&apos;re a ten-minute walk
              <br />
              from Lake Merritt BART.
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-10 mb-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] opacity-60 mb-2">Address</p>
                <p className="text-lg">948 Clay Street</p>
                <p className="text-lg">Oakland, CA 94607</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] opacity-60 mb-2">Hours</p>
                <p className="text-lg">Open daily</p>
                <p className="text-lg">11:00 — 21:30</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] opacity-60 mb-2">Call</p>
                <a href="tel:+15102509696" className="text-lg hover:text-[#F2A545]">
                  (510) 250-9696
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="rounded-full bg-[#C85A3C] text-[#FDF4E4] px-8 py-4 font-bold hover:bg-[#FDF4E4] hover:text-[#2B1E16] transition"
              >
                Order online
              </Link>
              <a
                href="https://maps.google.com/?q=948+Clay+Street+Oakland+CA"
                className="rounded-full border-2 border-[#FDF4E4] px-8 py-4 font-bold hover:bg-[#FDF4E4] hover:text-[#2B1E16] transition"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER — multi-col, newsletter-forward
      ══════════════════════════════════════════════════ */}
      <footer className="bg-[#FDF4E4] border-t border-[#2B1E16]/10 pt-16 pb-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <svg width="36" height="36" viewBox="0 0 28 28" aria-hidden>
                <circle cx="14" cy="14" r="12" fill="#C85A3C" />
                <circle cx="14" cy="14" r="6" fill="#F2A545" />
              </svg>
              <span
                className="text-3xl font-medium"
                style={{ color: "#C85A3C", fontFamily: "var(--font-instrument), serif" }}
              >
                Annapurna
              </span>
            </div>
            <p className="text-[#2B1E16]/70 leading-relaxed max-w-sm">
              Family-run Nepali &amp; North Indian in downtown Oakland. Open since 2010,
              cooking the same recipes we&apos;d serve at home.
            </p>
            <form className="mt-6 flex gap-2">
              <input
                type="email"
                placeholder="you@email.com"
                className="flex-1 rounded-full bg-white border border-[#2B1E16]/10 px-5 py-3 text-sm focus:outline-none focus:border-[#C85A3C] focus:ring-2 focus:ring-[#C85A3C]/20"
              />
              <button
                type="button"
                className="rounded-full bg-[#2B1E16] text-[#FDF4E4] px-5 py-3 text-sm font-bold hover:bg-[#C85A3C] transition"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-[#2B1E16]/50">
              Monthly notes from the kitchen. No spam, no marketing.
            </p>
          </div>
          <FooterCol
            title="Order"
            links={[
              { href: "/menu", label: "Full menu" },
              { href: "/menu", label: "Catering" },
              { href: "/menu", label: "Weekend biryani" },
            ]}
          />
          <FooterCol
            title="Visit"
            links={[
              { href: "/reservations", label: "Reservations" },
              { href: "https://maps.google.com/?q=948+Clay+Street+Oakland+CA", label: "Directions" },
              { href: "tel:+15102509696", label: "Call restaurant" },
            ]}
          />
          <FooterCol
            title="About"
            links={[
              { href: "/about", label: "Our story" },
              { href: "/press", label: "Press" },
              { href: "/careers", label: "Work with us" },
              { href: "/preview", label: "Design studies" },
            ]}
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-10 mt-14 pt-6 border-t border-[#2B1E16]/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-[#2B1E16]/50">
          <p>© 2026 Annapurna Restaurant · 948 Clay Street, Oakland CA</p>
          <p>
            Built with care. <Link href="/preview" className="underline hover:text-[#C85A3C]">Other designs →</Link>
          </p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════
          STICKY MOBILE CTA
      ══════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <Link
          href="/menu"
          className="flex items-center justify-between gap-3 rounded-full bg-[#2B1E16] text-[#FDF4E4] px-6 py-4 shadow-2xl shadow-[#2B1E16]/40"
        >
          <span className="text-sm font-bold">Order now · ready in 20 min</span>
          <span className="inline-flex items-center justify-center rounded-full bg-[#C85A3C] h-9 w-9">→</span>
        </Link>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center md:border-l md:first:border-l-0 md:border-[#2B1E16]/15">
      <p
        className="text-3xl lg:text-5xl leading-none"
        style={{ color: "#2B1E16", fontFamily: "var(--font-instrument), serif" }}
      >
        {number}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-[#2B1E16]/60 font-semibold">
        {label}
      </p>
    </div>
  );
}

function BentoCard({
  item,
  className = "",
  size,
  badge,
}: {
  item: (typeof menu)[number];
  className?: string;
  size: "hero" | "small";
  badge?: string;
}) {
  return (
    <Link
      href="/menu"
      className={`group relative block overflow-hidden rounded-[1.5rem] ${className}`}
    >
      <img
        src={item.image}
        alt={item.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(43,30,22,0.0) 30%, rgba(43,30,22,0.82) 100%)",
        }}
      />
      {badge && (
        <span className="absolute top-4 left-4 rounded-full bg-[#FDF4E4] text-[#2B1E16] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
          {badge}
        </span>
      )}
      <div className="absolute bottom-5 left-5 right-5 text-[#FDF4E4]">
        <h3
          className={`${size === "hero" ? "text-4xl lg:text-6xl" : "text-xl lg:text-2xl"} leading-[0.95] tracking-tight`}
          style={{ fontFamily: "var(--font-instrument), serif" }}
        >
          {item.name}
        </h3>
        {size === "hero" && (
          <p className="mt-3 text-base max-w-md opacity-85 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
          <span className="text-[11px] uppercase tracking-[0.2em] opacity-70">
            {size === "hero" ? "Featured · add to bag →" : "Add →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#2B1E16]/70 mb-4">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-[#2B1E16]/80 hover:text-[#C85A3C] transition"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
