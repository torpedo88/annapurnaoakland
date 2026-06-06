import { BentoHero } from "@/components/home/bento-hero";
import { Specials } from "@/components/home/luxe/specials";
import { Popular } from "@/components/home/luxe/popular";
import { KitchenStatement } from "@/components/home/luxe/kitchen-statement";
import { Craft } from "@/components/home/luxe/craft";
import { Visit } from "@/components/home/luxe/visit";
import { LuxeFooter } from "@/components/home/luxe/footer";

export default function HomePage() {
  return (
    <>
      <BentoHero />
      <Specials />
      <Popular />
      <KitchenStatement />
      <Craft />
      <Visit />
      <LuxeFooter />
    </>
  );
}
