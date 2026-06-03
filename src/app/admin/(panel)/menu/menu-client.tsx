"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number | null;
  isCatering: boolean | null;
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  hasSpiceOptions: boolean | null;
  hasRiceChoice: boolean | null;
  isVegetarian: boolean | null;
  isVeganOption: boolean | null;
  isGlutenFree: boolean | null;
  isAvailable: boolean | null;
  sortOrder: number | null;
  halfTrayPrice: string | null;
  fullTrayPrice: string | null;
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
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
const inputCls = "w-full rounded-lg px-4 py-2.5";
const labelCls = "block text-xs font-semibold uppercase tracking-widest mb-2";
const primaryBtn: React.CSSProperties = { backgroundColor: "#C9A24B", color: "#14100D" };
const secondaryBtn: React.CSSProperties = {
  border: "1px solid rgba(201,162,75,0.3)",
  color: "#C9A24B",
};

// ─── Blank form states ──────────────────────────────────────────────────────────
const BLANK_CATEGORY = {
  name: "",
  description: "",
  sortOrder: "",
  isCatering: false,
};

const BLANK_ITEM = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  sortOrder: "",
  halfTrayPrice: "",
  fullTrayPrice: "",
  hasSpiceOptions: false,
  hasRiceChoice: false,
  isVegetarian: false,
  isVeganOption: false,
  isGlutenFree: false,
  isAvailable: true,
};

// ─── Dietary badge ─────────────────────────────────────────────────────────────
function DietaryBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
    >
      {label}
    </span>
  );
}

// ─── Availability toggle ────────────────────────────────────────────────────────
function AvailabilityToggle({
  item,
  onToggled,
}: {
  item: MenuItem;
  onToggled: (updated: MenuItem) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json() as { item: MenuItem };
      onToggled(data.item);
    }
  }

  const available = item.isAvailable !== false;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="px-3 py-1 rounded-full text-xs font-semibold"
      style={
        available
          ? { backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }
          : { backgroundColor: "rgba(138,130,118,0.15)", color: "#8A8276" }
      }
    >
      {loading ? "…" : available ? "Available" : "Unavailable"}
    </button>
  );
}

// ─── Category form (add / edit) ─────────────────────────────────────────────────
function CategoryForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Category;
  onSaved: (cat: Category) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          sortOrder: initial.sortOrder != null ? String(initial.sortOrder) : "",
          isCatering: initial.isCatering ?? false,
        }
      : { ...BLANK_CATEGORY }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const body = {
      name: form.name,
      description: form.description || null,
      sortOrder: form.sortOrder !== "" ? Number(form.sortOrder) : null,
      isCatering: form.isCatering,
    };
    const url = initial
      ? `/api/admin/menu/categories/${initial.id}`
      : "/api/admin/menu/categories";
    const res = await fetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { category?: Category; error?: string };
    setSaving(false);
    if (!res.ok) { setErr(data.error ?? "Save failed"); return; }
    onSaved(data.category!);
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} style={{ color: "#8A8276" }}>Category name *</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} style={{ color: "#8A8276" }}>Sort order</label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={{ color: "#8A8276" }}>Description</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input
            id="isCatering"
            type="checkbox"
            checked={form.isCatering}
            onChange={(e) => setForm((p) => ({ ...p, isCatering: e.target.checked }))}
          />
          <label htmlFor="isCatering" className="text-sm" style={{ color: "#F3E9D6" }}>
            Catering category
          </label>
        </div>
      </div>
      {err && <p className="mb-3 text-sm" style={{ color: "#E57373" }}>{err}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add category"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={secondaryBtn}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Item form (add / edit) ─────────────────────────────────────────────────────
function ItemForm({
  initial,
  categories,
  defaultCategoryId,
  onSaved,
  onCancel,
}: {
  initial?: MenuItem;
  categories: Category[];
  defaultCategoryId?: string;
  onSaved: (item: MenuItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          categoryId: initial.categoryId,
          name: initial.name,
          description: initial.description ?? "",
          price: initial.price,
          imageUrl: initial.imageUrl ?? "",
          sortOrder: initial.sortOrder != null ? String(initial.sortOrder) : "",
          halfTrayPrice: initial.halfTrayPrice ?? "",
          fullTrayPrice: initial.fullTrayPrice ?? "",
          hasSpiceOptions: initial.hasSpiceOptions ?? false,
          hasRiceChoice: initial.hasRiceChoice ?? false,
          isVegetarian: initial.isVegetarian ?? false,
          isVeganOption: initial.isVeganOption ?? false,
          isGlutenFree: initial.isGlutenFree ?? false,
          isAvailable: initial.isAvailable !== false,
        }
      : { ...BLANK_ITEM, categoryId: defaultCategoryId ?? "" }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const body = {
      categoryId: form.categoryId,
      name: form.name,
      description: form.description || null,
      price: form.price,
      imageUrl: form.imageUrl || null,
      sortOrder: form.sortOrder !== "" ? Number(form.sortOrder) : null,
      halfTrayPrice: form.halfTrayPrice || null,
      fullTrayPrice: form.fullTrayPrice || null,
      hasSpiceOptions: form.hasSpiceOptions,
      hasRiceChoice: form.hasRiceChoice,
      isVegetarian: form.isVegetarian,
      isVeganOption: form.isVeganOption,
      isGlutenFree: form.isGlutenFree,
      isAvailable: form.isAvailable,
    };
    const url = initial
      ? `/api/admin/menu/items/${initial.id}`
      : "/api/admin/menu/items";
    const res = await fetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { item?: MenuItem; error?: string };
    setSaving(false);
    if (!res.ok) { setErr(data.error ?? "Save failed"); return; }
    onSaved(data.item!);
  }

  const boolField = (
    key: keyof typeof form,
    label: string
  ) => (
    <label key={key} className="flex items-center gap-2 text-sm" style={{ color: "#F3E9D6" }}>
      <input
        type="checkbox"
        checked={form[key] as boolean}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Category */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} style={{ color: "#8A8276" }}>Category *</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={form.categoryId}
            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
            required
          >
            <option value="">— select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {/* Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} style={{ color: "#8A8276" }}>Item name *</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>
        {/* Price */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>Price *</label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            required
          />
        </div>
        {/* Sort order */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>Sort order</label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
          />
        </div>
        {/* Description */}
        <div className="col-span-2">
          <label className={labelCls} style={{ color: "#8A8276" }}>Description</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        {/* Half / Full tray prices */}
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>Half tray price</label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            step="0.01"
            min="0"
            value={form.halfTrayPrice}
            onChange={(e) => setForm((p) => ({ ...p, halfTrayPrice: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: "#8A8276" }}>Full tray price</label>
          <input
            className={inputCls}
            style={inputStyle}
            type="number"
            step="0.01"
            min="0"
            value={form.fullTrayPrice}
            onChange={(e) => setForm((p) => ({ ...p, fullTrayPrice: e.target.value }))}
          />
        </div>
        {/* Image URL */}
        <div className="col-span-2">
          <label className={labelCls} style={{ color: "#8A8276" }}>Image URL</label>
          <input
            className={inputCls}
            style={inputStyle}
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          />
        </div>
        {/* Boolean flags */}
        <div className="col-span-2">
          <label className={labelCls} style={{ color: "#8A8276" }}>Options &amp; dietary flags</label>
          <div className="flex flex-wrap gap-4 mt-1">
            {boolField("isAvailable", "Available")}
            {boolField("hasSpiceOptions", "Spice options")}
            {boolField("hasRiceChoice", "Rice choice")}
            {boolField("isVegetarian", "Vegetarian")}
            {boolField("isVeganOption", "Vegan option")}
            {boolField("isGlutenFree", "Gluten free")}
          </div>
        </div>
      </div>
      {err && <p className="mb-3 text-sm" style={{ color: "#E57373" }}>{err}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add item"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={secondaryBtn}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Main client component ──────────────────────────────────────────────────────
export function MenuClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalErr, setGlobalErr] = useState<string | null>(null);

  // UI state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showAddItemForCategory, setShowAddItemForCategory] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setGlobalErr(null);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        fetch("/api/admin/menu/categories"),
        fetch("/api/admin/menu/items"),
      ]);
      if (!catsRes.ok || !itemsRes.ok) {
        setGlobalErr("Failed to load menu data.");
        setLoading(false);
        return;
      }
      const catsData = await catsRes.json() as { categories: Category[] };
      const itemsData = await itemsRes.json() as { items: MenuItem[] };
      setCategories(catsData.categories);
      setItems(itemsData.items);
    } catch {
      setGlobalErr("Network error loading menu.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ─── Category actions ───────────────────────────────────────────────────────
  function onCategorySaved(cat: Category) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      return idx >= 0
        ? prev.map((c) => (c.id === cat.id ? cat : c))
        : [...prev, cat];
    });
    setShowAddCategory(false);
    setEditingCategoryId(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? This will fail if items exist in it.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/menu/categories/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      const data = await res.json() as { error?: string };
      alert(data.error ?? "Delete failed");
    }
  }

  // ─── Item actions ───────────────────────────────────────────────────────────
  function onItemSaved(item: MenuItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      return idx >= 0
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, item];
    });
    setShowAddItemForCategory(null);
    setEditingItemId(null);
  }

  function onItemToggled(item: MenuItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this menu item?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/menu/items/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      const data = await res.json() as { error?: string };
      alert(data.error ?? "Delete failed");
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm" style={{ color: "#8A8276" }}>Loading menu…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl"
          style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}
        >
          Menu
        </h1>
        <button
          type="button"
          onClick={() => { setShowAddCategory(true); setEditingCategoryId(null); }}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={primaryBtn}
        >
          + Add category
        </button>
      </div>

      {globalErr && <p className="mb-4 text-sm" style={{ color: "#E57373" }}>{globalErr}</p>}

      {/* Add category form */}
      {showAddCategory && (
        <div style={card}>
          <h2 className="text-base font-semibold mb-2" style={{ color: "#F3E9D6" }}>New category</h2>
          <CategoryForm
            onSaved={onCategorySaved}
            onCancel={() => setShowAddCategory(false)}
          />
        </div>
      )}

      {/* Categories list */}
      {categories.length === 0 && !showAddCategory && (
        <p className="text-sm" style={{ color: "#8A8276" }}>No categories yet. Add one above.</p>
      )}

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.categoryId === cat.id);
        const isEditingCat = editingCategoryId === cat.id;
        const isAddingItem = showAddItemForCategory === cat.id;

        return (
          <div key={cat.id} style={card}>
            {/* Category header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold" style={{ color: "#F3E9D6" }}>{cat.name}</h2>
                  {cat.isCatering && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
                    >
                      Catering
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "#8A8276" }}>
                    {catItems.length} item{catItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {cat.description && (
                  <p className="text-sm mt-0.5" style={{ color: "#8A8276" }}>{cat.description}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(isEditingCat ? null : cat.id);
                    setShowAddCategory(false);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={secondaryBtn}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  disabled={deletingId === cat.id}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ border: "1px solid rgba(229,115,115,0.3)", color: "#E57373" }}
                >
                  {deletingId === cat.id ? "…" : "Delete"}
                </button>
              </div>
            </div>

            {/* Edit category inline form */}
            {isEditingCat && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid rgba(201,162,75,0.12)" }}
              >
                <CategoryForm
                  initial={cat}
                  onSaved={onCategorySaved}
                  onCancel={() => setEditingCategoryId(null)}
                />
              </div>
            )}

            {/* Items in this category */}
            {catItems.length > 0 && (
              <div
                className="mt-4 pt-4 flex flex-col gap-3"
                style={{ borderTop: "1px solid rgba(201,162,75,0.12)" }}
              >
                {catItems.map((item) => {
                  const isEditingItem = editingItemId === item.id;
                  return (
                    <div key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: "#F3E9D6" }}>
                              {item.name}
                            </span>
                            <span className="text-sm" style={{ color: "#C9A24B" }}>
                              ${item.price}
                            </span>
                            <AvailabilityToggle item={item} onToggled={onItemToggled} />
                            <DietaryBadge label="V" active={!!item.isVegetarian} />
                            <DietaryBadge label="Ve" active={!!item.isVeganOption} />
                            <DietaryBadge label="GF" active={!!item.isGlutenFree} />
                            <DietaryBadge label="Spicy" active={!!item.hasSpiceOptions} />
                            <DietaryBadge label="Rice" active={!!item.hasRiceChoice} />
                          </div>
                          {item.description && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: "#8A8276" }}>
                              {item.description}
                            </p>
                          )}
                          {(item.halfTrayPrice || item.fullTrayPrice) && (
                            <p className="text-xs mt-0.5" style={{ color: "#8A8276" }}>
                              {item.halfTrayPrice ? `½ tray $${item.halfTrayPrice}` : ""}
                              {item.halfTrayPrice && item.fullTrayPrice ? " · " : ""}
                              {item.fullTrayPrice ? `full tray $${item.fullTrayPrice}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(isEditingItem ? null : item.id);
                              setShowAddItemForCategory(null);
                            }}
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={secondaryBtn}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            disabled={deletingId === item.id}
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ border: "1px solid rgba(229,115,115,0.3)", color: "#E57373" }}
                          >
                            {deletingId === item.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </div>
                      {/* Edit item inline form */}
                      {isEditingItem && (
                        <div
                          className="mt-3 pt-3"
                          style={{ borderTop: "1px solid rgba(201,162,75,0.08)" }}
                        >
                          <ItemForm
                            initial={item}
                            categories={categories}
                            onSaved={onItemSaved}
                            onCancel={() => setEditingItemId(null)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add item to this category */}
            <div className="mt-4">
              {!isAddingItem ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemForCategory(cat.id);
                    setEditingItemId(null);
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={secondaryBtn}
                >
                  + Add item
                </button>
              ) : (
                <div
                  className="pt-4"
                  style={{ borderTop: "1px solid rgba(201,162,75,0.12)" }}
                >
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#F3E9D6" }}>
                    New item in &ldquo;{cat.name}&rdquo;
                  </h3>
                  <ItemForm
                    categories={categories}
                    defaultCategoryId={cat.id}
                    onSaved={onItemSaved}
                    onCancel={() => setShowAddItemForCategory(null)}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
