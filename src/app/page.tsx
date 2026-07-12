import { GalleryHero } from "@/components/home/gallery-hero";
import { Specials } from "@/components/home/luxe/specials";
import { Popular } from "@/components/home/luxe/popular";
import { KitchenStatement } from "@/components/home/luxe/kitchen-statement";
import { Testimonials } from "@/components/home/luxe/testimonials";
import { Visit } from "@/components/home/luxe/visit";
import { Faq } from "@/components/home/faq";
import { LuxeFooter } from "@/components/home/luxe/footer";

export default function HomePage() {
  return (
    <>
      <GalleryHero />
      <Specials />
      <Popular />
      <KitchenStatement />
      <Testimonials />
      <Visit />
      <Faq />
      <LuxeFooter />
    </>
  );
}
