import { HeroSection } from "@/components/home/hero-section";
import { FeaturedDishes } from "@/components/home/featured-dishes";
import { StorySection } from "@/components/home/story-section";
import { InfoSection } from "@/components/home/info-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedDishes />
      <StorySection />
      <InfoSection />
    </>
  );
}
