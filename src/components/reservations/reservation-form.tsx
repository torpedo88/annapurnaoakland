"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

export function ReservationForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const f = new FormData(e.currentTarget);
    const payload = {
      customerName: f.get("customerName"),
      customerPhone: f.get("customerPhone"),
      customerEmail: f.get("customerEmail"),
      date: f.get("date"),
      timeSlot: f.get("timeSlot"),
      partySize: Number(f.get("partySize")) || undefined,
      specialRequests: f.get("specialRequests"),
    };
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Something went wrong. Please call us at (510) 250-9696.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error. Please call us at (510) 250-9696.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-input bg-card p-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-foreground">Table request received</h2>
        <p className="mt-3 text-muted-foreground">
          Thank you! We&apos;ll call or text to confirm your table shortly. For same-day or urgent
          requests, reach us at{" "}
          <a href="tel:+15102509696" className="font-semibold text-primary hover:underline">
            (510) 250-9696
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="customerName" className={labelCls}>Name</label>
        <input id="customerName" name="customerName" required autoComplete="name" className={inputCls} placeholder="Your name" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="customerPhone" className={labelCls}>Phone</label>
          <input id="customerPhone" name="customerPhone" type="tel" required autoComplete="tel" className={inputCls} placeholder="(510) 555-0123" />
        </div>
        <div>
          <label htmlFor="customerEmail" className={labelCls}>Email <span className="text-muted-foreground">(optional)</span></label>
          <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" className={inputCls} placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className={labelCls}>Date</label>
          <input id="date" name="date" type="date" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="timeSlot" className={labelCls}>Time</label>
          <input id="timeSlot" name="timeSlot" type="time" className={inputCls} />
        </div>
        <div>
          <label htmlFor="partySize" className={labelCls}>Party size</label>
          <input id="partySize" name="partySize" type="number" min={1} max={40} className={inputCls} placeholder="2" />
        </div>
      </div>
      <div>
        <label htmlFor="specialRequests" className={labelCls}>Special requests <span className="text-muted-foreground">(optional)</span></label>
        <textarea id="specialRequests" name="specialRequests" rows={3} className={inputCls} placeholder="Allergies, occasion, seating preference…" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
        {status === "submitting" ? "Sending…" : "Request a table"}
      </Button>
      <p className="text-xs text-muted-foreground">
        We hold tables Mon–Sat, 11:00 AM–9:30 PM. We&apos;ll confirm by phone. Prefer to call?{" "}
        <a href="tel:+15102509696" className="font-medium text-primary hover:underline">(510) 250-9696</a>.
      </p>
    </form>
  );
}
