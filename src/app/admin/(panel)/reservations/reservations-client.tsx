"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type ReservationStatus = "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

interface Reservation {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  date: string | null;
  timeSlot: string | null;
  partySize: number | null;
  status: string | null;
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUSES: ReservationStatus[] = ["confirmed", "seated", "completed", "cancelled", "no_show"];

const STATUS_COLORS: Record<ReservationStatus, { bg: string; color: string }> = {
  confirmed:  { bg: "rgba(201,162,75,0.18)",  color: "#C9A24B" },
  seated:     { bg: "rgba(100,180,100,0.18)", color: "#7ECB7E" },
  completed:  { bg: "rgba(100,160,220,0.18)", color: "#7BB8E8" },
  cancelled:  { bg: "rgba(180,60,60,0.18)",   color: "#E07070" },
  no_show:    { bg: "rgba(120,100,80,0.18)",  color: "#A89070" },
};

function statusBadge(status: string | null) {
  const s = (status ?? "confirmed") as ReservationStatus;
  const c = STATUS_COLORS[s] ?? STATUS_COLORS.confirmed;
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {s.replace("_", " ")}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    // date is "YYYY-MM-DD" — parse as local to avoid UTC offset shifting day
    const parts = d.split("-").map(Number);
    const y = parts[0] ?? 2000;
    const mon = parts[1] ?? 1;
    const day = parts[2] ?? 1;
    return new Date(y, mon - 1, day).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  } catch { return d; }
}

function formatTime(t: string | null) {
  if (!t) return "—";
  try {
    const parts = t.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch { return t; }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const card = {
  backgroundColor: "#1C1712",
  border: "1px solid rgba(201,162,75,0.18)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};

const inputStyle = {
  backgroundColor: "#14100D",
  border: "1px solid rgba(201,162,75,0.2)",
  color: "#F3E9D6",
};

const labelCls = "block text-xs font-semibold uppercase tracking-widest mb-2";
const labelStyle = { color: "#8A8276" };

const primaryBtn = { backgroundColor: "#C9A24B", color: "#14100D" };
const secondaryBtn = { border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" };
const dangerBtn = { border: "1px solid rgba(220,60,60,0.4)", color: "#E07070" };

// ─── Blank form state ────────────────────────────────────────────────────────

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  timeSlot: string;
  partySize: string;
  specialRequests: string;
  status: ReservationStatus;
}

const blankForm = (): FormState => ({
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  date: "",
  timeSlot: "",
  partySize: "",
  specialRequests: "",
  status: "confirmed",
});

// ─── Main client component ───────────────────────────────────────────────────

export function ReservationsClient() {
  const [reservationsList, setReservationsList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New-reservation form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit state — keyed by reservation id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(blankForm());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Busy (status-change) id
  const [busyId, setBusyId] = useState<string | null>(null);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reservations", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reservations: Reservation[] };
      setReservationsList(data.reservations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create ──────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.customerName.trim()) { setFormError("Name is required"); return; }
    if (!form.date) { setFormError("Date is required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone || null,
          customerEmail: form.customerEmail || null,
          date: form.date,
          timeSlot: form.timeSlot || null,
          partySize: form.partySize ? Number(form.partySize) : null,
          specialRequests: form.specialRequests || null,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setForm(blankForm());
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Quick status change ─────────────────────────────────────────────────

  const patchStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────

  const startEdit = (r: Reservation) => {
    setEditingId(r.id);
    setEditError(null);
    setEditForm({
      customerName: r.customerName ?? "",
      customerPhone: r.customerPhone ?? "",
      customerEmail: r.customerEmail ?? "",
      date: r.date ?? "",
      timeSlot: r.timeSlot ? r.timeSlot.slice(0, 5) : "", // "HH:MM:SS" → "HH:MM"
      partySize: r.partySize != null ? String(r.partySize) : "",
      specialRequests: r.specialRequests ?? "",
      status: (r.status as ReservationStatus) ?? "confirmed",
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    if (!editForm.customerName.trim()) { setEditError("Name is required"); return; }
    if (!editForm.date) { setEditError("Date is required"); return; }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reservations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName.trim(),
          customerPhone: editForm.customerPhone || null,
          customerEmail: editForm.customerEmail || null,
          date: editForm.date,
          timeSlot: editForm.timeSlot || null,
          partySize: editForm.partySize ? Number(editForm.partySize) : null,
          specialRequests: editForm.specialRequests || null,
          status: editForm.status,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setEditingId(null);
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  // ── Field helpers ────────────────────────────────────────────────────────

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { type?: string; placeholder?: string; required?: boolean }
  ) => (
    <div>
      <label className={labelCls} style={labelStyle}>{label}{opts?.required && " *"}</label>
      <input
        type={opts?.type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts?.placeholder}
        required={opts?.required}
        className="w-full rounded-lg px-4 py-2.5"
        style={inputStyle}
      />
    </div>
  );

  const selectField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: readonly string[]
  ) => (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-4 py-2.5"
        style={inputStyle}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace("_", " ")}</option>
        ))}
      </select>
    </div>
  );

  // ── Render a reservation card ─────────────────────────────────────────

  const renderCard = (r: Reservation) => {
    const isEditing = editingId === r.id;
    const isBusy = busyId === r.id;
    const isConfirmDelete = confirmDeleteId === r.id;

    if (isEditing) {
      return (
        <div key={r.id} style={card}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#C9A24B" }}>
            Edit Reservation
          </p>
          <form onSubmit={handleEditSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {field("Name", editForm.customerName, (v) => setEditForm((f) => ({ ...f, customerName: v })), { required: true })}
              {field("Phone", editForm.customerPhone, (v) => setEditForm((f) => ({ ...f, customerPhone: v })), { type: "tel" })}
              {field("Email", editForm.customerEmail, (v) => setEditForm((f) => ({ ...f, customerEmail: v })), { type: "email" })}
              {field("Date", editForm.date, (v) => setEditForm((f) => ({ ...f, date: v })), { type: "date", required: true })}
              {field("Time", editForm.timeSlot, (v) => setEditForm((f) => ({ ...f, timeSlot: v })), { type: "time" })}
              {field("Party Size", editForm.partySize, (v) => setEditForm((f) => ({ ...f, partySize: v })), { type: "number", placeholder: "e.g. 4" })}
              {selectField("Status", editForm.status, (v) => setEditForm((f) => ({ ...f, status: v as ReservationStatus })), STATUSES)}
            </div>
            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>Special Requests</label>
              <textarea
                value={editForm.specialRequests}
                onChange={(e) => setEditForm((f) => ({ ...f, specialRequests: e.target.value }))}
                rows={2}
                className="w-full rounded-lg px-4 py-2.5"
                style={inputStyle}
              />
            </div>
            {editError && <p className="text-sm mb-3" style={{ color: "#E07070" }}>{editError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={primaryBtn}
              >
                {editSubmitting ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div key={r.id} style={card}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <span className="text-base font-semibold" style={{ color: "#F3E9D6" }}>
              {r.customerName ?? "—"}
            </span>
            {r.partySize != null && (
              <span className="ml-2 text-sm" style={{ color: "#8A8276" }}>
                · {r.partySize} guest{r.partySize !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {statusBadge(r.status)}
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-3" style={{ color: "#8A8276" }}>
          <span>{formatDate(r.date)} {r.timeSlot ? `· ${formatTime(r.timeSlot)}` : ""}</span>
          {r.customerPhone && <span>{r.customerPhone}</span>}
          {r.customerEmail && <span>{r.customerEmail}</span>}
        </div>

        {r.specialRequests && (
          <p className="text-sm italic mb-3" style={{ color: "#8A8276" }}>
            &ldquo;{r.specialRequests}&rdquo;
          </p>
        )}

        {/* Quick status change */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUSES.filter((s) => s !== r.status).map((s) => (
            <button
              key={s}
              disabled={isBusy}
              onClick={() => patchStatus(r.id, s)}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={secondaryBtn}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Action row */}
        <div className="flex gap-3 items-center">
          <button
            onClick={() => startEdit(r)}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={secondaryBtn}
          >
            Edit
          </button>

          {isConfirmDelete ? (
            <>
              <span className="text-sm" style={{ color: "#E07070" }}>Delete?</span>
              <button
                disabled={isBusy}
                onClick={() => handleDelete(r.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={dangerBtn}
              >
                {isBusy ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={secondaryBtn}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(r.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={dangerBtn}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">
      {/* Page heading */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl"
          style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}
        >
          Reservations
        </h1>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); setForm(blankForm()); }}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={showForm ? secondaryBtn : primaryBtn}
        >
          {showForm ? "Cancel" : "+ New Reservation"}
        </button>
      </div>

      {/* New reservation form */}
      {showForm && (
        <div style={card}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#C9A24B" }}>
            New Reservation
          </p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {field("Name", form.customerName, (v) => setForm((f) => ({ ...f, customerName: v })), { required: true, placeholder: "Guest name" })}
              {field("Phone", form.customerPhone, (v) => setForm((f) => ({ ...f, customerPhone: v })), { type: "tel", placeholder: "Optional" })}
              {field("Email", form.customerEmail, (v) => setForm((f) => ({ ...f, customerEmail: v })), { type: "email", placeholder: "Optional" })}
              {field("Date", form.date, (v) => setForm((f) => ({ ...f, date: v })), { type: "date", required: true })}
              {field("Time", form.timeSlot, (v) => setForm((f) => ({ ...f, timeSlot: v })), { type: "time" })}
              {field("Party Size", form.partySize, (v) => setForm((f) => ({ ...f, partySize: v })), { type: "number", placeholder: "e.g. 4" })}
              {selectField("Status", form.status, (v) => setForm((f) => ({ ...f, status: v as ReservationStatus })), STATUSES)}
            </div>
            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>Special Requests</label>
              <textarea
                value={form.specialRequests}
                onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
                rows={2}
                placeholder="Dietary needs, occasion, etc."
                className="w-full rounded-lg px-4 py-2.5"
                style={inputStyle}
              />
            </div>
            {formError && <p className="text-sm mb-3" style={{ color: "#E07070" }}>{formError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={primaryBtn}
              >
                {submitting ? "Creating…" : "Create Reservation"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(blankForm()); setFormError(null); }}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading && (
        <p className="text-sm" style={{ color: "#8A8276" }}>Loading…</p>
      )}
      {!loading && error && (
        <p className="text-sm" style={{ color: "#E07070" }}>Error: {error}</p>
      )}
      {!loading && !error && reservationsList.length === 0 && (
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ color: "#8A8276" }}>No reservations yet.</p>
        </div>
      )}
      {!loading && reservationsList.map(renderCard)}
    </div>
  );
}
