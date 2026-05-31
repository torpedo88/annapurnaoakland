import { LuxeHero } from "@/components/home/luxe/hero";
import { KitchenStatement } from "@/components/home/luxe/kitchen-statement";
import { SignatureGrid } from "@/components/home/luxe/signature-grid";
import { Craft } from "@/components/home/luxe/craft";
import { Visit } from "@/components/home/luxe/visit";
import { LuxeFooter } from "@/components/home/luxe/footer";

export default function HomePage() {
  return (
    <>
      <LuxeHero />
      <KitchenStatement />
      <SignatureGrid />
      <Craft />
      <Visit />
      <LuxeFooter />
    </>
  );
}
