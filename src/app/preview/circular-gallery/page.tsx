import { CircularGallery, GalleryItem } from "@/components/ui/circular-gallery";
import { OrderCTA } from "@/components/home/luxe/order-cta";

// Preview route for the 3D CircularGallery, filled with Annapurna's own dish
// photos from /public/images/dishes. Tiles are small + clickable (each links to
// /menu). The Order Pickup / Order Delivery CTAs sit above the carousel. Scroll
// to rotate; it also auto-rotates slowly when idle. View at
// /preview/circular-gallery.
const galleryData: GalleryItem[] = [
  {
    common: "Jhol Momo",
    binomial: "Steamed Nepali dumplings",
    href: "/menu",
    photo: { url: "/images/dishes/momo.jpg", text: "Steamed momo dumplings", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Butter Chicken",
    binomial: "Murgh makhani",
    href: "/menu",
    photo: { url: "/images/dishes/butterChicken.jpg", text: "Butter chicken in creamy tomato gravy", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Lamb Biryani",
    binomial: "Fragrant basmati & spice",
    href: "/menu",
    photo: { url: "/images/dishes/lambBiryani.jpg", text: "Lamb biryani", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Palak Paneer",
    binomial: "Spinach & house cheese",
    href: "/menu",
    photo: { url: "/images/dishes/palakPaneer.jpg", text: "Palak paneer", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Mixed Tandoori",
    binomial: "Clay-oven grill",
    href: "/menu",
    photo: { url: "/images/dishes/mixedTandoori.jpg", text: "Mixed tandoori platter", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Chhoila",
    binomial: "Newari grilled chicken",
    href: "/menu",
    photo: { url: "/images/dishes/chhoila.jpg", text: "Chhoila", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Chicken Tikka Masala",
    binomial: "Charred, simmered in masala",
    href: "/menu",
    photo: { url: "/images/dishes/chickenTikkaMasala.jpg", text: "Chicken tikka masala", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Dal Makhani",
    binomial: "Slow-cooked black lentils",
    href: "/menu",
    photo: { url: "/images/dishes/dalMakhani.jpg", text: "Dal makhani", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Mango Lassi",
    binomial: "Yogurt & Alphonso mango",
    href: "/menu",
    photo: { url: "/images/dishes/mangoLassi.jpg", text: "Mango lassi", pos: "center", by: "Annapurna Kitchen" },
  },
  {
    common: "Gulab Jamun",
    binomial: "Rose-cardamom syrup",
    href: "/menu",
    photo: { url: "/images/dishes/gulabJamun.jpg", text: "Gulab jamun", pos: "center", by: "Annapurna Kitchen" },
  },
];

export default function CircularGalleryPreview() {
  return (
    // The outer container provides the scrollable height that drives rotation.
    <div className="w-full bg-background text-foreground" style={{ height: "500vh" }}>
      {/* The inner container sticks to the top while scrolling. */}
      <div className="w-full h-screen sticky top-0 flex flex-col items-center justify-center overflow-hidden">
        <div className="text-center mb-8 absolute top-16 z-10 px-4 flex flex-col items-center gap-5">
          <div>
            <h1 className="font-serif text-4xl font-bold">Our Signature Dishes</h1>
            <p className="text-muted-foreground">Tap a dish to order — scroll to rotate</p>
          </div>
          {/* Order Pickup / Order Delivery — kept above the carousel. */}
          <OrderCTA align="center" />
        </div>
        <div className="w-full h-full">
          <CircularGallery
            items={galleryData}
            cardWidth={160}
            cardHeight={210}
            radius={480}
            perspective={3400}
          />
        </div>
      </div>
    </div>
  );
}
