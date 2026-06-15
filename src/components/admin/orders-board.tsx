"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderCard, type AdminOrder } from "./order-card";
import { ManualOrderForm } from "./manual-order-form";
import { RefundModal } from "./refund-modal";
import { KitchenReceipt } from "./kitchen-receipt";

type Lane = "active" | "completed" | "cancelled";
const SOUND_KEY = "annapurna:admin:sound";
const PRINT_KEY = "annapurna:admin:print";
// Persisted set of order ids already sent to the printer, so a page reload /
// second tab never reprints the same ticket. Capped to the most recent ids.
const PRINTED_KEY = "annapurna:admin:printed";
const PRINTED_CAP = 800;

// Loud two-note chime for new orders (much louder than the old single beep).
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const note = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.8, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };
    note(880, 0, 0.22);
    note(1175, 0.16, 0.3);
    setTimeout(() => ctx.close(), 900);
  } catch { /* audio not available */ }
}

// Spoken announcement so staff hear the order type across the kitchen.
function announce(text: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.volume = 1;
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* TTS not available */ }
}

export function OrdersBoard() {
  const [lane, setLane] = useState<Lane>("active");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [printOn, setPrintOn] = useState(false);
  const [printQueue, setPrintQueue] = useState<AdminOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refunding, setRefunding] = useState<AdminOrder | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const printedRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  // Mark an order as printed and persist (bounded) so reloads don't reprint it.
  const rememberPrinted = useCallback((ids: string[]) => {
    ids.forEach((id) => printedRef.current.add(id));
    try {
      const kept = [...printedRef.current].slice(-PRINTED_CAP);
      printedRef.current = new Set(kept);
      localStorage.setItem(PRINTED_KEY, JSON.stringify(kept));
    } catch { /* storage full / unavailable */ }
  }, []);

  // Queue a ticket for printing (manual reprint or auto on new order).
  const enqueuePrint = useCallback((order: AdminOrder) => {
    setPrintQueue((q) => [...q, order]);
  }, []);

  useEffect(() => {
    // Sound is ON by default. Auto-print is OFF by default and enabled per
    // device (tap it once on the kiosk) so staff phones don't get print dialogs.
    setSoundOn(localStorage.getItem(SOUND_KEY) !== "off");
    setPrintOn(localStorage.getItem(PRINT_KEY) === "on");
    try {
      const raw = localStorage.getItem(PRINTED_KEY);
      if (raw) printedRef.current = new Set(JSON.parse(raw) as string[]);
    } catch { /* ignore malformed */ }
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setShowForm(true);
      window.history.replaceState(null, "", "/admin");
    }
  }, []);

  const load = useCallback(async (l: Lane) => {
    const res = await fetch(`/api/admin/orders?lane=${l}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { orders: AdminOrder[] };
    if (l === "active") {
      const incoming = data.orders.filter((o) => o.status === "received");
      const freshOrders = incoming.filter((o) => !seenRef.current.has(o.id));
      data.orders.forEach((o) => seenRef.current.add(o.id));
      if (freshOrders.length && !firstLoadRef.current && soundOn) {
        beep();
        const delivery = freshOrders.filter((o) => o.orderType === "delivery").length;
        const pickup = freshOrders.length - delivery;
        let msg: string;
        if (freshOrders.length === 1) {
          msg = `New ${delivery ? "delivery" : "pickup"} order received`;
        } else {
          const parts: string[] = [];
          if (pickup) parts.push(`${pickup} pickup`);
          if (delivery) parts.push(`${delivery} delivery`);
          msg = `${freshOrders.length} new orders received: ${parts.join(", ")}`;
        }
        announce(msg);
      }
      // Auto-print: received orders not yet sent to the printer. On the first
      // poll we only seed the printed-set (so we don't dump the existing
      // backlog); after that, genuinely new orders each print once.
      if (printOn) {
        const toPrint = incoming.filter((o) => !printedRef.current.has(o.id));
        if (firstLoadRef.current) {
          rememberPrinted(toPrint.map((o) => o.id));
        } else if (toPrint.length) {
          rememberPrinted(toPrint.map((o) => o.id));
          setPrintQueue((q) => [...q, ...toPrint]);
        }
      }
      firstLoadRef.current = false;
    }
    setOrders(data.orders);
  }, [soundOn, printOn, rememberPrinted]);

  useEffect(() => {
    firstLoadRef.current = true;
    load(lane);
    const t = setInterval(() => load(lane), 10_000);
    const onFocus = () => load(lane);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [lane, load]);

  // Process the print queue one ticket at a time. The head ticket renders into
  // #kitchen-receipt (below); once printed we drop it so the next one renders.
  // Keyed on the head id so appending more tickets mid-print never reprints it.
  const printHeadId = printQueue[0]?.id;
  useEffect(() => {
    if (!printHeadId) return;
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      setPrintQueue((q) => q.slice(1));
    };
    const t = setTimeout(() => {
      window.addEventListener("afterprint", advance, { once: true });
      try { window.print(); } catch { /* no print context */ }
      setTimeout(advance, 2000); // fallback if afterprint never fires
    }, 150);
    return () => clearTimeout(t);
  }, [printHeadId]);

  const patchStatus = async (id: string, to: string) => {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }),
    });
    setBusyId(null);
    load(lane);
  };
  const patchPayment = async (id: string, patch: { payment_status?: string; payment_method?: string }) => {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}/payment`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    setBusyId(null);
    load(lane);
  };
  const openRefund = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (o) setRefunding(o);
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    if (next) beep(); // unlock audio on the user gesture
  };
  const togglePrint = () => {
    const next = !printOn;
    setPrintOn(next);
    localStorage.setItem(PRINT_KEY, next ? "on" : "off");
  };
  // Manual reprint from an order card (ticket jam, lost copy, etc.).
  const reprint = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (o) enqueuePrint(o);
  };

  const tab = (l: Lane, label: string) => (
    <button onClick={() => setLane(l)}
      className="px-4 py-2 rounded-full text-sm font-semibold"
      style={l === lane ? { backgroundColor: "#C9A24B", color: "#14100D" } : { color: "#8A8276" }}>
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">{tab("active", "Active")}{tab("completed", "Completed")}{tab("cancelled", "Cancelled")}</div>
        <div className="flex gap-2">
          <button onClick={toggleSound} className="text-xs px-3 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(201,162,75,0.3)", color: soundOn ? "#C9A24B" : "#8A8276" }}>
            {soundOn ? "🔔 Sound on" : "🔕 Sound off"}
          </button>
          <button onClick={togglePrint} className="text-xs px-3 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(201,162,75,0.3)", color: printOn ? "#C9A24B" : "#8A8276" }}>
            {printOn ? "🖨 Auto-print on" : "🖨 Auto-print off"}
          </button>
          <button onClick={() => setShowForm((s) => !s)} className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}>+ New order</button>
        </div>
      </div>
      {showForm && (
        <ManualOrderForm onCreated={() => load(lane)} onClose={() => setShowForm(false)} />
      )}
      {orders.length === 0 && <p style={{ color: "#8A8276" }}>No orders in this lane.</p>}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} busy={busyId === o.id} onStatus={patchStatus} onPayment={patchPayment} onRefund={openRefund} onPrint={reprint} />
      ))}
      {refunding && (
        <RefundModal order={refunding} onClose={() => setRefunding(null)} onDone={() => load(lane)} />
      )}
      {/* Hidden on screen; revealed only by the @media print rules in globals.css. */}
      {printQueue[0] && <KitchenReceipt order={printQueue[0]} />}
    </div>
  );
}
