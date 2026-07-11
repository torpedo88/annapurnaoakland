"use client";

import React, { useState, useEffect, useRef, HTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  /** Optional destination — when set the whole tile (and its Add button) links here. */
  href?: string;
  /** Optional price shown on the active (front) tile, e.g. "$13.99". */
  price?: string;
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
  /** Idle auto-rotation speed (deg/frame). Ignored while `snap` settles a tile. */
  autoRotateSpeed?: number;
  /** Tile width in px. */
  cardWidth?: number;
  /** Tile height in px. */
  cardHeight?: number;
  /** CSS perspective in px — higher = flatter, less front-tile magnification. */
  perspective?: number;
  /** Max blur (px) applied to the tiles furthest from front (depth of field). */
  maxBlur?: number;
  /** Mirror reflection beneath each tile. */
  showReflection?: boolean;
  /** Gold orbit ring on the floor + pagination dots. */
  showOrbit?: boolean;
  /** Warm radial glow behind the front tile. */
  spotlight?: boolean;
  /** When idle, ease the nearest tile to front and rest there (stable active tile). */
  snap?: boolean;
  /** Accent color for glow, active border, orbit, dots. */
  accentColor?: string;
  /** Label for the Add button revealed on the active tile (needs item.href). */
  ctaLabel?: string;
}

const DRAG_SENSITIVITY = 0.35; // deg per px dragged
const MOMENTUM_DECAY = 0.94;
const SNAP_EASE = 0.12;
const VELOCITY_MIN = 0.02;

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
      maxBlur = 0,
      showReflection = false,
      showOrbit = false,
      spotlight = false,
      snap = false,
      accentColor = "#C9A24B",
      ctaLabel,
      ...props
    },
    ref,
  ) => {
    const [rotation, setRotation] = useState(0);

    // Refs drive the single RAF loop; state only mirrors rotation for rendering.
    const rotationRef = useRef(0);
    const lastRenderedRef = useRef(0);
    const scrollRotRef = useRef(0);
    const driftRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const draggingRef = useRef(false);
    const lastPointerXRef = useRef(0);
    const velocityRef = useRef(0);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const reducedRef = useRef(false);

    const anglePerItem = items.length > 0 ? 360 / items.length : 0;
    const step = anglePerItem;

    // Honour reduced-motion: no idle drift, minimal easing.
    useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      reducedRef.current = mq.matches;
      const on = () => {
        reducedRef.current = mq.matches;
      };
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    }, []);

    // Scroll drives the base rotation (the page's scroll-to-rotate mechanic).
    useEffect(() => {
      const handleScroll = () => {
        isScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress =
          scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        scrollRotRef.current = scrollProgress * 360;

        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, []);

    // Single animation loop: composes scroll + drag(+momentum/snap) + idle drift.
    useEffect(() => {
      const tick = () => {
        if (!draggingRef.current) {
          if (Math.abs(velocityRef.current) > VELOCITY_MIN) {
            // momentum glide after a fling
            dragOffsetRef.current += velocityRef.current;
            velocityRef.current *= MOMENTUM_DECAY;
          } else {
            velocityRef.current = 0;
            if (!isScrollingRef.current) {
              if (snap) {
                const total =
                  scrollRotRef.current +
                  dragOffsetRef.current +
                  driftRef.current;
                const nearest = Math.round(total / step) * step;
                const diff = nearest - total;
                if (Math.abs(diff) > 0.05) {
                  dragOffsetRef.current += diff * SNAP_EASE;
                }
              } else if (autoRotateSpeed && !reducedRef.current) {
                driftRef.current += autoRotateSpeed;
              }
            }
          }
        }

        const total =
          scrollRotRef.current + dragOffsetRef.current + driftRef.current;
        rotationRef.current = total;
        if (Math.abs(total - lastRenderedRef.current) > 0.001) {
          lastRenderedRef.current = total;
          setRotation(total);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [snap, autoRotateSpeed, step]);

    // Pointer drag-to-spin.
    const onPointerDown = (e: React.PointerEvent) => {
      draggingRef.current = true;
      lastPointerXRef.current = e.clientX;
      velocityRef.current = 0;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastPointerXRef.current;
      const delta = dx * DRAG_SENSITIVITY;
      dragOffsetRef.current += delta;
      velocityRef.current = reducedRef.current ? 0 : delta;
      lastPointerXRef.current = e.clientX;
    };
    const endDrag = () => {
      draggingRef.current = false;
    };

    // Rotate a specific item to the front (pagination dot click).
    const goTo = (i: number) => {
      const total =
        scrollRotRef.current + dragOffsetRef.current + driftRef.current;
      const target = -i * step;
      // nearest equivalent target to avoid a long spin
      const k = Math.round((total - target) / 360);
      dragOffsetRef.current += target + k * 360 - total;
      velocityRef.current = 0;
    };

    // Which tile is at the front right now.
    let activeIndex = 0;
    let minAngle = Infinity;
    const totalRotation = ((rotation % 360) + 360) % 360;
    items.forEach((_, i) => {
      const rel = (i * anglePerItem + totalRotation) % 360;
      const norm = Math.abs(rel > 180 ? 360 - rel : rel);
      if (norm < minAngle) {
        minAngle = norm;
        activeIndex = i;
      }
    });
    const moving =
      isScrollingRef.current ||
      draggingRef.current ||
      Math.abs(velocityRef.current) > 0.15;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative w-full h-full flex items-center justify-center select-none touch-pan-y",
          className,
        )}
        style={{ perspective: `${perspective}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        {...props}
      >
        {/* Warm spotlight behind the front tile */}
        {spotlight && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: cardWidth * 3,
              height: cardWidth * 3,
              background: `radial-gradient(circle, ${accentColor}33 0%, ${accentColor}14 30%, transparent 68%)`,
              filter: "blur(24px)",
            }}
          />
        )}

        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Gold orbit ring on the floor */}
          {showOrbit && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: radius * 2,
                height: radius * 2,
                marginLeft: -radius,
                marginTop: -radius,
                border: `1px solid ${accentColor}40`,
                transform: `translateY(${cardHeight / 2}px) rotateX(80deg)`,
                transformStyle: "preserve-3d",
              }}
            />
          )}

          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const relativeAngle = (itemAngle + totalRotation) % 360;
            const normalizedAngle = Math.abs(
              relativeAngle > 180 ? 360 - relativeAngle : relativeAngle,
            );
            const opacity = Math.max(0.3, 1 - normalizedAngle / 180);
            const blur = maxBlur > 0 ? (normalizedAngle / 180) * maxBlur : 0;
            // Only near-front tiles catch clicks so back tiles can't steal them.
            const clickable = opacity > 0.6;
            const compact = cardWidth < 240;
            const isActive = i === activeIndex;
            const showCta = isActive && !moving && !!item.href && !!ctaLabel;

            const card = (
              <div
                className={cn(
                  "relative w-full h-full rounded-lg shadow-2xl overflow-hidden group border bg-card/70 dark:bg-card/30 backdrop-blur-lg transition-all duration-300",
                  isActive ? "border-transparent" : "border-border",
                )}
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 0 2px ${accentColor}, 0 18px 50px -12px ${accentColor}80`,
                      }
                    : undefined
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.photo.url}
                  alt={item.photo.text}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: item.photo.pos || "center" }}
                />
                <div
                  className={cn(
                    "absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white",
                    compact ? "p-3" : "p-4",
                  )}
                >
                  <h2
                    className={cn("font-bold leading-tight", compact ? "text-sm" : "text-xl")}
                  >
                    {item.common}
                  </h2>
                  <em
                    className={cn(
                      "italic opacity-80 block",
                      compact ? "text-[11px]" : "text-sm",
                    )}
                  >
                    {item.binomial}
                  </em>

                  {/* Active-tile price + Add button */}
                  {item.price && (
                    <div
                      className="mt-1.5 font-semibold"
                      style={{ color: accentColor }}
                    >
                      {item.price}
                    </div>
                  )}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      showCta ? "mt-2 max-h-12 opacity-100" : "mt-0 max-h-0 opacity-0",
                    )}
                  >
                    {item.href && ctaLabel && (
                      // A span, not a link — the whole tile is already the <a>,
                      // so nesting an anchor here would be invalid HTML.
                      <span
                        className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ backgroundColor: accentColor, color: "#14100D" }}
                      >
                        {ctaLabel}
                      </span>
                    )}
                  </div>
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
                  opacity,
                  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                  transition: "opacity 0.3s linear, filter 0.3s linear",
                  pointerEvents: clickable ? "auto" : "none",
                }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-label={item.common}
                    className="block w-full h-full"
                    draggable={false}
                    onClick={(e) => {
                      // Suppress the click that ends a drag-fling.
                      if (Math.abs(velocityRef.current) > 0.5) e.preventDefault();
                    }}
                  >
                    {card}
                  </Link>
                ) : (
                  card
                )}

                {/* Mirror reflection beneath the tile */}
                {showReflection && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-0 w-full overflow-hidden"
                    style={{
                      top: "100%",
                      height: cardHeight * 0.5,
                      transform: "scaleY(-1)",
                      transformOrigin: "top",
                      WebkitMaskImage:
                        "linear-gradient(to top, rgba(0,0,0,0.45), transparent 70%)",
                      maskImage:
                        "linear-gradient(to top, rgba(0,0,0,0.45), transparent 70%)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photo.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: item.photo.pos || "center" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination dots */}
        {showOrbit && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.photo.url}
                type="button"
                aria-label={`Show ${item.common}`}
                onClick={() => goTo(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === activeIndex ? 22 : 6,
                  backgroundColor:
                    i === activeIndex ? accentColor : `${accentColor}55`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
