"use client";

import { CircularGallery, GalleryItem } from "@/components/ui/circular-gallery";
import { OrderCTA } from "@/components/home/luxe/order-cta";
import { useCart } from "@/lib/preview-cart";
import type { MenuItem } from "@/data/menu";
import { luxe } from "@/lib/theme";

// Homepage hero: a 3D circular gallery of signature dishes (Higgsfield-generated
// images in /public/images/ai-dishes). Auto-rotates horizontally, follows the
// cursor on hover, drags to spin, and a tap opens a zoomed detail view with
// "Add to cart" + "Order online". Each item carries its real menu-item id (=
// slug) so Add-to-cart lines up with server-side pricing and "Order online"
// deep-links to that dish on /menu. Prices are the current menu prices; the
// server re-prices authoritatively at checkout. A visually-hidden <h1> keeps the
// page crawlable; the visible headline is an <h2>. Also on /preview/circular-gallery.
const galleryData: GalleryItem[] = [
  { id: "appetizer-chicken-momo", common: "Jhol Momo", binomial: "Steamed Nepali dumplings", href: "/menu#item-appetizer-chicken-momo", price: "$14.99", photo: { url: "/images/ai-dishes/momo.jpg", text: "Steamed momo dumplings", pos: "center", by: "Annapurna Kitchen" } },
  { id: "chicken-dish-chicken-nauni-butter-chicken", common: "Butter Chicken", binomial: "Chicken nauni", href: "/menu#item-chicken-dish-chicken-nauni-butter-chicken", price: "$18.99", photo: { url: "/images/ai-dishes/butterChicken.jpg", text: "Butter chicken in creamy tomato gravy", pos: "center", by: "Annapurna Kitchen" } },
  { id: "biryani-lamb-biryani", common: "Lamb Biryani", binomial: "Fragrant basmati & spice", href: "/menu#item-biryani-lamb-biryani", price: "$19.99", photo: { url: "/images/ai-dishes/lambBiryani.jpg", text: "Lamb biryani", pos: "center", by: "Annapurna Kitchen" } },
  { id: "vegetarian-dish-palak-paneer", common: "Palak Paneer", binomial: "Spinach & house cheese", href: "/menu#item-vegetarian-dish-palak-paneer", price: "$17.99", photo: { url: "/images/ai-dishes/palakPaneer.jpg", text: "Palak paneer", pos: "center", by: "Annapurna Kitchen" } },
  { id: "tandoori-dish-chicken-tandoori", common: "Chicken Tandoori", binomial: "Clay-oven grill", href: "/menu#item-tandoori-dish-chicken-tandoori", price: "$22.99", photo: { url: "/images/ai-dishes/mixedTandoori.jpg", text: "Tandoori platter", pos: "center", by: "Annapurna Kitchen" } },
  { id: "appetizer-chicken-chhoila", common: "Chicken Chhoila", binomial: "Newari grilled chicken", href: "/menu#item-appetizer-chicken-chhoila", price: "$14.99", photo: { url: "/images/ai-dishes/chhoila.jpg", text: "Chhoila", pos: "center", by: "Annapurna Kitchen" } },
  { id: "chicken-dish-chicken-tikka-masala", common: "Chicken Tikka Masala", binomial: "Charred, simmered in masala", href: "/menu#item-chicken-dish-chicken-tikka-masala", price: "$18.99", photo: { url: "/images/ai-dishes/chickenTikkaMasala.jpg", text: "Chicken tikka masala", pos: "center", by: "Annapurna Kitchen" } },
  { id: "vegetarian-dish-daal-makhani", common: "Daal Makhani", binomial: "Slow-cooked black lentils", href: "/menu#item-vegetarian-dish-daal-makhani", price: "$17.99", photo: { url: "/images/ai-dishes/dalMakhani.jpg", text: "Daal makhani", pos: "center", by: "Annapurna Kitchen" } },
  { id: "beverages-mango-lassi", common: "Mango Lassi", binomial: "Yogurt & Alphonso mango", href: "/menu#item-beverages-mango-lassi", price: "$4.99", photo: { url: "/images/ai-dishes/mangoLassi.jpg", text: "Mango lassi", pos: "center", by: "Annapurna Kitchen" } },
  { id: "dessert-gulab-jamun", common: "Gulab Jamun", binomial: "Rose-cardamom syrup", href: "/menu#item-dessert-gulab-jamun", price: "$7.99", photo: { url: "/images/ai-dishes/gulabJamun.jpg", text: "Gulab jamun", pos: "center", by: "Annapurna Kitchen" } },
];

export function GalleryHero() {
  const cart = useCart();

  const handleAddToCart = (gi: GalleryItem) => {
    if (!gi.id) return;
    const price = Number((gi.price || "0").replace(/[^0-9.]/g, "")) || 0;
    const menuItem: MenuItem = {
      id: gi.id,
      name: gi.common,
      description: gi.binomial,
      price,
      category: "",
      categoryLabel: "",
      image: gi.photo.url,
      isCatering: false,
      tags: [],
    };
    cart.add(menuItem, 1);
    cart.setOpen(true);
  };

  return (
    <section
      className="relative w-full overflow-hidden text-foreground flex flex-col items-center"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 22%, #2a1a10 0%, #16110c 48%, #0d0906 100%)",
      }}
    >
      {/* SEO: the real page heading, visually hidden (the visible headline below
          is an <h2> so there is exactly one <h1>). */}
      <h1 className="sr-only">
        Annapurna Restaurant &amp; Bar — Indian &amp; Nepalese cuisine in Oakland.
        A blend of tradition &amp; flavor.
      </h1>

      {/* Vignette — darkens the edges to focus the ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Annapurna snow-peaks — a hazy horizon that blends into the backdrop
          (blurred ridgeline + faded accents) rather than a hard band. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 w-full z-0"
        style={{ height: "26vh", opacity: 0.5, filter: "blur(2px)" }}
      >
        <path
          d="M0,260 L0,150 L180,60 L300,120 L470,20 L560,90 L720,10 L840,95 L980,35 L1120,110 L1250,55 L1440,140 L1440,260 Z"
          fill="#161009"
        />
        <path
          d="M470,20 L520,55 L500,60 L540,80 L470,45 L440,70 L470,20 Z M720,10 L775,50 L748,55 L792,78 L720,40 L688,66 L720,10 Z M980,35 L1022,68 L1000,72 L1035,92 L980,58 L952,80 L980,35 Z"
          fill={luxe.ink}
          opacity={0.18}
        />
        <path
          d="M0,150 L180,60 L300,120 L470,20 L560,90 L720,10 L840,95 L980,35 L1120,110 L1250,55 L1440,140"
          fill="none"
          stroke={luxe.gold}
          strokeOpacity={0.14}
          strokeWidth={1}
        />
      </svg>

      {/* Heading + Order CTAs. */}
      <div className="text-center relative z-20 px-4 pt-8 flex flex-col items-center gap-4">
        <div>
          <p className="brand-kicker mb-3">Old Oakland · Indian &amp; Nepalese</p>
          <h2 className="brand-heading text-4xl sm:text-5xl">
            Our Signature Dishes
          </h2>
          <p className="mt-2 text-sm" style={{ color: luxe.muted }}>
            Move your cursor to explore · tap a dish to order
          </p>
        </div>
        <OrderCTA align="center" />
      </div>

      {/* The 3D ring. Shorter on mobile so it sits right under the buttons. */}
      <div className="w-full h-[44vh] min-h-[360px] sm:h-[58vh] sm:min-h-[440px] z-10">
        <CircularGallery
          items={galleryData}
          cardWidth={200}
          cardHeight={265}
          radius={470}
          perspective={3000}
          mobileCardWidth={140}
          mobileCardHeight={186}
          mobileRadius={250}
          mobilePerspective={1500}
          autoRotateSpeed={0.05}
          maxBlur={5}
          showReflection
          showOrbit
          spotlight
          zoomable
          accentColor={luxe.gold}
          ctaLabel="Order online"
          addLabel="Add to cart"
          onAddToCart={handleAddToCart}
        />
      </div>
    </section>
  );
}
