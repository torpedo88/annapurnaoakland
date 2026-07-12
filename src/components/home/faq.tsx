import { luxe } from "@/lib/theme";

// FAQ section + FAQPage structured data. The visible Q&A and the JSON-LD are
// generated from the same source so they always match (Google requires the
// schema to reflect on-page content). High AI-citation value for "do they
// deliver / vegetarian / reservations / pricing" style queries.

const FAQS: { q: string; a: string }[] = [
  {
    q: "What kind of food does Annapurna serve?",
    a: "Annapurna serves authentic Indian and Nepalese (Himalayan) cuisine — hand-pleated momos, slow-cooked curries like butter chicken and goat curry, tandoori dishes, biryani, and vegetarian thali. The family has run the kitchen in Old Oakland since 2010.",
  },
  {
    q: "Where is Annapurna located?",
    a: "Annapurna Restaurant & Bar is at 948 Clay Street, Oakland, CA 94607, inside the historic Swan's Market in Old Oakland.",
  },
  {
    q: "What are your hours?",
    a: "We're open Monday through Saturday, 11:00 AM to 9:30 PM, and closed on Sundays.",
  },
  {
    q: "Do you offer pickup and delivery?",
    a: "Yes. You can order online for pickup or delivery in Oakland at annapurnaoakland.com/menu. Ordering directly from our website is the best price — prices on third-party delivery apps are higher to cover their fees.",
  },
  {
    q: "Do you have vegetarian, vegan, and gluten-free options?",
    a: "Yes. We have a large vegetarian selection, plus vegan and gluten-free options across appetizers, curries, and breads. Just ask our staff and we'll guide you.",
  },
  {
    q: "Do you take reservations?",
    a: "Yes — you can reserve a table at annapurnaoakland.com/reservations. Walk-ins are welcome too.",
  },
  {
    q: "Do you cater events?",
    a: "Yes. We offer catering with half- and full-tray pricing for parties, offices, and events across Oakland and the East Bay. Request catering at annapurnaoakland.com/catering.",
  },
  {
    q: "Is there parking, and do you have a bar?",
    a: "There is street parking around Swan's Market in Old Oakland. We're a full restaurant and bar, serving beer and cocktails alongside the menu.",
  },
];

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="py-10 lg:py-14" style={{ backgroundColor: luxe.bg }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <div className="mb-3 h-px w-9" style={{ backgroundColor: luxe.gold }} />
        <p className="text-[10px] uppercase tracking-[0.34em] mb-3" style={{ color: luxe.gold }}>
          Good to know
        </p>
        <h2
          className="brand-heading mb-10 leading-[1.05]"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
        >
          Frequently asked questions
        </h2>

        <div className="divide-y" style={{ borderColor: luxe.line }}>
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary
                className="cursor-pointer list-none flex items-start justify-between gap-4 text-lg"
                style={{ fontFamily: "var(--font-display)", color: luxe.ink }}
              >
                <span>{f.q}</span>
                <span className="shrink-0 transition-transform group-open:rotate-45" style={{ color: luxe.gold }}>+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: luxe.muted }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
