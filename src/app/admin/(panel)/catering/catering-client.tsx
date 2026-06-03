"use client";

import { useState, useEffect, useCallback } from "react";

type CateringStatus = "pending" | "quoted" | "confirmed" | "declined";

interface CateringRequest {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  eventDate: string | null;
  partySize: number | null;
  budgetRange: string | null;
  dietaryNeeds: string | null;
  details: string | null;
  status: string | null;
  adminNotes: string | null;
  quotedTotal: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUSES: CateringStatus[] = ["pending", "quoted", "confirmed", "declined"];

const STATUS_COLORS: Record<CateringStatus, { bg: string; color: string }> = {
  pending:   { bg: "rgba(201,162,75,0.15)",  color: "#C9A24B" },
  quoted:    { bg: "rgba(100,160,255,0.15)", color: "#64A0FF" },
  confirmed: { bg: "rgba(80,200,120,0.15)",  color: "#50C878" },
  declined:  { bg: "rgba(220,80,80,0.15)",   color: "#DC5050" },
};

const card: React.CSSProperties = {
  backgroundColor: "#1C1712",
  border: "1px solid rgba(201,162,75,0.18)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  backgroundColor: "#14100D",
  border: "1px solid rgba(201,162,75,0.2)",
  color: "#F3E9D6",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "pending") as CateringStatus;
  const colors = STATUS_COLORS[s] ?? STATUS_COLORS.pending;
  return (
    <span
      className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
      style={{ backgroundColor: colors.bg, color: colors.color }}
    >
      {s}
    </span>
  );
}

function RequestCard({
  req,
  onUpdated,
  onDeleted,
}: {
  req: CateringRequest;
  onUpdated: (updated: CateringRequest) => void;
  onDeleted: (id: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState(req.adminNotes ?? "");
  const [quotedTotal, setQuotedTotal] = useState(req.quotedTotal ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/catering/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error ?? "Save failed"); return null; }
    return data.request as CateringRequest;
  }

  async function handleStatusChange(status: string) {
    const updated = await patch({ status });
    if (updated) { onUpdated(updated); setMsg("Status updated."); }
  }

  async function handleSave() {
    const body: Record<string, unknown> = { adminNotes };
    if (quotedTotal !== "") body.quotedTotal = quotedTotal;
    const updated = await patch(body);
    if (updated) { onUpdated(updated); setMsg("Saved."); }
  }

  async function handleDelete() {
    if (!confirm(`Delete catering request from ${req.customerName ?? "unknown"}?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/catering/${req.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(req.id);
    } else {
      const data = await res.json();
      setMsg(data.error ?? "Delete failed");
      setDeleting(false);
    }
  }

  const labelCls = "block text-xs font-semibold uppercase tracking-widest mb-2";
  const labelStyle: React.CSSProperties = { color: "#8A8276" };
  const inputCls = "w-full rounded-lg px-4 py-2.5";
  const muted: React.CSSProperties = { color: "#8A8276" };

  const currentStatus = (req.status ?? "pending") as CateringStatus;

  return (
    <div style={card}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="text-lg font-semibold" style={{ color: "#F3E9D6" }}>
            {req.customerName ?? "—"}
          </p>
          <p className="text-sm mt-0.5" style={muted}>
            {req.customerEmail ?? "—"} &nbsp;·&nbsp; {req.customerPhone ?? "—"}
          </p>
          <p className="text-xs mt-1" style={muted}>
            Received {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* Event details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <div>
          <p className={labelCls} style={labelStyle}>Event Date</p>
          <p className="text-sm" style={{ color: "#F3E9D6" }}>{req.eventDate ?? "—"}</p>
        </div>
        <div>
          <p className={labelCls} style={labelStyle}>Party Size</p>
          <p className="text-sm" style={{ color: "#F3E9D6" }}>{req.partySize ?? "—"}</p>
        </div>
        <div>
          <p className={labelCls} style={labelStyle}>Budget Range</p>
          <p className="text-sm" style={{ color: "#F3E9D6" }}>{req.budgetRange ?? "—"}</p>
        </div>
        <div>
          <p className={labelCls} style={labelStyle}>Dietary Needs</p>
          <p className="text-sm" style={{ color: "#F3E9D6" }}>{req.dietaryNeeds ?? "—"}</p>
        </div>
      </div>

      {req.details && (
        <div className="mb-4">
          <p className={labelCls} style={labelStyle}>Details</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "#F3E9D6" }}>{req.details}</p>
        </div>
      )}

      {/* Status change */}
      <div className="mb-4">
        <p className={labelCls} style={labelStyle}>Change Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const isActive = s === currentStatus;
            const colors = STATUS_COLORS[s];
            return (
              <button
                key={s}
                type="button"
                disabled={saving || isActive}
                onClick={() => handleStatusChange(s)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={
                  isActive
                    ? { backgroundColor: colors.bg, color: colors.color, opacity: 1, cursor: "default" }
                    : { border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B", background: "transparent", opacity: saving ? 0.5 : 1 }
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quoted total */}
      <div className="mb-4">
        <label className={labelCls} style={labelStyle}>Quoted Total ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputCls}
          style={inputStyle}
          placeholder="e.g. 850.00"
          value={quotedTotal}
          onChange={(e) => setQuotedTotal(e.target.value)}
        />
      </div>

      {/* Admin notes */}
      <div className="mb-4">
        <label className={labelCls} style={labelStyle}>Admin Notes</label>
        <textarea
          rows={3}
          className={inputCls}
          style={inputStyle}
          placeholder="Internal notes, follow-ups, special arrangements…"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />
      </div>

      {msg && (
        <p className="text-sm mb-3" style={{ color: msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error") ? "#DC5050" : "#C9A24B" }}>
          {msg}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: "#C9A24B", color: "#14100D", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Notes & Quote"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ border: "1px solid rgba(220,80,80,0.4)", color: "#DC5050", background: "transparent", opacity: deleting ? 0.5 : 1 }}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export function CateringClient() {
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CateringStatus | "all">("all");

  const fetchRequests = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/catering");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to load catering requests.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRequests(data.requests as CateringRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  function handleUpdated(updated: CateringRequest) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleDeleted(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  const visible =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const countByStatus = (s: CateringStatus) => requests.filter((r) => r.status === s).length;

  return (
    <div className="max-w-4xl">
      <h1
        className="text-3xl mb-6"
        style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}
      >
        Catering Inbox
      </h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", ...STATUSES] as const).map((s) => {
          const isActive = s === filter;
          const count = s === "all" ? requests.length : countByStatus(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={
                isActive
                  ? { backgroundColor: "#C9A24B", color: "#14100D" }
                  : { border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B", background: "transparent" }
              }
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-sm" style={{ color: "#8A8276" }}>Loading…</p>
      )}

      {error && (
        <p className="text-sm mb-4" style={{ color: "#DC5050" }}>{error}</p>
      )}

      {!loading && !error && visible.length === 0 && (
        <div style={{ ...card, textAlign: "center" }}>
          <p className="text-sm" style={{ color: "#8A8276" }}>
            {filter === "all" ? "No catering requests yet." : `No ${filter} requests.`}
          </p>
        </div>
      )}

      {visible.map((req) => (
        <RequestCard
          key={req.id}
          req={req}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
