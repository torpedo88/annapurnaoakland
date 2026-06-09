"use client";

import { useEffect, useRef } from "react";

// Lazily load the Google Maps JS Places library exactly once per page.
let mapsPromise: Promise<void> | null = null;
function loadMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

/**
 * US-restricted address input with Google Places autocomplete. When no
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured it degrades to a plain text
 * input, so checkout always works. On selecting a suggestion it writes back the
 * USPS-style formatted address.
 */
export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!key || !ref.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ac: any;
    let cancelled = false;
    loadMaps(key)
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        if (cancelled || !g?.maps?.places || !ref.current) return;
        ac = new g.maps.places.Autocomplete(ref.current, {
          componentRestrictions: { country: "us" },
          fields: ["formatted_address"],
          types: ["address"],
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (place?.formatted_address) onChangeRef.current(place.formatted_address);
        });
      })
      .catch(() => { /* fall back to plain input */ });
    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (ac && g?.maps?.event) g.maps.event.clearInstanceListeners(ac);
    };
  }, [key]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="text"
      autoComplete="off"
      placeholder={placeholder}
      className={className}
      style={style}
    />
  );
}
