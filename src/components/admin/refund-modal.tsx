"use client";

import { useMemo, useState } from "react";
import type { AdminOrder } from "./order-card";

const money = (n: number) => `$${n.toFixed(2)}`;

export function RefundModal({
  order,
  onClose,
  onDone,
}: {
  order: AdminOrder;
  onClose: () => void;
  onDone: () => void;
}) {
  const subtotal = Number(order.subtotal ?? 0);
  const tax = Number(order.tax ?? 0);
  const total = Number(order.total ?? 0);
  const alreadyRefunded = Number(order.refundedTotal ?? 0);
  const remaining = +(total - alreadyRefunded).toFixed(2);

  const [mode, setMode] = useState<"items" | "amount">("items");
  // qty to refund per order-item id
  const [qty, setQty] = useState<Record<string, number>>({});
  const [customAmount, setCustomAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Client-side estimate (server is authoritative). Item price + proportional tax.
  const itemizedAmount = useMemo(() => {
    let selectedSubtotal = 0;
    for (const it of order.items) {
      const q = qty[it.id] ?? 0;
      if (q > 0) selectedSubtotal += Number(it.itemPrice ?? 0) * q;
    }
    if (selectedSubtotal <= 0) return 0;
    const taxRefund = subtotal > 0 ? +(tax * (selectedSubtotal / subtotal)).toFixed(2) : 0;
    return Math.min(remaining, +(selectedSubtotal + taxRefund).toFixed(2));
  }, [qty, order.items, subtotal, tax, remaining]);

  const amount = mode === "items" ? itemizedAmount : Math.min(remaining, Number(customAmount) || 0);

  const setItemQty = (id: string, q: number, max: number) =>
    setQty((p) => ({ ...p, [id]: Math.max(0, Math.min(max, q)) }));

  async function submit() {
    setErr(null);
    if (amount <= 0) { setErr("Enter an amount or select items to refund."); return; }
    setSubmitting(true);
    const body =
      mode === "items"
        ? {
            items: order.items
              .filter((it) => (qty[it.id] ?? 0) > 0)
              .map((it) => ({ orderItemId: it.id, quantity: qty[it.id] })),
            reason,
          }
        : { amountCents: Math.round((Number(customAmount) || 0) * 100), reason };
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      onDone();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#14100D", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6",
  };
  const tabStyle = (active: boolean): React.CSSProperties =>
    active ? { backgroundColor: "#C9A24B", color: "#14100D" } : { color: "#8A8276", border: "1px solid rgba(201,162,75,0.3)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5"
        style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.25)" }}>
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg" style={{ color: "#F3E9D6" }}>Refund #{order.orderNumber}</h2>
          <button onClick={onClose} style={{ color: "#8A8276" }}>✕</button>
        </div>
        <p className="text-xs mb-4" style={{ color: "#8A8276" }}>
          Paid {money(total)}
          {alreadyRefunded > 0 && <> · already refunded {money(alreadyRefunded)}</>} · refundable {money(remaining)}
        </p>

        {err && <p className="mb-3 text-sm" style={{ color: "#FCA5A5" }}>{err}</p>}

        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode("items")} className="px-3 py-1.5 rounded-full text-sm" style={tabStyle(mode === "items")}>By item</button>
          <button onClick={() => setMode("amount")} className="px-3 py-1.5 rounded-full text-sm" style={tabStyle(mode === "amount")}>Custom amount</button>
        </div>

        {mode === "items" ? (
          <ul className="space-y-2 mb-4">
            {order.items.map((it) => {
              const max = it.quantity ?? 1;
              const cur = qty[it.id] ?? 0;
              const price = Number(it.itemPrice ?? 0);
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 text-sm" style={{ color: "#F3E9D6" }}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{it.itemName}</p>
                    <p className="text-xs" style={{ color: "#8A8276" }}>{max}× {money(price)}{it.spiceLevel ? ` · ${it.spiceLevel}` : ""}</p>
                  </div>
                  <div className="inline-flex items-center rounded-full" style={{ backgroundColor: "rgba(201,162,75,0.1)" }}>
                    <button onClick={() => setItemQty(it.id, cur - 1, max)} className="h-7 w-7" style={{ color: "#F3E9D6" }} aria-label="less">−</button>
                    <span className="w-6 text-center">{cur}</span>
                    <button onClick={() => setItemQty(it.id, cur + 1, max)} className="h-7 w-7" style={{ color: "#F3E9D6" }} aria-label="more">+</button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8A8276" }}>Amount ($, max {money(remaining)})</label>
            <input type="number" min={0} max={remaining} step="0.01" value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)} placeholder="0.00"
              className="w-full rounded-lg px-3 py-2" style={inputStyle} />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8A8276" }}>Reason (optional)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. missing momo, customer complaint"
            className="w-full rounded-lg px-3 py-2" style={inputStyle} />
        </div>

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm" style={{ color: "#8A8276" }}>Cancel</button>
          <button onClick={submit} disabled={submitting || amount <= 0}
            className="px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            style={{ backgroundColor: "#DC2626", color: "#fff" }}>
            {submitting ? "Refunding…" : `Refund ${money(amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
