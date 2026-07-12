import { GalleryHero } from "@/components/home/gallery-hero";

// Isolated preview of the homepage gallery hero. The hero itself now lives in
// GalleryHero (used on the landing page); this route just renders it on its own
// for testing. robots.ts disallows /preview so it's never indexed.
export default function CircularGalleryPreview() {
  return <GalleryHero />;
}
