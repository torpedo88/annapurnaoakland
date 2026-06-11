"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";

type MenuOption = { id: string; name: string; isCatering: boolean };

export function SettingsForm({ initial, role }: { initial: Settings; role: "owner" | "manager" | "staff" }) {
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const isOwner = role === "owner";

  useEffect(() => {
    fetch("/api/menu", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items: MenuOption[] } | null) => setMenuOptions(d?.items ?? []))
      .catch(() => { /* dropdown stays empty */ });
  }, []);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error ?? "Save failed"); return; }
    setS(data as Settings);
    setMsg("Saved.");
  }

  const card: React.CSSProperties = {
    backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.18)",
    borderRadius: 16, padding: 24, marginBottom: 20,
  };
  const label = "block text-xs font-semibold uppercase tracking-widest mb-2";
  const input = "w-full rounded-lg px-4 py-2.5";
  const inputStyle: React.CSSProperties = {
    backgroundColor: "#14100D", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-6" style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}>
        Settings
      </h1>
      {msg && <p className="mb-4 text-sm" style={{ color: "#C9A24B" }}>{msg}</p>}

      {/* Ordering availability — manager+ */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Ordering</h2>
        {([
          ["ordering_paused", "Pause online ordering"],
          ["pickup_enabled", "Pickup enabled"],
          ["delivery_enabled", "Delivery enabled"],
        ] as const).map(([key, lbl]) => (
          <label key={key} className="flex items-center justify-between py-2" style={{ color: "#F3E9D6" }}>
            <span>{lbl}</span>
            <input
              type="checkbox"
              checked={s[key]}
              onChange={(e) => save({ [key]: e.target.checked })}
              disabled={saving}
            />
          </label>
        ))}
      </section>

      {/* Tax — owner only */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Tax {!isOwner && "(owner only)"}</h2>
        <label className={label} style={{ color: "#8A8276" }}>Sales tax rate (%) — e.g. 9.25</label>
        <div className="flex gap-3 items-center">
          <input
            key={s.tax_rate}
            className={input} style={inputStyle} type="number" step="0.01" min="0" max="99.99"
            defaultValue={+(s.tax_rate * 100).toFixed(2)} disabled={!isOwner || saving}
            onBlur={(e) => {
              if (!isOwner) return;
              const pct = Number(e.target.value);
              if (!Number.isFinite(pct) || pct < 0 || pct >= 100) { setMsg("Enter a percent between 0 and 99.99"); return; }
              save({ tax_rate: +(pct / 100).toFixed(6) });
            }}
          />
          <span style={{ color: "#8A8276" }}>%  (= {(s.tax_rate * 100).toFixed(2)}% applied)</span>
        </div>
      </section>

      {/* Delivery — owner only */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Delivery charges {!isOwner && "(owner only)"}</h2>
        <DeliveryFields s={s} disabled={!isOwner || saving}
          onSave={(delivery) => save({ delivery })} label={label} input={input} inputStyle={inputStyle} />
      </section>

      {/* Dish of the Day — manager+ */}
      <section style={card}>
        <h2 className="text-lg mb-4" style={{ color: "#F3E9D6" }}>Dish of the Day</h2>
        <div className="mb-4">
          <label className={label} style={{ color: "#8A8276" }}>Menu item</label>
          <select
            className={input}
            style={inputStyle}
            value={s.dish_of_day?.itemId ?? ""}
            disabled={saving}
            onChange={(e) =>
              save({
                dish_of_day: {
                  itemId: e.target.value || null,
                  discountPercent: s.dish_of_day?.discountPercent ?? 0,
                },
              })
            }
          >
            <option value="">— None —</option>
            {menuOptions
              .filter((m) => !m.isCatering)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className={label} style={{ color: "#8A8276" }}>Discount % (optional)</label>
          <input
            className={input}
            style={inputStyle}
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={s.dish_of_day?.discountPercent ?? 0}
            disabled={saving}
            onBlur={(e) =>
              save({
                dish_of_day: {
                  itemId: s.dish_of_day?.itemId ?? null,
                  discountPercent: Number(e.target.value),
                },
              })
            }
          />
          <p className="mt-1 text-xs" style={{ color: "#8A8276" }}>
            Shown on the homepage with a strikethrough price.
          </p>
        </div>
      </section>
    </div>
  );
}

function DeliveryFields({
  s, disabled, onSave, label, input, inputStyle,
}: {
  s: Settings; disabled: boolean; onSave: (d: Settings["delivery"]) => void;
  label: string; input: string; inputStyle: React.CSSProperties;
}) {
  const [d, setD] = useState(s.delivery);
  const set = (patch: Partial<Settings["delivery"]>) => setD((p) => ({ ...p, ...patch }));
  const num = (key: keyof Settings["delivery"], lbl: string, hint?: string) => (
    <div className="mb-3">
      <label className={label} style={{ color: "#8A8276" }}>{lbl}{hint ? ` ${hint}` : ""}</label>
      <input className={input} style={inputStyle} type="number" min="0" disabled={disabled}
        value={d[key] as number} onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<Settings["delivery"]>)} />
    </div>
  );
  return (
    <>
      <div className="mb-3">
        <label className={label} style={{ color: "#8A8276" }}>Delivery dispatch</label>
        <select className={input} style={inputStyle} value={d.dispatchMode ?? "doordash"} disabled={disabled}
          onChange={(e) => set({ dispatchMode: e.target.value === "self" ? "self" : "doordash" })}>
          <option value="doordash">DoorDash (auto-dispatch)</option>
          <option value="self">Self-delivery (flat fee, staff deliver)</option>
        </select>
      </div>
      <div className="mb-3">
        <label className={label} style={{ color: "#8A8276" }}>Fee mode</label>
        <select className={input} style={inputStyle} value={d.mode} disabled={disabled}
          onChange={(e) => set({ mode: e.target.value === "flat" ? "flat" : "live" })}>
          <option value="live">Live DoorDash quote</option>
          <option value="flat">Flat fee</option>
        </select>
      </div>
      {d.mode === "flat" ? num("flatFeeCents", "Flat fee", "(cents)") : (
        <>
          {num("markupCents", "Markup", "(cents added to live fee)")}
          {num("markupPercent", "Markup", "(% of live fee)")}
        </>
      )}
      {num("freeThresholdCents", "Free delivery over", "(subtotal cents, 0 = off)")}
      {num("minOrderCents", "Minimum delivery order", "(cents, 0 = off)")}
      {num("maxRadiusMiles", "Max delivery radius", "(miles)")}
      <button type="button" disabled={disabled} onClick={() => onSave(d)}
        className="mt-2 px-5 py-2.5 rounded-full font-bold"
        style={{ backgroundColor: "#C9A24B", color: "#14100D", opacity: disabled ? 0.5 : 1 }}>
        Save delivery settings
      </button>
    </>
  );
}
