"use client";

import { useEffect, useState, useCallback } from "react";

type StaffRole = "owner" | "manager" | "staff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES: StaffRole[] = ["owner", "manager", "staff"];

const ROLE_COLORS: Partial<Record<string, { bg: string; color: string }>> = {
  owner: { bg: "rgba(201,162,75,0.18)", color: "#C9A24B" },
  manager: { bg: "rgba(100,160,255,0.15)", color: "#7EB8FF" },
  staff: { bg: "rgba(138,130,118,0.18)", color: "#8A8276" },
};

const cardStyle: React.CSSProperties = {
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

const labelStyle: React.CSSProperties = { color: "#8A8276" };

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: "#C9A24B",
  color: "#14100D",
};

const secondaryBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(201,162,75,0.3)",
  color: "#C9A24B",
  backgroundColor: "transparent",
};

const mutedStyle: React.CSSProperties = { color: "#8A8276" };

// ─── Add Staff Form ────────────────────────────────────────────────────────────

interface AddStaffFormProps {
  onCreated: () => void;
}

function AddStaffForm({ onCreated }: AddStaffFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create staff member");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      setOpen(false);
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full text-sm font-semibold"
        style={primaryBtnStyle}
      >
        + Add Staff Member
      </button>
    );
  }

  return (
    <div style={cardStyle}>
      <h2
        className="text-xl mb-5"
        style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}
      >
        Add Staff Member
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={labelStyle}>
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg px-4 py-2.5"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={labelStyle}>
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-lg px-4 py-2.5"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={labelStyle}>
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Temporary password"
              className="w-full rounded-lg px-4 py-2.5"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={labelStyle}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-lg px-4 py-2.5"
              style={inputStyle}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#FF7B7B" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ ...primaryBtnStyle, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={secondaryBtnStyle}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Staff Row ─────────────────────────────────────────────────────────────────

interface StaffRowProps {
  member: StaffMember;
  onUpdated: () => void;
}

function StaffRow({ member, onUpdated }: StaffRowProps) {
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [resettingPw, setResettingPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const roleColors = ROLE_COLORS[member.role] ?? { bg: "rgba(138,130,118,0.18)", color: "#8A8276" };

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setRowError(data.error ?? "Update failed");
        return false;
      }
      onUpdated();
      return true;
    } catch {
      setRowError("Network error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await patch({ role: e.target.value });
  }

  async function handleToggleActive() {
    await patch({ isActive: !member.isActive });
  }

  async function handleDelete() {
    if (!confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    setBusy(true);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setRowError(data.error ?? "Delete failed");
        return;
      }
      onUpdated();
    } catch {
      setRowError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (!newPassword) { setPwError("Password cannot be empty"); return; }
    const ok = await patch({ password: newPassword });
    if (ok) {
      setNewPassword("");
      setResettingPw(false);
    } else {
      setPwError(rowError);
      setRowError(null);
    }
  }

  return (
    <div style={cardStyle}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="text-base font-semibold"
              style={{ color: "#F3E9D6" }}
            >
              {member.name}
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: roleColors.bg, color: roleColors.color }}
            >
              {member.role}
            </span>
            {!member.isActive && (
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,100,100,0.12)", color: "#FF7B7B" }}
              >
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm truncate" style={mutedStyle}>
            {member.email}
          </p>
          <p className="text-xs mt-1" style={mutedStyle}>
            Added {new Date(member.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role select */}
          <select
            value={member.role}
            onChange={handleRoleChange}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ ...inputStyle, opacity: busy ? 0.6 : 1 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>

          {/* Toggle active */}
          <button
            onClick={handleToggleActive}
            disabled={busy}
            className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ ...secondaryBtnStyle, opacity: busy ? 0.6 : 1 }}
          >
            {member.isActive ? "Deactivate" : "Activate"}
          </button>

          {/* Reset password */}
          <button
            onClick={() => { setResettingPw((v) => !v); setPwError(null); }}
            disabled={busy}
            className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ ...secondaryBtnStyle, opacity: busy ? 0.6 : 1 }}
          >
            Reset PW
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{
              border: "1px solid rgba(255,100,100,0.3)",
              color: "#FF7B7B",
              backgroundColor: "transparent",
              opacity: busy ? 0.6 : 1,
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Row-level error */}
      {rowError && (
        <p className="text-sm mt-3" style={{ color: "#FF7B7B" }}>
          {rowError}
        </p>
      )}

      {/* Password reset inline form */}
      {resettingPw && (
        <form onSubmit={handlePasswordReset} className="mt-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={labelStyle}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-lg px-4 py-2.5"
              style={inputStyle}
            />
            {pwError && (
              <p className="text-xs mt-1" style={{ color: "#FF7B7B" }}>
                {pwError}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ ...primaryBtnStyle, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Saving…" : "Save Password"}
          </button>
          <button
            type="button"
            onClick={() => { setResettingPw(false); setNewPassword(""); setPwError(null); }}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={secondaryBtnStyle}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Main Client ───────────────────────────────────────────────────────────────

export function StaffClient() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json() as { staff?: StaffMember[]; error?: string };
      if (!res.ok) {
        setFetchError(data.error ?? "Failed to load staff");
        return;
      }
      setMembers(data.staff ?? []);
    } catch {
      setFetchError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ maxWidth: "48rem" }}>
      <h1
        className="text-3xl mb-6"
        style={{
          color: "#F3E9D6",
          fontFamily: "var(--font-display)",
          fontWeight: 200,
        }}
      >
        Staff
      </h1>

      <div className="mb-6">
        <AddStaffForm onCreated={load} />
      </div>

      {loading && (
        <p className="text-sm" style={mutedStyle}>
          Loading…
        </p>
      )}

      {fetchError && (
        <p className="text-sm" style={{ color: "#FF7B7B" }}>
          {fetchError}
        </p>
      )}

      {!loading && !fetchError && members.length === 0 && (
        <p className="text-sm" style={mutedStyle}>
          No staff members yet.
        </p>
      )}

      {members.map((m) => (
        <StaffRow key={m.id} member={m} onUpdated={load} />
      ))}
    </div>
  );
}
