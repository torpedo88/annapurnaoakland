import { GalleryHero } from "@/components/home/gallery-hero";
import { Specials } from "@/components/home/luxe/specials";
import { Popular } from "@/components/home/luxe/popular";
import { Testimonials } from "@/components/home/luxe/testimonials";
import { Visit } from "@/components/home/luxe/visit";
import { Faq } from "@/components/home/faq";
import { LuxeFooter } from "@/components/home/luxe/footer";

// Specials, Popular and Testimonials read the DB / Google reviews on the server
// so their content is in the HTML (crawlable, and no post-load layout shift).
// ISR keeps that off the request path: the page is rendered once and served
// from the edge cache, re-rendered at most every 5 minutes.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <GalleryHero />
      <Specials />
      <Popular />
      <Testimonials />
      <Visit />
      <Faq />
      <LuxeFooter />
    </>
  );
}
