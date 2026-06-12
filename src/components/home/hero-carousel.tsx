"use client";

import { useEffect, useRef, useState } from "react";

export type Frame = { type: "video" | "image"; src: string; alt?: string };

const INTERVAL = 5000;

/**
 * Clean rotating hero: one large frame that crossfades between a few visuals
 * (videos + a signature shot). Replaces the busy bento mosaic.
 */
export function HeroCarousel({ frames }: { frames: Frame[] }) {
  const [idx, setIdx] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (frames.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), INTERVAL);
    return () => clearInterval(t);
  }, [frames.length]);

  // Play only the active video; pause the others.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) { v.play().catch(() => {}); } else { v.pause(); }
    });
  }, [idx]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <div
        className="relative w-full overflow-hidden rounded-[1.75rem]"
        style={{
          aspectRatio: "16 / 10",
          border: "1px solid rgba(201,162,75,0.18)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        {frames.map((f, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === idx ? 1 : 0 }}
            aria-hidden={i !== idx}
          >
            {f.type === "video" ? (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                className="h-full w-full object-cover"
                src={f.src}
                muted
                loop
                playsInline
                preload="auto"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.src} alt={f.alt ?? ""} className="h-full w-full object-cover" />
            )}
            {/* subtle bottom shading for depth */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 55%, rgba(20,16,13,0.55) 100%)" }}
            />
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {frames.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show frame ${i + 1}`}
              onClick={() => setIdx(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === idx ? 22 : 8,
                backgroundColor: i === idx ? "#C9A24B" : "rgba(243,233,214,0.5)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
