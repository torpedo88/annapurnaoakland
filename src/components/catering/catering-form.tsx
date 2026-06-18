"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

export function CateringForm() {
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
      eventDate: f.get("eventDate"),
      partySize: Number(f.get("partySize")) || undefined,
      budgetRange: f.get("budgetRange"),
      dietaryNeeds: f.get("dietaryNeeds"),
      details: f.get("details"),
    };
    try {
      const res = await fetch("/api/catering", {
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
        <h2 className="font-serif text-2xl font-bold text-foreground">Catering request received</h2>
        <p className="mt-3 text-muted-foreground">
          Thanks! We&apos;ll review your event and get back to you with a quote. Questions? Call{" "}
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
          <input id="customerPhone" name="customerPhone" type="tel" autoComplete="tel" className={inputCls} placeholder="(510) 555-0123" />
        </div>
        <div>
          <label htmlFor="customerEmail" className={labelCls}>Email</label>
          <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" className={inputCls} placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="eventDate" className={labelCls}>Event date</label>
          <input id="eventDate" name="eventDate" type="date" className={inputCls} />
        </div>
        <div>
          <label htmlFor="partySize" className={labelCls}>Guests</label>
          <input id="partySize" name="partySize" type="number" min={1} max={1000} className={inputCls} placeholder="25" />
        </div>
        <div>
          <label htmlFor="budgetRange" className={labelCls}>Budget <span className="text-muted-foreground">(optional)</span></label>
          <input id="budgetRange" name="budgetRange" className={inputCls} placeholder="$500–$1000" />
        </div>
      </div>
      <div>
        <label htmlFor="dietaryNeeds" className={labelCls}>Dietary needs <span className="text-muted-foreground">(optional)</span></label>
        <input id="dietaryNeeds" name="dietaryNeeds" className={inputCls} placeholder="Vegetarian, vegan, gluten-free, halal…" />
      </div>
      <div>
        <label htmlFor="details" className={labelCls}>Event details</label>
        <textarea id="details" name="details" rows={4} className={inputCls} placeholder="Tell us about your event — occasion, location, menu ideas…" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
        {status === "submitting" ? "Sending…" : "Request catering"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Prefer to talk it through? Call{" "}
        <a href="tel:+15102509696" className="font-medium text-primary hover:underline">(510) 250-9696</a>.
      </p>
    </form>
  );
}
