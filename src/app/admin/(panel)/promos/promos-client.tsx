"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Promo {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  minOrder: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minOrder: string;
  maxRedemptions: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
}

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  minOrder: "",
  maxRedemptions: "",
  isActive: true,
  startsAt: "",
  expiresAt: "",
};

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

function fmtExpiry(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function redemptionLabel(p: Promo): string {
  if (p.maxRedemptions === null) return String(p.timesRedeemed);
  return `${p.timesRedeemed} / ${p.maxRedemptions}`;
}

/** Convert a datetime-local string like "2025-06-01T14:00" to ISO or empty string */
function dtLocalToIso(val: string): string {
  return val ? new Date(val).toISOString() : "";
}

/** Convert an ISO string to datetime-local format for <input type="datetime-local"> */
function isoToDtLocal(iso: string | null): string {
  if (!iso) return "";
  // "2025-06-01T14:00:00.000Z" → "2025-06-01T14:00"
  return iso.slice(0, 16);
}

// ── Form (module-level so its identity is stable across parent re-renders) ──────
// Defining this inside PromosClient remounted it on every keystroke, which stole
// focus from the active input. Keeping it at module scope fixes that.

function PromoForm({
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

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Code */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Code
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="text"
            placeholder="SUMMER20"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
          />
        </div>

        {/* Discount type */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Discount type
          </label>
          <select
            className={inputCls}
            style={inputStyle}
            value={form.discountType}
            onChange={(e) =>
              set("discountType", e.target.value as "percent" | "fixed")
            }
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </div>

        {/* Discount value */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Discount value{" "}
            <span style={{ color: "#C9A24B" }}>
              {form.discountType === "percent" ? "%" : "$"}
            </span>
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="number"
            min="0"
            max={form.discountType === "percent" ? 100 : undefined}
            step="0.01"
            placeholder={form.discountType === "percent" ? "20" : "5.00"}
            value={form.discountValue}
            onChange={(e) => set("discountValue", e.target.value)}
          />
        </div>

        {/* Min order */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Min order ($) <span style={{ color: "#8A8276", fontWeight: 400 }}>optional</span>
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.minOrder}
            onChange={(e) => set("minOrder", e.target.value)}
          />
        </div>

        {/* Max redemptions */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Max redemptions <span style={{ color: "#8A8276", fontWeight: 400 }}>optional</span>
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            placeholder="unlimited"
            value={form.maxRedemptions}
            onChange={(e) => set("maxRedemptions", e.target.value)}
          />
        </div>

        {/* Starts at */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Starts at <span style={{ color: "#8A8276", fontWeight: 400 }}>optional</span>
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
        </div>

        {/* Expires at */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Expires at <span style={{ color: "#8A8276", fontWeight: 400 }}>optional</span>
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
        </div>
      </div>

      {/* Description — full width */}
      <div className="mb-4">
        <label className={labelCls} style={{ color: "#8A8276" }}>
          Description <span style={{ color: "#8A8276", fontWeight: 400 }}>optional</span>
        </label>
        <input
          className={inputCls}
          style={inputStyle}
          type="text"
          placeholder="e.g. Summer discount for returning customers"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
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

export function PromosClient() {
  const [promos, setPromos] = useState<Promo[]>([]);
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

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promos");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { promos: Promo[] };
      setPromos(data.promos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load promos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromos();
  }, [fetchPromos]);

  // ── Create ─────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          startsAt: dtLocalToIso(createForm.startsAt) || null,
          expiresAt: dtLocalToIso(createForm.expiresAt) || null,
          minOrder: createForm.minOrder || null,
          maxRedemptions: createForm.maxRedemptions || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError((data as { error?: string }).error ?? "Failed to create");
        return;
      }
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await fetchPromos();
    } finally {
      setCreating(false);
    }
  }

  // ── Toggle active inline ───────────────────────────────────────────────────

  async function handleToggleActive(p: Promo) {
    const res = await fetch(`/api/admin/promos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      setPromos((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x))
      );
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  function openEdit(p: Promo) {
    setEditId(p.id);
    setEditError(null);
    setEditForm({
      code: p.code,
      description: p.description ?? "",
      discountType: p.discountType === "fixed" ? "fixed" : "percent",
      discountValue: p.discountValue,
      minOrder: p.minOrder ?? "",
      maxRedemptions: p.maxRedemptions !== null ? String(p.maxRedemptions) : "",
      isActive: p.isActive,
      startsAt: isoToDtLocal(p.startsAt),
      expiresAt: isoToDtLocal(p.expiresAt),
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/promos/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          startsAt: dtLocalToIso(editForm.startsAt) || null,
          expiresAt: dtLocalToIso(editForm.expiresAt) || null,
          minOrder: editForm.minOrder || null,
          maxRedemptions: editForm.maxRedemptions || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError((data as { error?: string }).error ?? "Failed to save");
        return;
      }
      setEditId(null);
      await fetchPromos();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPromos((prev) => prev.filter((p) => p.id !== id));
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
          Promos
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
            + New Promo
          </button>
        )}
      </div>

      {/* ── Create form ────────────────────────────────────────────────────── */}
      {showCreate && (
        <section style={card}>
          <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>
            New Promo
          </h2>
          <PromoForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreate}
            submitting={creating}
            submitLabel="Create Promo"
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
          Loading promos…
        </p>
      )}
      {error && (
        <p className="text-sm" style={{ color: "#E57373" }}>
          {error}
        </p>
      )}

      {/* ── Promo list ─────────────────────────────────────────────────────── */}
      {!loading && !error && promos.length === 0 && (
        <p className="text-sm" style={{ color: "#8A8276" }}>
          No promos yet. Create one above.
        </p>
      )}

      {promos.map((p) => (
        <section key={p.id} style={card}>
          {editId === p.id ? (
            <>
              <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>
                Edit {p.code}
              </h2>
              <PromoForm
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
            </>
          ) : (
            <div>
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span
                    className="text-lg font-bold tracking-wider"
                    style={{ color: "#C9A24B" }}
                  >
                    {p.code}
                  </span>
                  {p.description && (
                    <p className="text-sm mt-0.5" style={{ color: "#8A8276" }}>
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={p.isActive}
                    onChange={() => void handleToggleActive(p)}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: p.isActive ? "#C9A24B" : "#8A8276" }}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>

              {/* Stats row */}
              <div
                className="grid gap-x-6 gap-y-1 text-sm mb-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  color: "#F3E9D6",
                }}
              >
                <div>
                  <span style={{ color: "#8A8276" }}>Type </span>
                  {p.discountType === "percent" ? "Percent" : "Fixed"}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Value </span>
                  {p.discountType === "percent"
                    ? `${p.discountValue}%`
                    : `$${Number(p.discountValue).toFixed(2)}`}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Min order </span>
                  {p.minOrder ? `$${Number(p.minOrder).toFixed(2)}` : "—"}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Redeemed </span>
                  {redemptionLabel(p)}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Expires </span>
                  {fmtExpiry(p.expiresAt)}
                </div>
                {p.startsAt && (
                  <div>
                    <span style={{ color: "#8A8276" }}>Starts </span>
                    {fmtExpiry(p.startsAt)}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className={btnBaseCls}
                  style={secondaryBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete promo "${p.code}"? This cannot be undone.`)) {
                      void handleDelete(p.id);
                    }
                  }}
                  disabled={deletingId === p.id}
                  className={btnBaseCls}
                  style={{ ...dangerBtn, opacity: deletingId === p.id ? 0.5 : 1 }}
                >
                  {deletingId === p.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
