"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Reward {
  id: string;
  name: string | null;
  description: string | null;
  pointsRequired: number | null;
  rewardType: string | null;
  rewardValue: string | null;
  maxItemValue: string | null;
  isActive: boolean | null;
  sortOrder: number | null;
  createdAt: string;
}

type RewardType = "fixed" | "percent" | "free_item";

interface FormState {
  name: string;
  description: string;
  pointsRequired: string;
  rewardType: RewardType;
  rewardValue: string;
  maxItemValue: string;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  pointsRequired: "",
  rewardType: "fixed",
  rewardValue: "",
  maxItemValue: "",
  isActive: true,
  sortOrder: "0",
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

function rewardTypeLabel(t: string | null): string {
  if (t === "percent") return "Percent";
  if (t === "free_item") return "Free item";
  return "Fixed";
}

function rewardValueLabel(r: Reward): string {
  const n = Number(r.rewardValue ?? 0);
  if (r.rewardType === "percent") return `${n}%`;
  if (r.rewardType === "free_item") {
    return r.maxItemValue !== null ? `≤ $${Number(r.maxItemValue).toFixed(2)}` : "Free item";
  }
  return `$${n.toFixed(2)}`;
}

// ── Form (module-level so its identity is stable across parent re-renders) ──────
// Defining this inside LoyaltyClient would remount it on every keystroke, which
// steals focus from the active input. Keeping it at module scope fixes that.

function RewardForm({
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
        {/* Name */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Name
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="text"
            placeholder="Free Momo Plate"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        {/* Points required */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Points required
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="number"
            min="0"
            step="1"
            placeholder="100"
            value={form.pointsRequired}
            onChange={(e) => set("pointsRequired", e.target.value)}
          />
        </div>

        {/* Reward type */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Reward type
          </label>
          <select
            className={inputCls}
            style={inputStyle}
            value={form.rewardType}
            onChange={(e) => set("rewardType", e.target.value as RewardType)}
          >
            <option value="fixed">Fixed ($)</option>
            <option value="percent">Percent (%)</option>
            <option value="free_item">Free item</option>
          </select>
        </div>

        {/* Reward value */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Reward value{" "}
            <span style={{ color: "#C9A24B" }}>
              {form.rewardType === "percent" ? "%" : "$"}
            </span>
          </label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            type="number"
            min="0"
            max={form.rewardType === "percent" ? 100 : undefined}
            step="0.01"
            placeholder={form.rewardType === "percent" ? "10" : "5.00"}
            value={form.rewardValue}
            onChange={(e) => set("rewardValue", e.target.value)}
          />
        </div>

        {/* Max item value */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Max item value ($){" "}
            <span style={{ color: "#8A8276", fontWeight: 400 }}>optional</span>
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.maxItemValue}
            onChange={(e) => set("maxItemValue", e.target.value)}
          />
        </div>

        {/* Sort order */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>
            Sort order
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            step="1"
            placeholder="0"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
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
          placeholder="e.g. Redeem 100 points for a free momo plate"
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

export function LoyaltyClient() {
  const [rewards, setRewards] = useState<Reward[]>([]);
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

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/loyalty");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { rewards: Reward[] };
      setRewards(data.rewards);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rewards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRewards();
  }, [fetchRewards]);

  // ── Create ─────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          maxItemValue: createForm.maxItemValue || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError((data as { error?: string }).error ?? "Failed to create");
        return;
      }
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await fetchRewards();
    } finally {
      setCreating(false);
    }
  }

  // ── Toggle active inline ───────────────────────────────────────────────────

  async function handleToggleActive(r: Reward) {
    const next = !r.isActive;
    const res = await fetch(`/api/admin/loyalty/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    if (res.ok) {
      setRewards((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, isActive: next } : x))
      );
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  function openEdit(r: Reward) {
    setEditId(r.id);
    setEditError(null);
    setEditForm({
      name: r.name ?? "",
      description: r.description ?? "",
      pointsRequired: r.pointsRequired !== null ? String(r.pointsRequired) : "",
      rewardType:
        r.rewardType === "percent" || r.rewardType === "free_item"
          ? r.rewardType
          : "fixed",
      rewardValue: r.rewardValue ?? "",
      maxItemValue: r.maxItemValue ?? "",
      isActive: r.isActive ?? false,
      sortOrder: r.sortOrder !== null ? String(r.sortOrder) : "0",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/loyalty/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          maxItemValue: editForm.maxItemValue || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError((data as { error?: string }).error ?? "Failed to save");
        return;
      }
      setEditId(null);
      await fetchRewards();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/loyalty/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRewards((prev) => prev.filter((r) => r.id !== id));
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
          Loyalty Rewards
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
            + New Reward
          </button>
        )}
      </div>

      {/* ── Create form ────────────────────────────────────────────────────── */}
      {showCreate && (
        <section style={card}>
          <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>
            New Reward
          </h2>
          <RewardForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreate}
            submitting={creating}
            submitLabel="Create Reward"
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
          Loading rewards…
        </p>
      )}
      {error && (
        <p className="text-sm" style={{ color: "#E57373" }}>
          {error}
        </p>
      )}

      {/* ── Reward list ────────────────────────────────────────────────────── */}
      {!loading && !error && rewards.length === 0 && (
        <p className="text-sm" style={{ color: "#8A8276" }}>
          No rewards yet. Create one above.
        </p>
      )}

      {rewards.map((r) => (
        <section key={r.id} style={card}>
          {editId === r.id ? (
            <>
              <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>
                Edit {r.name ?? "reward"}
              </h2>
              <RewardForm
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
                    className="text-lg font-bold tracking-wide"
                    style={{ color: "#C9A24B" }}
                  >
                    {r.name ?? "Untitled reward"}
                  </span>
                  {r.description && (
                    <p className="text-sm mt-0.5" style={{ color: "#8A8276" }}>
                      {r.description}
                    </p>
                  )}
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={r.isActive ?? false}
                    onChange={() => void handleToggleActive(r)}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: r.isActive ? "#C9A24B" : "#8A8276" }}
                  >
                    {r.isActive ? "Active" : "Inactive"}
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
                  <span style={{ color: "#8A8276" }}>Points </span>
                  {r.pointsRequired ?? 0}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Type </span>
                  {rewardTypeLabel(r.rewardType)}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Value </span>
                  {rewardValueLabel(r)}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Max item </span>
                  {r.maxItemValue !== null ? `$${Number(r.maxItemValue).toFixed(2)}` : "—"}
                </div>
                <div>
                  <span style={{ color: "#8A8276" }}>Sort </span>
                  {r.sortOrder ?? 0}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(r)}
                  className={btnBaseCls}
                  style={secondaryBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete reward "${r.name ?? "this reward"}"? This cannot be undone.`
                      )
                    ) {
                      void handleDelete(r.id);
                    }
                  }}
                  disabled={deletingId === r.id}
                  className={btnBaseCls}
                  style={{ ...dangerBtn, opacity: deletingId === r.id ? 0.5 : 1 }}
                >
                  {deletingId === r.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
