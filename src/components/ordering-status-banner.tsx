"use client";

import { useEffect, useState } from "react";
import { isOrderingOpen, type OrderingWindow } from "@/lib/orders/hours";

/**
 * Shows a warm banner when the restaurant isn't taking online orders (Sundays,
 * before 11 AM, or within 10 min of close). Computes the window in the
 * restaurant's timezone client-side. Renders nothing while open. Starts null so
 * SSR + first client render match (no hydration mismatch), then fills on mount.
 */
export function OrderingStatusBanner() {
  const [win, setWin] = useState<OrderingWindow | null>(null);

  useEffect(() => {
    const check = () => setWin(isOrderingOpen());
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!win || win.open) return null;

  return (
    <div
      role="status"
      className="mx-auto mb-6 flex max-w-3xl items-center gap-3 rounded-full px-5 py-3 text-sm"
      style={{
        backgroundColor: "rgba(201,162,75,0.10)",
        border: "1px solid rgba(201,162,75,0.35)",
        color: "#F3E9D6",
      }}
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: "#E0A458" }}
        aria-hidden="true"
      />
      <span>
        <strong style={{ color: "#C9A24B" }}>Online ordering is closed.</strong>{" "}
        {win.reason} You can still browse the menu.
      </span>
    </div>
  );
}
