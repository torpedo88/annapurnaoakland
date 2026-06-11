"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderCard, type AdminOrder } from "./order-card";
import { ManualOrderForm } from "./manual-order-form";
import { RefundModal } from "./refund-modal";

type Lane = "active" | "completed" | "cancelled";
const SOUND_KEY = "annapurna:admin:sound";

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
  const [showForm, setShowForm] = useState(false);
  const [refunding, setRefunding] = useState<AdminOrder | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    // Sound is ON by default; only off if the user explicitly turned it off.
    setSoundOn(localStorage.getItem(SOUND_KEY) !== "off");
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
      firstLoadRef.current = false;
    }
    setOrders(data.orders);
  }, [soundOn]);

  useEffect(() => {
    firstLoadRef.current = true;
    load(lane);
    const t = setInterval(() => load(lane), 10_000);
    const onFocus = () => load(lane);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [lane, load]);

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
          <button onClick={() => setShowForm((s) => !s)} className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}>+ New order</button>
        </div>
      </div>
      {showForm && (
        <ManualOrderForm onCreated={() => load(lane)} onClose={() => setShowForm(false)} />
      )}
      {orders.length === 0 && <p style={{ color: "#8A8276" }}>No orders in this lane.</p>}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} busy={busyId === o.id} onStatus={patchStatus} onPayment={patchPayment} onRefund={openRefund} />
      ))}
      {refunding && (
        <RefundModal order={refunding} onClose={() => setRefunding(null)} onDone={() => load(lane)} />
      )}
    </div>
  );
}
