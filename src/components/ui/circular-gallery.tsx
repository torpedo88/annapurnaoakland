"use client";

import React, { useState, useEffect, useRef, HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  /** Optional destination for the zoom-view order button. */
  href?: string;
  /** Optional price, shown on the tile and in the zoom view, e.g. "$13.99". */
  price?: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Desktop ring geometry. */
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  perspective?: number;
  /** Mobile (<640px) ring geometry — tuned so prev/active/next are all visible. */
  mobileRadius?: number;
  mobileCardWidth?: number;
  mobileCardHeight?: number;
  mobilePerspective?: number;
  /** Continuous auto-rotation speed (deg/frame). Pauses on hover/drag/zoom. */
  autoRotateSpeed?: number;
  /** Max blur (px) on the tiles furthest from front (depth of field). */
  maxBlur?: number;
  showReflection?: boolean;
  showOrbit?: boolean;
  spotlight?: boolean;
  accentColor?: string;
  /** When true, clicking a tile opens a zoomed detail view instead of navigating. */
  zoomable?: boolean;
  /** Label for the order button in the zoom view (links to item.href). */
  ctaLabel?: string;
}

const DRAG_SENSITIVITY = 0.35;
const MOMENTUM_DECAY = 0.94;
const VELOCITY_MIN = 0.02;
const MOVE_THRESHOLD = 6; // px of drag before a press stops counting as a click
const MOBILE_MAX = 640;

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  (
    {
      items,
      className,
      radius = 600,
      cardWidth = 300,
      cardHeight = 400,
      perspective = 2000,
      mobileRadius,
      mobileCardWidth,
      mobileCardHeight,
      mobilePerspective,
      autoRotateSpeed = 0.03,
      maxBlur = 0,
      showReflection = false,
      showOrbit = false,
      spotlight = false,
      accentColor = "#C9A24B",
      zoomable = false,
      ctaLabel,
      ...props
    },
    ref,
  ) => {
    const [rotation, setRotation] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [zoomItem, setZoomItem] = useState<GalleryItem | null>(null);

    const rotationRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const draggingRef = useRef(false);
    const hoverRef = useRef(false);
    const lastPointerXRef = useRef(0);
    const downXRef = useRef(0);
    const movedRef = useRef(false);
    const velocityRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const reducedRef = useRef(false);
    const zoomRef = useRef(false);

    zoomRef.current = zoomItem !== null;

    // Resolve responsive geometry.
    const eff = {
      radius: isMobile && mobileRadius != null ? mobileRadius : radius,
      cardWidth:
        isMobile && mobileCardWidth != null ? mobileCardWidth : cardWidth,
      cardHeight:
        isMobile && mobileCardHeight != null ? mobileCardHeight : cardHeight,
      perspective:
        isMobile && mobilePerspective != null ? mobilePerspective : perspective,
    };

    const anglePerItem = items.length > 0 ? 360 / items.length : 0;

    useEffect(() => {
      setMounted(true);
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      reducedRef.current = mq.matches;
      const onMq = () => (reducedRef.current = mq.matches);
      mq.addEventListener("change", onMq);

      const onResize = () => setIsMobile(window.innerWidth < MOBILE_MAX);
      onResize();
      window.addEventListener("resize", onResize);
      return () => {
        mq.removeEventListener("change", onMq);
        window.removeEventListener("resize", onResize);
      };
    }, []);

    // Single loop: continuous auto-rotate, paused on hover/drag/zoom/reduced.
    useEffect(() => {
      const tick = () => {
        if (!draggingRef.current) {
          if (Math.abs(velocityRef.current) > VELOCITY_MIN) {
            dragOffsetRef.current += velocityRef.current;
            velocityRef.current *= MOMENTUM_DECAY;
          } else {
            velocityRef.current = 0;
            const paused =
              hoverRef.current || zoomRef.current || reducedRef.current;
            if (!paused) dragOffsetRef.current += autoRotateSpeed;
          }
        }
        const total = dragOffsetRef.current;
        if (Math.abs(total - rotationRef.current) > 0.001) {
          rotationRef.current = total;
          setRotation(total);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [autoRotateSpeed]);

    // Close the zoom view on Escape.
    useEffect(() => {
      if (!zoomItem) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setZoomItem(null);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [zoomItem]);

    const onPointerDown = (e: React.PointerEvent) => {
      draggingRef.current = true;
      movedRef.current = false;
      lastPointerXRef.current = e.clientX;
      downXRef.current = e.clientX;
      velocityRef.current = 0;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastPointerXRef.current;
      if (Math.abs(e.clientX - downXRef.current) > MOVE_THRESHOLD)
        movedRef.current = true;
      const delta = dx * DRAG_SENSITIVITY;
      dragOffsetRef.current += delta;
      velocityRef.current = reducedRef.current ? 0 : delta;
      lastPointerXRef.current = e.clientX;
    };
    const endDrag = () => {
      draggingRef.current = false;
    };

    const handleTileClick = (e: React.MouseEvent, item: GalleryItem) => {
      if (movedRef.current) {
        // It was a drag, not a click.
        e.preventDefault();
        return;
      }
      if (zoomable) {
        e.preventDefault();
        setZoomItem(item);
      }
    };

    const totalRotation = ((rotation % 360) + 360) % 360;
    let activeIndex = 0;
    let minAngle = Infinity;
    items.forEach((_, i) => {
      const rel = (i * anglePerItem + totalRotation) % 360;
      const norm = Math.abs(rel > 180 ? 360 - rel : rel);
      if (norm < minAngle) {
        minAngle = norm;
        activeIndex = i;
      }
    });

    const compact = eff.cardWidth < 240;

    return (
      <>
        <div
          ref={ref}
          role="region"
          aria-label="Circular 3D Gallery"
          className={cn(
            "relative w-full h-full flex items-center justify-center select-none touch-pan-y",
            className,
          )}
          style={{ perspective: `${eff.perspective}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseEnter={() => (hoverRef.current = true)}
          onMouseLeave={() => {
            hoverRef.current = false;
            endDrag();
          }}
          {...props}
        >
          {spotlight && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: eff.cardWidth * 3,
                height: eff.cardWidth * 3,
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
            {showOrbit && (
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: eff.radius * 2,
                  height: eff.radius * 2,
                  marginLeft: -eff.radius,
                  marginTop: -eff.radius,
                  border: `1px solid ${accentColor}40`,
                  transform: `translateY(${eff.cardHeight / 2}px) rotateX(80deg)`,
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
              const blur =
                maxBlur > 0 ? (normalizedAngle / 180) * maxBlur : 0;
              const clickable = opacity > 0.6;
              const isActive = i === activeIndex;

              return (
                <button
                  key={item.photo.url}
                  type="button"
                  aria-label={`${item.common}${item.price ? `, ${item.price}` : ""}`}
                  onClick={(e) => handleTileClick(e, item)}
                  className="absolute block p-0 border-0 bg-transparent cursor-pointer"
                  style={{
                    width: eff.cardWidth,
                    height: eff.cardHeight,
                    transform: `rotateY(${itemAngle}deg) translateZ(${eff.radius}px)`,
                    left: "50%",
                    top: "50%",
                    marginLeft: -eff.cardWidth / 2,
                    marginTop: -eff.cardHeight / 2,
                    opacity,
                    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                    transition: "opacity 0.3s linear, filter 0.3s linear",
                    pointerEvents: clickable ? "auto" : "none",
                  }}
                >
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
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: item.photo.pos || "center" }}
                    />
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 w-full text-left bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white",
                        compact ? "p-3" : "p-4",
                      )}
                    >
                      <h2
                        className={cn(
                          "font-bold leading-tight",
                          compact ? "text-sm" : "text-xl",
                        )}
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
                      {item.price && (
                        <div
                          className={cn(
                            "font-semibold",
                            compact ? "mt-0.5 text-xs" : "mt-1 text-sm",
                          )}
                          style={{ color: accentColor }}
                        >
                          {item.price}
                        </div>
                      )}
                    </div>
                  </div>

                  {showReflection && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-0 w-full overflow-hidden block"
                      style={{
                        top: "100%",
                        height: eff.cardHeight * 0.5,
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
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: item.photo.pos || "center" }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showOrbit && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {items.map((item, i) => (
                <span
                  key={item.photo.url}
                  aria-hidden
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

        {/* Zoom detail view */}
        {mounted &&
          zoomItem &&
          createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={zoomItem.common}
              onClick={() => setZoomItem(null)}
            >
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                aria-hidden
              />
              <div
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
                style={{ borderColor: `${accentColor}55`, backgroundColor: "#14100D" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setZoomItem(null)}
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white text-xl leading-none hover:bg-black/70"
                >
                  ×
                </button>
                <div className="relative aspect-[4/3] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={zoomItem.photo.url}
                    alt={zoomItem.photo.text}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: zoomItem.photo.pos || "center" }}
                  />
                </div>
                <div className="p-5 text-white">
                  <h3 className="font-serif text-2xl font-bold">
                    {zoomItem.common}
                  </h3>
                  <p className="mt-1 italic opacity-75">{zoomItem.binomial}</p>
                  {zoomItem.price && (
                    <p
                      className="mt-2 text-lg font-semibold"
                      style={{ color: accentColor }}
                    >
                      {zoomItem.price}
                    </p>
                  )}
                  {zoomItem.href && ctaLabel && (
                    <Link
                      href={zoomItem.href}
                      className="mt-4 inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                      style={{ backgroundColor: accentColor, color: "#14100D" }}
                    >
                      {ctaLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}
      </>
    );
  },
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
