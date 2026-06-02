"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderCard, type AdminOrder } from "./order-card";
import { ManualOrderForm } from "./manual-order-form";

type Lane = "active" | "completed" | "cancelled";
const SOUND_KEY = "annapurna:admin:sound";

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch { /* audio not available */ }
}

export function OrdersBoard() {
  const [lane, setLane] = useState<Lane>("active");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    setSoundOn(localStorage.getItem(SOUND_KEY) === "on");
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
      const fresh = incoming.some((o) => !seenRef.current.has(o.id));
      data.orders.forEach((o) => seenRef.current.add(o.id));
      if (fresh && !firstLoadRef.current && soundOn) beep();
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
        <OrderCard key={o.id} order={o} busy={busyId === o.id} onStatus={patchStatus} onPayment={patchPayment} />
      ))}
    </div>
  );
}
