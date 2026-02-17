import React, { useEffect, useMemo, useState } from "react";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const DEFAULT_FORM = {
  name: "",
  category: "General",
  description: "",
  unit: "flat",      // ✓ Fixed: backend enum value
  price: "",         // ✓ Fixed: was unitPrice
  isActive: true,
};

export default function PriceBook() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // toolbar
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  async function fetchItems() {
    setError("");
    setLoading(true);
    try {
      const params = {
        search: q.trim() || undefined,  // ✓ Fixed: backend uses 'search'
        category: category || undefined,
        active: activeOnly ? "true" : undefined,  // ✓ Fixed: backend expects string
        limit: 200,
      };

      const res = await coreClient.get("/api/v1/price-book", {  // ✓ Fixed: hyphenated
        headers: { Authorization: `Bearer ${getToken()}` },
        params,
      });

      setItems(res.data?.data?.items || []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || e?.message || "Failed to load price book.");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || "",
      category: item.category || "General",
      description: item.description || "",
      unit: item.unit || "flat",
      price: String(item.price ?? ""),  // ✓ Fixed: was unitPrice
      isActive: item.isActive !== false,
    });
    setOpen(true);
  }

  async function saveItem(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || "General",
      description: form.description.trim(),
      unit: form.unit || "flat",
      price: Number(form.price),  // ✓ Fixed: was unitPrice
      isActive: !!form.isActive,
    };

    try {
      if (editing?._id) {
        await coreClient.put(`/api/v1/price-book/${editing._id}`, payload, {  // ✓ Fixed
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } else {
        await coreClient.post("/api/v1/price-book", payload, {  // ✓ Fixed
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      }

      setOpen(false);
      setEditing(null);
      setForm(DEFAULT_FORM);
      fetchItems();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Save failed.");
    }
  }

  async function archiveItem(item) {
    if (!item?._id) return;
    if (!confirm("Archive this item? (You can re-activate later)")) return;

    setError("");
    try {
      await coreClient.put(
        `/api/v1/price-book/${item._id}`,  // ✓ Fixed
        { isActive: false },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchItems();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Archive failed.");
    }
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  // ✓ Added: Unit options matching backend enum
  const UNIT_OPTIONS = [
    { value: "flat", label: "Flat Rate" },
    { value: "per_hour", label: "Per Hour" },
    { value: "per_sqft", label: "Per Sq Ft" },
    { value: "per_unit", label: "Per Unit" },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Toolbar */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Price Book</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
              Save services + materials so estimates are fast and consistent.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchItems()}
              placeholder="Search price book…"
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                minWidth: 260,
              }}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                background: "white",
                minWidth: 180,
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, fontSize: 13, color: "var(--phs-muted)" }}>
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Active only
            </label>

            <button
              type="button"
              onClick={fetchItems}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--phs-radius-pill)",
                border: "1px solid var(--phs-border)",
                background: "var(--phs-surface)",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={openAdd}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--phs-radius-pill)",
                border: "none",
                background: "var(--phs-primary)",
                color: "white",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              + Add Item
            </button>
          </div>
        </div>

        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>No price book items yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => (
              <div
                key={it._id}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--phs-border)",
                  background: "#f9fafb",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>
                    {it.name}{" "}
                    <span style={{ color: "var(--phs-muted)", fontWeight: 800 }}>
                      • {it.category || "General"}
                    </span>
                  </div>
                  <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4 }}>
                    {it.description || "—"}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "var(--phs-muted)" }}>
                    <strong>${Number(it.price || 0).toFixed(2)}</strong> / {
                      UNIT_OPTIONS.find(u => u.value === it.unit)?.label || it.unit
                    }
                    {it.isActive === false ? " • archived" : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button
                    type="button"
                    onClick={() => openEdit(it)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--phs-border)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    Edit
                  </button>

                  {it.isActive !== false ? (
                    <button
                      type="button"
                      onClick={() => archiveItem(it)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(17,24,39,0.15)",
                        background: "rgba(17,24,39,0.04)",
                        cursor: "pointer",
                        fontWeight: 900,
                      }}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(860px, 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {editing ? "Edit item" : "Add item"}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: "1px solid var(--phs-border)",
                  background: "white",
                  borderRadius: 999,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveItem} style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    list="category-list"
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
                  />
                  <datalist id="category-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", resize: "vertical" }}
                />
              </div>

              {/* ✓ Fixed: Dropdown for unit instead of freeform text */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
                  >
                    {UNIT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* ✓ Fixed: price instead of unitPrice */}
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
                  />
                </div>
              </div>

              {/* ✓ Removed: cost and taxable fields (not in backend) */}
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--phs-border)",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: "var(--phs-primary)",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}