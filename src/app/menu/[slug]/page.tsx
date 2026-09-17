import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf, Sprout, Wheat, ChevronRight } from "lucide-react";
import { getDishBySlug, getDishPageItems, getRelatedDishes } from "@/lib/menu/dish-pages";
import { DishOrderPanel } from "@/components/menu/dish-order-panel";
import { luxe } from "@/lib/theme";

const SITE = "https://annapurnaoakland.com";
const LOGO = "/images/annapurna-logo.png";

// Matches /menu (the catalog cache is 30s); a dish page changes about as often.
export const revalidate = 30;

// Prerender every dish at build time. There are ~84 of them, they change rarely,
// and a crawler should never wait on a cold render.
export async function generateStaticParams() {
  const items = await getDishPageItems();
  return items.map((i) => ({ slug: i.id }));
}

const DIET_TAGS: { tag: string; label: string; Icon: typeof Leaf; bg: string }[] = [
  { tag: "vegetarian", label: "Vegetarian", Icon: Leaf, bg: "#4A6B4A" },
  { tag: "vegan", label: "Vegan option", Icon: Sprout, bg: "#3E5C3E" },
  { tag: "gluten-free", label: "Gluten-free", Icon: Wheat, bg: "#7A5A2E" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getDishBySlug(slug);
  if (!item) return { title: "Dish not found" };

  // Lead with the dish, then the cuisine and the city — that is the search this
  // page is meant to win ("chicken momo oakland"), not a brand search. The
  // category is dropped when it is missing, so a build-phase render without a
  // DB can't emit a dangling "Chicken Momo —  · Annapurna Oakland".
  const title = item.categoryLabel
    ? `${item.name} — ${item.categoryLabel} · Annapurna Oakland`
    : `${item.name} · Annapurna Oakland`;
  const description = item.description
    ? `${item.description} Order ${item.name} for pickup or delivery from Annapurna, Indian & Nepalese in Old Oakland.`.slice(0, 300)
    : `Order ${item.name} for pickup or delivery from Annapurna, an Indian & Nepalese kitchen at 948 Clay Street in Old Oakland.`;

  return {
    title,
    description,
    alternates: { canonical: `/menu/${item.id}` },
    openGraph: {
      title: `${item.name} · Annapurna Oakland`,
      description,
      url: `${SITE}/menu/${item.id}`,
      images: [{ url: item.image || `${SITE}${LOGO}`, alt: item.name }],
    },
  };
}

export default async function DishPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getDishBySlug(slug);
  if (!item) notFound();

  const related = await getRelatedDishes(item);
  const img = item.image || LOGO;
  const isLogo = img === LOGO;
  const tags = DIET_TAGS.filter((t) => item.tags.includes(t.tag));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MenuItem",
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        url: `${SITE}/menu/${item.id}`,
        ...(item.image ? { image: item.image } : {}),
        ...(item.tags.includes("vegetarian") ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
        offers: {
          "@type": "Offer",
          price: item.price.toFixed(2),
          priceCurrency: "USD",
          availability: item.available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `${SITE}/menu/${item.id}`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Menu", item: `${SITE}/menu` },
          { "@type": "ListItem", position: 3, name: item.categoryLabel, item: `${SITE}/menu#cat-${item.category}` },
          { "@type": "ListItem", position: 4, name: item.name, item: `${SITE}/menu/${item.id}` },
        ],
      },
    ],
  };

  return (
    <main style={{ backgroundColor: luxe.bg }}>
      <script
        type="application/ld+json"
        // Escape `<` so dish text can never break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-6xl px-6 pt-8 pb-16 lg:pt-12">
        {/* Breadcrumb — also the crawler's path back up. */}
        <nav aria-label="Breadcrumb" className="mb-8 text-[12px]" style={{ color: luxe.muted }}>
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden><ChevronRight className="h-3 w-3" /></li>
            <li><Link href="/menu" className="hover:underline">Menu</Link></li>
            <li aria-hidden><ChevronRight className="h-3 w-3" /></li>
            <li>
              <Link href={`/menu#cat-${item.category}`} className="hover:underline">
                {item.categoryLabel}
              </Link>
            </li>
            <li aria-hidden><ChevronRight className="h-3 w-3" /></li>
            <li aria-current="page" style={{ color: luxe.ink }}>{item.name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem]"
            style={{ backgroundColor: luxe.surface, border: "1px solid rgba(201,162,75,0.18)" }}
          >
            <Image
              src={img}
              alt={item.name}
              fill
              // Half the 1152px rail on desktop, full width below `lg`.
              sizes="(min-width: 1024px) 576px, 100vw"
              priority
              className={isLogo ? "object-contain p-12 opacity-90" : "object-cover"}
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="brand-kicker mb-3">{item.categoryLabel}</p>
            <h1 className="brand-heading mb-4" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
              {item.name}
            </h1>

            {item.description && (
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: luxe.muted }}>
                {item.description}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map(({ tag, label, Icon, bg }) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider px-3 py-1.5"
                    style={{ backgroundColor: bg, color: "#F3E9D6" }}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                ))}
              </div>
            )}

            <p className="text-3xl font-bold mb-7" style={{ color: luxe.gold, fontFamily: "var(--font-display)" }}>
              ${item.price.toFixed(2)}
            </p>

            <DishOrderPanel item={item} unavailable={!item.available} />

            <p className="mt-6 text-[13px] leading-relaxed" style={{ color: luxe.muted }}>
              Ordering here is the best price — the delivery apps charge more to
              cover their commission. Pickup at{" "}
              <Link href="/menu" className="underline" style={{ color: luxe.gold }}>948 Clay Street</Link>{" "}
              in Old Oakland, or delivery across Oakland. Open Mon–Sat, 11:00 AM–9:30 PM.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-6 h-px w-9" style={{ backgroundColor: luxe.gold }} />
            {/* Phrased so it reads correctly for every category label —
                "More from the Appetizer menu", "…the Breads menu" — while still
                carrying the category keyword. */}
            <h2 className="brand-heading mb-7" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
              More from the {item.categoryLabel} menu.
            </h2>
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/menu/${r.id}`}
                    className="group block rounded-[1.25rem] overflow-hidden transition hover:-translate-y-0.5"
                    style={{ backgroundColor: luxe.surface, border: "1px solid rgba(201,162,75,0.18)" }}
                  >
                    <span className="relative block aspect-[5/3] overflow-hidden">
                      <Image
                        src={r.image || LOGO}
                        alt={r.name}
                        fill
                        sizes="(min-width: 1024px) 352px, 50vw"
                        className={
                          (r.image || LOGO) === LOGO
                            ? "object-contain p-6 opacity-90"
                            : "object-cover transition-transform duration-500 group-hover:scale-105"
                        }
                      />
                    </span>
                    <span className="flex items-start justify-between gap-2 p-4">
                      <span className="text-[15px] leading-tight" style={{ fontFamily: "var(--font-display)", color: luxe.ink }}>
                        {r.name}
                      </span>
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color: luxe.gold }}>
                        ${r.price.toFixed(2)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/menu"
              className="mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold transition"
              style={{ border: "1px solid rgba(201,162,75,0.3)", color: luxe.gold }}
            >
              See the full menu
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
