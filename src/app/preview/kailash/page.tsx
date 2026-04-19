import Link from "next/link";
import { Fraunces, Newsreader, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-k", display: "swap" });

const featured = [
  {
    n: "01",
    name: "Jhol Momo",
    kind: "Signature",
    price: "14.99",
    blurb:
      "Eight hand-pleated dumplings bathing in a fire-red broth of toasted sesame, Szechuan pepper, and tomato. A Kathmandu street staple — the soup is the point.",
    img: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=1400&q=85&auto=format&fit=crop",
  },
  {
    n: "02",
    name: "Chicken Nauni",
    kind: "Tandoor",
    price: "18.99",
    blurb:
      "Tandoor-charred chicken folded into a slow-simmered butter gravy — fenugreek leaves crushed between palms, finished with a slow ribbon of cream. Served with house naan.",
    img: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=1400&q=85&auto=format&fit=crop",
  },
  {
    n: "03",
    name: "Palak Paneer",
    kind: "Vegetarian",
    price: "17.99",
    blurb:
      "Spinach hand-washed and blitzed the same afternoon. Paneer made in-house every Monday. Mustard oil bloom, garlic tadka, a whisper of cream. No shortcuts.",
    img: "https://images.unsplash.com/photo-1631452180539-1f36b2e8bd2b?w=1400&q=85&auto=format&fit=crop",
  },
];

const menuIndex = [
  { title: "Appetizers & Momo", page: "02", range: "$7 — $15" },
  { title: "House Tandoor", page: "05", range: "$17 — $22" },
  { title: "Vegetarian Kitchen", page: "08", range: "$16 — $18" },
  { title: "Lamb & Goat", page: "11", range: "$19 — $24" },
  { title: "Biryani & Rice", page: "14", range: "$16 — $21" },
  { title: "From the Sea", page: "17", range: "$19 — $23" },
  { title: "Breads & Sides", page: "19", range: "$3 — $9" },
  { title: "Chai & Sweets", page: "22", range: "$4 — $8" },
];

export default function KailashPage() {
  return (
    <div
      className={`${fraunces.variable} ${newsreader.variable} ${mono.variable} min-h-screen`}
      style={{
        backgroundColor: "#F4EDE0",
        color: "#14213D",
        fontFamily: "var(--font-newsreader), serif",
      }}
    >
      {/* Paper grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* ─── Masthead ───────────────────────────────────────── */}
      <header className="border-b border-[#14213D]/25 border-double" style={{ borderBottomWidth: 3 }}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-8 pb-6">
          <div
            className={`${mono.className} flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[#14213D]/70`}
          >
            <span>Vol. IX · № 04</span>
            <span className="hidden sm:block">Est. MMX · Oakland, California</span>
            <span>April · MMXXVI</span>
          </div>
          <h1
            className={`${fraunces.className} text-center mt-6 text-[clamp(3rem,11vw,11rem)] font-light leading-[0.82] tracking-[-0.04em]`}
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144", letterSpacing: "-0.045em" }}
          >
            Annapurna
          </h1>
          <div className={`${mono.className} mt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.4em] text-[#14213D]/60`}>
            <span className="h-px w-16 bg-[#14213D]/40" />
            <span>A Himalayan Table in Oakland</span>
            <span className="h-px w-16 bg-[#14213D]/40" />
          </div>
        </div>
        <nav className="border-t border-[#14213D]/25">
          <div className={`${mono.className} mx-auto max-w-[1400px] px-6 lg:px-12 flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.25em]`}>
            <div className="flex gap-6">
              <Link href="/preview" className="hover:text-[#A84A2B] transition">← All designs</Link>
            </div>
            <div className="hidden md:flex gap-6 text-[#14213D]/70">
              <a href="#table" className="hover:text-[#A84A2B]">The Table</a>
              <a href="#menu" className="hover:text-[#A84A2B]">Menu Index</a>
              <a href="#story" className="hover:text-[#A84A2B]">Story</a>
              <a href="#visit" className="hover:text-[#A84A2B]">Visit</a>
            </div>
            <Link
              href="/menu"
              className="border border-[#14213D] px-4 py-1.5 hover:bg-[#14213D] hover:text-[#F4EDE0] transition"
            >
              Order
            </Link>
          </div>
        </nav>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <p className={`${mono.className} text-[11px] uppercase tracking-[0.4em] text-[#A84A2B] mb-8`}>
              Feature · Volume IX
            </p>
            <h2
              className={`${fraunces.className} text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.95] tracking-[-0.03em]`}
            >
              The taste of a
              <br />
              kingdom that
              <br />
              <em className="italic font-normal" style={{ color: "#A84A2B" }}>no longer</em> exists,
              <br />
              set down in
              <br />
              Oakland clay.
            </h2>
            <p className="mt-10 max-w-xl text-lg leading-relaxed text-[#14213D]/80">
              For three generations the Basnet family has kept one recipe book — mustard-stained,
              bound in saffron thread, carried from Kathmandu to a kitchen on Clay Street. What
              follows is the 2026 edition of that book, served seven nights a week.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/menu"
                className={`${mono.className} inline-flex items-center gap-3 bg-[#14213D] text-[#F4EDE0] px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-[#A84A2B] transition`}
              >
                Enter the menu
                <span>→</span>
              </Link>
              <Link
                href="/reservations"
                className={`${mono.className} inline-flex items-center gap-3 border border-[#14213D] px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-[#14213D] hover:text-[#F4EDE0] transition`}
              >
                Reserve a table
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=1200&q=90&auto=format&fit=crop"
                alt="Jhol momo in red chili broth"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-[#14213D]/15" />
            </div>
            <figcaption className={`${mono.className} mt-4 text-[10px] uppercase tracking-[0.25em] text-[#14213D]/60 flex justify-between`}>
              <span>Plate 01 · Jhol Momo</span>
              <span>Photo: M. Gurung</span>
            </figcaption>
          </div>
        </div>
      </section>

      {/* Mountain rule */}
      <div aria-hidden className="mx-auto max-w-[1400px] px-6 lg:px-12 py-10">
        <svg viewBox="0 0 1200 60" className="w-full h-12 text-[#14213D]/40">
          <path
            d="M0 55 L180 20 L240 35 L360 5 L480 30 L600 10 L720 32 L840 8 L960 30 L1080 15 L1200 45 L1200 60 L0 60 Z"
            fill="currentColor"
            opacity=".15"
          />
          <path
            d="M0 55 L180 20 L240 35 L360 5 L480 30 L600 10 L720 32 L840 8 L960 30 L1080 15 L1200 45"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </div>

      {/* ─── This Week's Table ─────────────────────────────── */}
      <section id="table" className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16">
        <div className="flex items-end justify-between mb-16 border-b border-[#14213D]/25 pb-6">
          <div>
            <p className={`${mono.className} text-[11px] uppercase tracking-[0.4em] text-[#A84A2B] mb-4`}>
              § II · This week&apos;s table
            </p>
            <h3 className={`${fraunces.className} text-5xl md:text-6xl font-light leading-[0.95] tracking-tight`}>
              Three things
              <br />
              <em>worth driving for.</em>
            </h3>
          </div>
          <p className={`${mono.className} hidden md:block text-[10px] uppercase tracking-[0.3em] text-[#14213D]/60 pb-4`}>
            Curated weekly · Chef S. Basnet
          </p>
        </div>

        <div className="space-y-24">
          {featured.map((dish, i) => (
            <article
              key={dish.n}
              className={`grid lg:grid-cols-12 gap-8 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}
            >
              <div className={`lg:col-span-7 ${i % 2 === 1 ? "lg:col-start-6" : ""}`}>
                <div className="aspect-[5/4] relative overflow-hidden">
                  <img
                    src={dish.img}
                    alt={dish.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-[#14213D]/15" />
                </div>
              </div>
              <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                <div className="flex items-baseline gap-6 mb-6">
                  <span
                    className={`${fraunces.className} text-8xl font-light leading-none`}
                    style={{ color: "#E89B2B" }}
                  >
                    {dish.n}
                  </span>
                  <span className={`${mono.className} text-[11px] uppercase tracking-[0.3em] text-[#14213D]/60`}>
                    {dish.kind}
                  </span>
                </div>
                <h4 className={`${fraunces.className} text-4xl md:text-5xl font-light leading-[0.95] tracking-tight`}>
                  {dish.name}
                </h4>
                <p className="mt-6 text-lg leading-relaxed text-[#14213D]/80 max-w-md">
                  {dish.blurb}
                </p>
                <div className="mt-8 flex items-center gap-6">
                  <span className={`${fraunces.className} text-2xl`}>${dish.price}</span>
                  <span className="h-px w-20 bg-[#14213D]/40" />
                  <Link
                    href="/menu"
                    className={`${mono.className} text-[11px] uppercase tracking-[0.3em] hover:text-[#A84A2B] transition`}
                  >
                    Add to order →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Pull Quote / Story ────────────────────────────── */}
      <section id="story" className="bg-[#14213D] text-[#F4EDE0] py-32 mt-24">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
          <p className={`${mono.className} text-[11px] uppercase tracking-[0.4em] mb-10`} style={{ color: "#E89B2B" }}>
            § III · Letter from the kitchen
          </p>
          <blockquote className={`${fraunces.className} text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.02em] font-light`}>
            <span className="italic" style={{ color: "#E89B2B" }}>&ldquo;</span>
            We left Kathmandu with one suitcase and my grandmother&apos;s recipe box. The
            <em> dal </em> you eat here is the same one she cooked for my father in 1962, the
            year the king&apos;s army came through the valley. I don&apos;t serve anything I wouldn&apos;t
            set in front of her.
            <span className="italic" style={{ color: "#E89B2B" }}>&rdquo;</span>
          </blockquote>
          <div className="mt-14 flex items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-[#F4EDE0]/10 ring-1 ring-[#F4EDE0]/30 flex items-center justify-center">
              <span className={`${fraunces.className} text-2xl`}>SB</span>
            </div>
            <div>
              <p className={`${fraunces.className} text-xl`}>Safal Basnet</p>
              <p className={`${mono.className} text-[11px] uppercase tracking-[0.3em] text-[#F4EDE0]/60`}>
                Chef-Owner · Annapurna, est. 2010
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Menu Index (Table of Contents) ────────────────── */}
      <section id="menu" className="mx-auto max-w-[1400px] px-6 lg:px-12 py-32">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <p className={`${mono.className} text-[11px] uppercase tracking-[0.4em] text-[#A84A2B] mb-6`}>
              § IV · The full menu
            </p>
            <h3 className={`${fraunces.className} text-5xl md:text-6xl font-light leading-[0.95] tracking-tight`}>
              A table of
              <br />
              <em>contents,</em>
              <br />
              as it were.
            </h3>
            <p className="mt-8 text-[#14213D]/70 leading-relaxed">
              Eight chapters, ninety-three dishes. A full catering menu in the back matter.
              Nothing on the page we wouldn&apos;t cook for ourselves on a Tuesday.
            </p>
            <Link
              href="/menu"
              className={`${mono.className} inline-flex items-center gap-3 mt-10 border border-[#14213D] px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-[#14213D] hover:text-[#F4EDE0] transition`}
            >
              Browse full menu →
            </Link>
          </div>
          <div className="lg:col-span-8">
            <div className="border-t border-[#14213D]/25">
              {menuIndex.map((item, i) => (
                <div
                  key={item.title}
                  className="border-b border-[#14213D]/25 py-5 flex items-baseline gap-4 group cursor-pointer"
                >
                  <span className={`${mono.className} text-[10px] uppercase tracking-[0.3em] text-[#14213D]/50 w-8`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`${fraunces.className} text-2xl md:text-3xl font-light group-hover:italic group-hover:text-[#A84A2B] transition-all`}>
                    {item.title}
                  </span>
                  <span className="flex-1 border-b border-dotted border-[#14213D]/30 mx-3 translate-y-[-4px]" />
                  <span className={`${mono.className} text-[11px] uppercase tracking-[0.2em] text-[#14213D]/60`}>
                    {item.range}
                  </span>
                  <span className={`${fraunces.className} italic text-[#14213D]/60 text-lg`}>p. {item.page}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Visit ─────────────────────────────────────────── */}
      <section id="visit" className="bg-[#EDE4D3] py-24">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <p className={`${mono.className} text-[11px] uppercase tracking-[0.4em] text-[#A84A2B] mb-10`}>
            § V · Visit
          </p>
          <div className="grid lg:grid-cols-3 gap-12 border-t border-[#14213D]/25 pt-12">
            <div>
              <h4 className={`${fraunces.className} text-3xl font-light mb-6`}>Address</h4>
              <p className="text-lg leading-relaxed">
                948 Clay Street
                <br />
                Oakland, California 94607
              </p>
              <a
                href="https://maps.google.com/?q=948+Clay+Street+Oakland+CA"
                className={`${mono.className} inline-block mt-6 text-[11px] uppercase tracking-[0.3em] text-[#A84A2B] hover:text-[#14213D] transition`}
              >
                Directions →
              </a>
            </div>
            <div>
              <h4 className={`${fraunces.className} text-3xl font-light mb-6`}>Hours</h4>
              <dl className="space-y-2 text-lg">
                <div className="flex justify-between border-b border-[#14213D]/15 pb-2">
                  <dt>Daily</dt>
                  <dd>11:00 — 21:30</dd>
                </div>
                <div className="flex justify-between border-b border-[#14213D]/15 pb-2">
                  <dt>Pickup</dt>
                  <dd>≤ 30 min</dd>
                </div>
                <div className="flex justify-between border-b border-[#14213D]/15 pb-2">
                  <dt>Delivery</dt>
                  <dd>5-mile radius</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className={`${fraunces.className} text-3xl font-light mb-6`}>Contact</h4>
              <p className="text-lg leading-relaxed">
                <a href="tel:+15102509696" className="hover:text-[#A84A2B] transition">
                  (510) 250-9696
                </a>
                <br />
                <a href="mailto:hello@annapurnaoakland.com" className="hover:text-[#A84A2B] transition">
                  hello@annapurnaoakland.com
                </a>
              </p>
              <p className={`${mono.className} mt-6 text-[10px] uppercase tracking-[0.3em] text-[#14213D]/60`}>
                Catering · Private events · Press
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Colophon Footer ───────────────────────────────── */}
      <footer className="border-t border-[#14213D]/25 border-double" style={{ borderTopWidth: 3 }}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-14">
          <h5
            className={`${fraunces.className} text-center text-6xl md:text-8xl font-light tracking-[-0.04em] leading-none`}
          >
            Annapurna
          </h5>
          <p className={`${mono.className} mt-4 text-center text-[10px] uppercase tracking-[0.5em] text-[#14213D]/60`}>
            Oakland · est. MMX · Clay Street
          </p>
          <div className={`${mono.className} mt-10 flex flex-col md:flex-row md:justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-[#14213D]/60`}>
            <span>© MMXXVI Basnet Family Kitchen LLC</span>
            <span className="hidden md:inline">Set in Fraunces & Newsreader</span>
            <span>Printed on Clay Street daily</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
