"use client";

import Link from "next/link";
import { luxe } from "@/lib/theme";

const BTN =
  "font-medium uppercase tracking-[0.18em] text-[11px] px-6 py-3.5 rounded-[2px] inline-flex items-center justify-center transition";

// Remember the customer's pickup/delivery intent so checkout can preselect it.
function setPref(f: "pickup" | "delivery") {
  try { localStorage.setItem("annapurna:fulfillment", f); } catch { /* ignore */ }
}

export function OrderCTA({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div className={`flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
        <Link
          href="/menu"
          onClick={() => setPref("pickup")}
          className={BTN}
          style={{ backgroundColor: luxe.gold, color: luxe.bg }}
        >
          Order Pickup
        </Link>
        <Link
          href="/menu"
          onClick={() => setPref("delivery")}
          className={BTN}
          style={{ border: `1px solid ${luxe.gold}`, color: luxe.gold }}
        >
          Order Delivery
        </Link>
      </div>
    </div>
  );
}
