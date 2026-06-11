"use client";

import { useEffect, useRef } from "react";

// Load Google Maps + Places once, then RESOLVE ONLY when the Places
// Autocomplete constructor is actually available. With loading=async the script
// onload fires before the places library finishes, so we poll until
// google.maps.places.Autocomplete exists — otherwise attaching races the
// library and the dropdown silently never appears.
let mapsReady: Promise<void> | null = null;
function loadMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ready = () => Boolean((window as any).google?.maps?.places?.Autocomplete);
  if (ready()) return Promise.resolve();
  if (mapsReady) return mapsReady;

  mapsReady = new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      if (ready()) return resolve();
      if (Date.now() - startedAt > 10000) return reject(new Error("Google Places timed out"));
      setTimeout(poll, 100);
    };
    const existing = document.querySelector<HTMLScriptElement>("script[data-gmaps]");
    if (existing) {
      poll();
      return;
    }
    const s = document.createElement("script");
    s.dataset.gmaps = "1";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
    s.async = true;
    s.onload = poll;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return mapsReady;
}

/**
 * US-restricted address input with Google Places autocomplete. Degrades to a
 * plain text input when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing, so checkout
 * always works. On selecting a suggestion it writes back the formatted address.
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
        if (cancelled || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        const Ctor = g?.maps?.places?.Autocomplete;
        if (!Ctor) return;
        ac = new Ctor(ref.current, {
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
