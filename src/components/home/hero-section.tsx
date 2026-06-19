import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-primary-dark text-primary-foreground">
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #8B4513 0%, #5C2E0A 40%, #2D1505 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
          Taste of the Himalayas
        </h1>
        <p className="mt-4 text-lg text-primary-foreground/80 sm:text-xl">
          Authentic Indian &amp; Nepalese cuisine — hand-crafted momos, tandoori
          specialties, and rich curries, served with heart in the heart of Oakland.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" render={<Link href="/menu" />}>
            Order Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            render={<Link href="/reservations" />}
          >
            Reserve a Table
          </Button>
        </div>
      </div>

      {/* Mountain silhouette SVG */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          style={{ display: "block" }}
        >
          <path
            d="M0,120 L0,80 L120,40 L240,70 L360,20 L480,60 L600,10 L720,50 L840,15 L960,55 L1080,25 L1200,65 L1320,35 L1440,70 L1440,120 Z"
            fill="var(--color-background, #FAF7F2)"
          />
        </svg>
      </div>
    </section>
  );
}
