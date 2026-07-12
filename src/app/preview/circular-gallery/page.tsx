import { CircularGallery, GalleryItem } from "@/components/ui/circular-gallery";
import { OrderCTA } from "@/components/home/luxe/order-cta";
import { luxe } from "@/lib/theme";

// Preview route for the 3D CircularGallery, filled with Higgsfield-generated
// dish images in /public/images/ai-dishes (the real photos stay in
// /public/images/dishes). It auto-rotates horizontally, pauses on hover, can be
// dragged to spin, and a tap opens a zoomed detail view with an order button.
// Mobile geometry is tuned so previous/active/next tiles are all visible. Prices
// are representative placeholders. View at /preview/circular-gallery.
const galleryData: GalleryItem[] = [
  { common: "Jhol Momo", binomial: "Steamed Nepali dumplings", href: "/menu", price: "$13.99", photo: { url: "/images/ai-dishes/momo.jpg", text: "Steamed momo dumplings", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Butter Chicken", binomial: "Murgh makhani", href: "/menu", price: "$16.99", photo: { url: "/images/ai-dishes/butterChicken.jpg", text: "Butter chicken in creamy tomato gravy", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Lamb Biryani", binomial: "Fragrant basmati & spice", href: "/menu", price: "$18.99", photo: { url: "/images/ai-dishes/lambBiryani.jpg", text: "Lamb biryani", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Palak Paneer", binomial: "Spinach & house cheese", href: "/menu", price: "$14.99", photo: { url: "/images/ai-dishes/palakPaneer.jpg", text: "Palak paneer", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Mixed Tandoori", binomial: "Clay-oven grill", href: "/menu", price: "$21.99", photo: { url: "/images/ai-dishes/mixedTandoori.jpg", text: "Mixed tandoori platter", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Chhoila", binomial: "Newari grilled chicken", href: "/menu", price: "$12.99", photo: { url: "/images/ai-dishes/chhoila.jpg", text: "Chhoila", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Chicken Tikka Masala", binomial: "Charred, simmered in masala", href: "/menu", price: "$16.99", photo: { url: "/images/ai-dishes/chickenTikkaMasala.jpg", text: "Chicken tikka masala", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Dal Makhani", binomial: "Slow-cooked black lentils", href: "/menu", price: "$13.99", photo: { url: "/images/ai-dishes/dalMakhani.jpg", text: "Dal makhani", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Mango Lassi", binomial: "Yogurt & Alphonso mango", href: "/menu", price: "$5.99", photo: { url: "/images/ai-dishes/mangoLassi.jpg", text: "Mango lassi", pos: "center", by: "Annapurna Kitchen" } },
  { common: "Gulab Jamun", binomial: "Rose-cardamom syrup", href: "/menu", price: "$6.99", photo: { url: "/images/ai-dishes/gulabJamun.jpg", text: "Gulab jamun", pos: "center", by: "Annapurna Kitchen" } },
];

export default function CircularGalleryPreview() {
  return (
    <section
      className="relative w-full min-h-screen overflow-hidden text-foreground flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 22%, #2a1a10 0%, #16110c 48%, #0d0906 100%)",
      }}
    >
      {/* Vignette — darkens the edges to focus the ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Annapurna snow-peak silhouette along the base. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 w-full z-0"
        style={{ height: "34vh", opacity: 0.9 }}
      >
        <path
          d="M0,260 L0,150 L180,60 L300,120 L470,20 L560,90 L720,10 L840,95 L980,35 L1120,110 L1250,55 L1440,140 L1440,260 Z"
          fill="#120d09"
        />
        <path
          d="M470,20 L520,55 L500,60 L540,80 L470,45 L440,70 L470,20 Z M720,10 L775,50 L748,55 L792,78 L720,40 L688,66 L720,10 Z M980,35 L1022,68 L1000,72 L1035,92 L980,58 L952,80 L980,35 Z"
          fill={luxe.ink}
          opacity={0.55}
        />
        <path
          d="M0,150 L180,60 L300,120 L470,20 L560,90 L720,10 L840,95 L980,35 L1120,110 L1250,55 L1440,140"
          fill="none"
          stroke={luxe.gold}
          strokeOpacity={0.3}
          strokeWidth={1.5}
        />
      </svg>

      {/* Heading + Order CTAs. */}
      <div className="text-center absolute top-14 z-20 px-4 flex flex-col items-center gap-5">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.32em] mb-3"
            style={{ color: luxe.gold }}
          >
            Old Oakland · Indian &amp; Nepalese
          </p>
          <h1
            className="font-serif text-4xl sm:text-5xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(180deg, ${luxe.ink} 0%, ${luxe.gold} 65%, ${luxe.ember} 100%)`,
            }}
          >
            Our Signature Dishes
          </h1>
          <p className="mt-2 text-sm" style={{ color: luxe.muted }}>
            Hover to pause · drag to spin · tap a dish to view
          </p>
        </div>
        <OrderCTA align="center" />
      </div>

      {/* The 3D ring. */}
      <div className="w-full h-screen z-10">
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
        />
      </div>
    </section>
  );
}
