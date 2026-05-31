"use client";

import Link from "next/link";
import { useState } from "react";
import { luxe } from "@/lib/theme";

const BTN =
  "font-medium uppercase tracking-[0.18em] text-[11px] px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition";

export function OrderCTA({ align = "left" }: { align?: "left" | "center" }) {
  const [showDelivery, setShowDelivery] = useState(false);

  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div
        className={`flex flex-wrap gap-3 ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        <Link
          href="/menu"
          className={BTN}
          style={{ backgroundColor: luxe.gold, color: luxe.bg }}
        >
          Order Pickup
        </Link>
        <button
          type="button"
          onClick={() => setShowDelivery((v) => !v)}
          aria-expanded={showDelivery}
          className={BTN}
          style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}
        >
          Order Delivery
        </button>
      </div>
      {showDelivery && (
        <p
          role="status"
          className="mt-3 text-[12px] tracking-wide"
          style={{ color: luxe.muted }}
        >
          Delivery is launching soon via DoorDash. For now, order pickup or call{" "}
          <a href="tel:+15102509696" style={{ color: luxe.gold }}>
            (510)&nbsp;250-9696
          </a>
          .
        </p>
      )}
    </div>
  );
}
