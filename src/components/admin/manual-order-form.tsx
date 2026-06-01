"use client";

import { useState } from "react";
import { menu } from "@/data/menu";

type Line = { id: string; qty: number };

export function ManualOrderForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addLine = (id: string) =>
    setLines((p) => p.find((l) => l.id === id) ? p.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l) : [...p, { id, qty: 1 }]);
  const setQty = (id: string, qty: number) =>
    setLines((p) => p.flatMap((l) => l.id === id ? (qty > 0 ? [{ ...l, qty }] : []) : [l]));

  async function submit() {
    setErr(null);
    setSubmitting(true);
    try {
      let externalDeliveryId: string | undefined;
      if (fulfillment === "delivery") {
        const q = await fetch("/api/delivery/quote", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, phone, items: lines }),
        });
        const qd = await q.json();
        if (!q.ok) throw new Error(qd.error ?? "Quote failed");
        externalDeliveryId = qd.externalDeliveryId;
      }
      const res = await fetch("/api/admin/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, email: "", fulfillment, address, items: lines,
          externalDeliveryId,
          payment_status: paid ? "paid" : "unpaid",
          payment_method: paid ? method : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create order");
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  const input = "w-full rounded-lg px-3 py-2 mb-2";
  const inputStyle: React.CSSProperties = { backgroundColor: "#14100D", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6" };

  return (
    <div style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.25)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div className="flex justify-between mb-3">
        <h2 style={{ color: "#F3E9D6" }}>New phone / walk-in order</h2>
        <button onClick={onClose} style={{ color: "#8A8276" }}>✕</button>
      </div>
      {err && <p className="mb-2 text-sm" style={{ color: "#FCA5A5" }}>{err}</p>}
      <input className={input} style={inputStyle} placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={input} style={inputStyle} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div className="flex gap-2 mb-2">
        {(["pickup", "delivery"] as const).map((f) => (
          <button key={f} onClick={() => setFulfillment(f)} className="px-3 py-1.5 rounded-full text-sm"
            style={f === fulfillment ? { backgroundColor: "#C9A24B", color: "#14100D" } : { color: "#8A8276", border: "1px solid rgba(201,162,75,0.3)" }}>
            {f}
          </button>
        ))}
      </div>
      {fulfillment === "delivery" && (
        <input className={input} style={inputStyle} placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
      )}
      <select className={input} style={inputStyle} value="" onChange={(e) => e.target.value && addLine(e.target.value)}>
        <option value="">+ Add item…</option>
        {menu.filter((m) => !m.isCatering).map((m) => <option key={m.id} value={m.id}>{m.name} — ${m.price.toFixed(2)}</option>)}
      </select>
      <ul className="my-2">
        {lines.map((l) => {
          const item = menu.find((m) => m.id === l.id);
          return (
            <li key={l.id} className="flex items-center gap-2 text-sm" style={{ color: "#F3E9D6" }}>
              <span className="flex-1">{item?.name}</span>
              <input type="number" min={0} value={l.qty} onChange={(e) => setQty(l.id, Number(e.target.value))}
                className="w-16 rounded px-2 py-1" style={inputStyle} />
            </li>
          );
        })}
      </ul>
      <label className="flex items-center gap-2 text-sm mb-2" style={{ color: "#F3E9D6" }}>
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Mark paid
        {paid && (
          <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "card")} className="rounded px-2 py-1" style={inputStyle}>
            <option value="cash">cash</option><option value="card">card</option>
          </select>
        )}
      </label>
      <button disabled={submitting || lines.length === 0 || !name || !phone || (fulfillment === "delivery" && !address)}
        onClick={submit} className="px-5 py-2.5 rounded-full font-bold disabled:opacity-50"
        style={{ backgroundColor: "#C9A24B", color: "#14100D" }}>
        {submitting ? "Creating…" : fulfillment === "delivery" ? "Quote + dispatch delivery" : "Create order"}
      </button>
      {fulfillment === "delivery" && <p className="text-xs mt-2" style={{ color: "#8A8276" }}>Creating a delivery order books a DoorDash driver immediately.</p>}
    </div>
  );
}
