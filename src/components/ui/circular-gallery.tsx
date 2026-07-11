"use client";

import React, { useState, useEffect, useRef, HTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  /** Optional destination — when set the whole tile becomes a link. */
  href?: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
  /** Tile width in px. */
  cardWidth?: number;
  /** Tile height in px. */
  cardHeight?: number;
  /** CSS perspective in px — higher = flatter, less front-tile magnification. */
  perspective?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  (
    {
      items,
      className,
      radius = 600,
      autoRotateSpeed = 0.02,
      cardWidth = 300,
      cardHeight = 400,
      perspective = 2000,
      ...props
    },
    ref,
  ) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Effect to handle scroll-based rotation
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress =
          scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        const scrollRotation = scrollProgress * 360;
        setRotation(scrollRotation);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // Effect for auto-rotation when not scrolling
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) {
          setRotation((prev) => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isScrolling, autoRotateSpeed]);

    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative w-full h-full flex items-center justify-center",
          className,
        )}
        style={{ perspective: `${perspective}px` }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(
              relativeAngle > 180 ? 360 - relativeAngle : relativeAngle,
            );
            const opacity = Math.max(0.3, 1 - normalizedAngle / 180);
            // Only front-facing tiles catch clicks, so tiles rotated to the back
            // can't intercept the pointer through the carousel.
            const clickable = opacity > 0.6;
            const compact = cardWidth < 240;

            const card = (
              <div className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden group border border-border bg-card/70 dark:bg-card/30 backdrop-blur-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.photo.url}
                  alt={item.photo.text}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ objectPosition: item.photo.pos || "center" }}
                />
                <div
                  className={cn(
                    "absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white",
                    compact ? "p-2.5" : "p-4",
                  )}
                >
                  <h2 className={cn("font-bold", compact ? "text-sm" : "text-xl")}>
                    {item.common}
                  </h2>
                  <em
                    className={cn(
                      "italic opacity-80",
                      compact ? "text-[11px]" : "text-sm",
                    )}
                  >
                    {item.binomial}
                  </em>
                  {!compact && (
                    <p className="text-xs mt-2 opacity-70">
                      Photo by: {item.photo.by}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={item.photo.url}
                role="group"
                aria-label={item.common}
                className="absolute"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: "50%",
                  top: "50%",
                  marginLeft: -cardWidth / 2,
                  marginTop: -cardHeight / 2,
                  opacity: opacity,
                  transition: "opacity 0.3s linear",
                  pointerEvents: clickable ? "auto" : "none",
                }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-label={item.common}
                    className="block w-full h-full"
                  >
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
