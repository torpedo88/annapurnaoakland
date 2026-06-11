"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  time: string;
  maxCapacity: number | null;
  isActive: boolean | null;
}

interface FormState {
  dayOfWeek: string;
  time: string;
  maxCapacity: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  dayOfWeek: "0",
  time: "",
  maxCapacity: "8",
  isActive: true,
};

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ── Style tokens ───────────────────────────────────────────────────────────────

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

const primaryBtn: React.CSSProperties = { backgroundColor: "#C9A24B", color: "#14100D" };
const secondaryBtn: React.CSSProperties = {
  border: "1px solid rgba(201,162,75,0.3)",
  color: "#C9A24B",
};
const dangerBtn: React.CSSProperties = {
  border: "1px solid rgba(201,75,75,0.4)",
  color: "#E57373",
};

const labelCls = "block text-xs font-semibold uppercase tracking-widest mb-2";
const inputCls = "w-full rounded-lg px-4 py-2.5";
const btnBaseCls = "px-4 py-2 rounded-full text-sm font-semibold";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** "18:00:00" or "18:00" → "6:00 PM" */
function fmtTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (isNaN(h) || isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Normalize "18:00:00" → "18:00" for <input type="time"> */
function toTimeInput(time: string): string {
  return time.slice(0, 5);
}

// ── Form (module-level so its identity is stable across parent re-renders) ──────
// Defining this inside TimeSlotsClient would remount it on every keystroke, which
// steals focus from the active input. Keeping it at module scope fixes that.

function TimeSlotForm({
  form,
  setForm,
  onSubmit,
  submitting,
  submitLabel,
  formError,
  onCancel,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitLabel: string;
  formError: string | null;
  onCancel: () => void;
}) {
  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <form onSubmit={onSubmit}>
      {formError && (
        <p className="mb-4 text-sm" style={{ color: "#E57373" }}>
          {formError}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Day of week */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Day
          </label>
          <select
            className={inputCls}
            style={inputStyle}
            value={form.dayOfWeek}
            onChange={(e) => set("dayOfWeek", e.target.value)}
          >
            {DAY_LABELS.map((label, i) => (
              <option key={i} value={String(i)}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Time
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
          />
        </div>

        {/* Max capacity */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Max capacity
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            placeholder="8"
            value={form.maxCapacity}
            onChange={(e) => set("maxCapacity", e.target.value)}
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="mb-6">
        <label
          className="flex items-center gap-3 cursor-pointer"
          style={{ color: "#F3E9D6" }}
        >
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          <span className="text-sm">Active</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className={btnBaseCls}
          style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={btnBaseCls}
          style={secondaryBtn}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TimeSlotsClient() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { timeSlots: TimeSlot[] };
      setSlots(data.timeSlots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load time slots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSlots();
  }, [fetchSlots]);

  // ── Create ─────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: Number(createForm.dayOfWeek),
          time: createForm.time,
          maxCapacity: Number(createForm.maxCapacity),
          isActive: createForm.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError((data as { error?: string }).error ?? "Failed to create");
        return;
      }
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await fetchSlots();
    } finally {
      setCreating(false);
    }
  }

  // ── Toggle active inline ───────────────────────────────────────────────────

  async function handleToggleActive(s: TimeSlot) {
    const res = await fetch(`/api/admin/time-slots/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) {
      setSlots((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isActive: !s.isActive } : x))
      );
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  function openEdit(s: TimeSlot) {
    setEditId(s.id);
    setEditError(null);
    setEditForm({
      dayOfWeek: String(s.dayOfWeek),
      time: toTimeInput(s.time),
      maxCapacity: s.maxCapacity !== null ? String(s.maxCapacity) : "8",
      isActive: s.isActive ?? true,
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/time-slots/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: Number(editForm.dayOfWeek),
          time: editForm.time,
          maxCapacity: Number(editForm.maxCapacity),
          isActive: editForm.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError((data as { error?: string }).error ?? "Failed to save");
        return;
      }
      setEditId(null);
      await fetchSlots();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/time-slots/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl"
          style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}
        >
          Reservation Time-Slots
        </h1>
        {!showCreate && (
          <button
            onClick={() => {
              setShowCreate(true);
              setCreateForm(EMPTY_FORM);
              setCreateError(null);
            }}
            className={btnBaseCls}
            style={primaryBtn}
          >
            + New Slot
          </button>
        )}
      </div>

      {/* ── Create form ────────────────────────────────────────────────────── */}
      {showCreate && (
        <section style={card}>
          <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>
            New Time Slot
          </h2>
          <TimeSlotForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreate}
            submitting={creating}
            submitLabel="Create Slot"
            formError={createError}
            onCancel={() => {
              setShowCreate(false);
              setCreateError(null);
            }}
          />
        </section>
      )}

      {/* ── Loading / error states ──────────────────────────────────────────── */}
      {loading && (
        <p className="text-sm" style={{ color: "#8A8276" }}>
          Loading time slots…
        </p>
      )}
      {error && (
        <p className="text-sm" style={{ color: "#E57373" }}>
          {error}
        </p>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!loading && !error && slots.length === 0 && (
        <p className="text-sm" style={{ color: "#8A8276" }}>
          No time slots yet. Create one above.
        </p>
      )}

      {/* ── Slots grouped by day of week ───────────────────────────────────── */}
      {!loading &&
        !error &&
        DAY_LABELS.map((dayLabel, day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day);
          if (daySlots.length === 0) return null;
          return (
            <section key={day} style={card}>
              <h2
                className="text-lg mb-4"
                style={{ color: "#C9A24B", fontFamily: "var(--font-display)", fontWeight: 200 }}
              >
                {dayLabel}
              </h2>

              <div className="flex flex-col gap-3">
                {daySlots.map((s) =>
                  editId === s.id ? (
                    <div
                      key={s.id}
                      style={{
                        border: "1px solid rgba(201,162,75,0.18)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <h3 className="text-sm mb-4" style={{ color: "#F3E9D6" }}>
                        Edit {dayLabel} · {fmtTime(s.time)}
                      </h3>
                      <TimeSlotForm
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={handleEdit}
                        submitting={saving}
                        submitLabel="Save Changes"
                        formError={editError}
                        onCancel={() => {
                          setEditId(null);
                          setEditError(null);
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-4"
                      style={{
                        border: "1px solid rgba(201,162,75,0.12)",
                        borderRadius: 12,
                        padding: "12px 16px",
                      }}
                    >
                      <div className="flex items-center gap-6">
                        <span
                          className="text-base font-semibold"
                          style={{ color: "#F3E9D6", minWidth: 90 }}
                        >
                          {fmtTime(s.time)}
                        </span>
                        <span className="text-sm" style={{ color: "#8A8276" }}>
                          Cap {s.maxCapacity ?? "—"}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={s.isActive ?? false}
                            onChange={() => void handleToggleActive(s)}
                          />
                          <span
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: s.isActive ? "#C9A24B" : "#8A8276" }}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(s)}
                          className={btnBaseCls}
                          style={secondaryBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Delete ${dayLabel} ${fmtTime(s.time)} slot? This cannot be undone.`
                              )
                            ) {
                              void handleDelete(s.id);
                            }
                          }}
                          disabled={deletingId === s.id}
                          className={btnBaseCls}
                          style={{ ...dangerBtn, opacity: deletingId === s.id ? 0.5 : 1 }}
                        >
                          {deletingId === s.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          );
        })}
    </div>
  );
}
