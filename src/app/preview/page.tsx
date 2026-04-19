import Link from "next/link";
import { Fraunces, Instrument_Serif, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const instrument = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const cormorant = Cormorant_Garamond({ weight: ["300", "400", "500"], subsets: ["latin"], variable: "--font-cormorant", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-preview", display: "swap" });

const variants = [
  {
    slug: "kailash",
    name: "Kailash",
    tagline: "Editorial Heritage",
    description:
      "Magazine-inflected. Wedge serifs, parchment tones, asymmetric columns, numbered dishes like a journal spread. Reads like Kinfolk crossed with a Himalayan field guide.",
    palette: ["#F5EDE0", "#14213D", "#E89B2B", "#A84A2B"],
    font: fraunces.className,
    accent: "border-[#E89B2B]",
    textColor: "text-[#14213D]",
    bg: "bg-[#F5EDE0]",
  },
  {
    slug: "", // Terracotta is now the canonical site at /
    name: "Terracotta",
    tagline: "Warm Modern · Live",
    description:
      "The chosen direction — now serving as the main site. Organic, confident, approachable. Terracotta and saffron with cream negative space. High-contrast serif display, rounded everything.",
    palette: ["#FDF4E4", "#C85A3C", "#F2A545", "#2B1E16"],
    font: instrument.className,
    accent: "border-[#C85A3C]",
    textColor: "text-[#2B1E16]",
    bg: "bg-[#FDF4E4]",
  },
  {
    slug: "shadow-peak",
    name: "Shadow Peak",
    tagline: "Premium Dark",
    description:
      "Cinematic and restrained. Near-black canvas, ivory type, gold inlays, thin rules. Letter-spaced caps and serif italic. Reservation-forward, chef-driven, quiet luxury.",
    palette: ["#0A0A0A", "#EEE8DB", "#C9A64B", "#6E1D2E"],
    font: cormorant.className,
    accent: "border-[#C9A64B]",
    textColor: "text-[#EEE8DB]",
    bg: "bg-[#0A0A0A]",
  },
];

export default function PreviewIndexPage() {
  return (
    <div className={`${fraunces.variable} ${instrument.variable} ${cormorant.variable} ${mono.variable} min-h-screen bg-stone-100 text-stone-900`}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <header className="mb-16 border-b border-stone-400/40 pb-10">
          <p className={`${mono.className} text-[11px] uppercase tracking-[0.3em] text-stone-500`}>
            Design Studies · Vol. 1 · 2026
          </p>
          <h1 className={`${fraunces.className} mt-6 text-5xl sm:text-7xl font-light leading-[0.95] tracking-tight`}>
            Annapurna Oakland
            <span className="block italic text-stone-500 mt-2">three futures.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-stone-700 leading-relaxed text-lg">
            Three distinct aesthetic directions, each a complete homepage. Click through, feel the interactions,
            and pick the one that sounds like the restaurant you want to run. We&apos;ll scaffold the monorepo around
            the winner.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {variants.map((v, i) => (
            <Link
              key={v.slug || "terracotta"}
              href={v.slug ? `/preview/${v.slug}` : "/"}
              className="group relative flex flex-col overflow-hidden rounded-sm border border-stone-300 bg-white transition-all hover:border-stone-500 hover:shadow-xl"
            >
              <div className={`${v.bg} ${v.textColor} aspect-[4/5] p-8 flex flex-col justify-between transition-transform duration-500 group-hover:scale-[1.02]`}>
                <div>
                  <p className={`${mono.className} text-[10px] uppercase tracking-[0.25em] opacity-60`}>
                    {String(i + 1).padStart(2, "0")} / 03
                  </p>
                  <h2 className={`${v.font} text-5xl leading-none mt-8`}>
                    {v.name}
                  </h2>
                  <p className={`${v.font} italic text-xl mt-3 opacity-80`}>{v.tagline}</p>
                </div>
                <div className="flex gap-1">
                  {v.palette.map((c) => (
                    <span
                      key={c}
                      className="h-8 w-8 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <p className="text-sm text-stone-700 leading-relaxed">{v.description}</p>
                <p className={`${mono.className} text-[11px] uppercase tracking-[0.2em] text-stone-500 group-hover:text-stone-900`}>
                  View design →
                </p>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-24 flex flex-col sm:flex-row sm:justify-between gap-4 border-t border-stone-400/40 pt-6">
          <p className={`${mono.className} text-[11px] uppercase tracking-[0.25em] text-stone-500`}>
            Design · Claude Code · April 2026
          </p>
          <p className={`${mono.className} text-[11px] uppercase tracking-[0.25em] text-stone-500`}>
            annapurna oakland · 948 clay st
          </p>
        </footer>
      </div>
    </div>
  );
}
