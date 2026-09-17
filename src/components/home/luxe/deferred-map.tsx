"use client";

import { useEffect, useRef, useState } from "react";

const EMBED_SRC =
  "https://www.google.com/maps?q=948%20Clay%20Street%2C%20Oakland%2C%20CA%2094607&output=embed";

/**
 * The footer map, mounted only once it is actually scrolled near.
 *
 * `loading="lazy"` on the iframe was not enough: Chrome's lazy threshold is
 * generous enough that a mobile page load still pulled ~300 KiB of Google Maps
 * JS (`maps-api-v3/*`) before the page was interactive, and none of it is used
 * by anyone who never scrolls to the footer. Mounting the iframe behind an
 * IntersectionObserver keeps that cost off the critical path entirely.
 *
 * Until it mounts, the placeholder holds the exact same height, so there is no
 * layout shift, and the surrounding <a> still links to Google Maps — which is
 * the part crawlers and no-JS visitors care about anyway.
 */
export function DeferredMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref} className="w-full h-40">
      {show ? (
        <iframe
          title="Map to Annapurna — 948 Clay Street, Oakland CA 94607"
          src={EMBED_SRC}
          className="w-full h-40 pointer-events-none"
          style={{ border: 0, filter: "grayscale(0.2)" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div
          aria-hidden
          className="w-full h-40"
          style={{
            background:
              "repeating-linear-gradient(135deg, #1C1712 0 12px, #191410 12px 24px)",
          }}
        />
      )}
    </div>
  );
}
