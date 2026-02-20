import React, { useEffect, useMemo, useRef, useState } from "react";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const DEFAULT_FORM = {
  type: "service", // ✅ add
  name: "",
  category: "General",
  description: "",
  unit: "ea",
  price: "",
  cost: "",         // ✅ add
  taxable: false,   // ✅ add
  sku: "",          // ✅ add (optional for materials)
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

  // import
  const fileRef = useRef(null);

  const [importType, setImportType] = useState(null); // "service" | "material"
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null); // {created, updated, skipped, errors...}

  const [activeType, setActiveType] = useState("service"); // or "material"
  const [path, setPath] = useState([]); // ["Handyman","Installation",...]



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
      type: item.type || "service",
      name: item.name || "",
      category: item.category || "General",
      description: item.description || "",
      unit: item.unit || "ea",
      price: String(item.price ?? ""),
      cost: String(item.cost ?? ""),
      taxable: !!item.taxable,
      sku: item.sku || "",
      isActive: item.isActive !== false,
    });
    setOpen(true);
  }

  async function saveItem(e) {
    e.preventDefault();
    setError("");

    const payload = {
      type: form.type,
      name: form.name.trim(),
      category: form.category.trim() || "General",
      description: form.description.trim(),
      unit: (form.unit || "ea").trim(),
      price: Number(form.price),
      cost: Number(form.cost || 0),
      taxable: !!form.taxable,
      sku: form.sku?.trim() || "",
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

  function pickImport(type) {
    setImportType(type);
    setImportReport(null);
    // open file picker
    if (fileRef.current) fileRef.current.click();
  }

  async function uploadCsv(file) {
    if (!file || !importType) return;

    setError("");
    setImporting(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await coreClient.post(
        `/api/v1/price-book/import?type=${importType}`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const report = res.data?.data || null;
      setImportReport(report);

      // refresh list
      await fetchItems();
    } catch (e) {
      setImportReport(null);
      setError(e?.response?.data?.message || e?.message || "CSV import failed.");
    } finally {
      setImporting(false);
    }
  }

  function splitPath(cat) {
    return String(cat || "")
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function buildTree(items) {
    const root = { children: new Map(), items: [] };

    for (const it of items) {
      const parts = splitPath(it.category);
      let node = root;

      for (const p of parts) {
        if (!node.children.has(p)) node.children.set(p, { children: new Map(), items: [] });
        node = node.children.get(p);
      }
      node.items.push(it);
    }

    return root;
  }


  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  // ✓ Added: Unit options matching backend enum
  const UNIT_OPTIONS = [
    { value: "ea", label: "Each" },
    { value: "hr", label: "Per Hour" },
    { value: "sqft", label: "Per Sq Ft" },
  ];

  // 1) scope items by activeType (service/material)
  const scopedItems = useMemo(() => {
    return items.filter((i) => (activeType ? i.type === activeType : true));
  }, [items, activeType]);

  // 2) build tree from scoped items
  const tree = useMemo(() => buildTree(scopedItems), [scopedItems]);

  // 3) get current node from path
  const currentNode = useMemo(() => {
    let node = tree;
    for (const p of path) {
      node = node?.children?.get(p);
      if (!node) return tree;
    }
    return node || tree;
  }, [tree, path]);



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

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ""; // allows re-uploading the same file
                uploadCsv(f);
              }}
            />

            <button
              type="button"
              onClick={() => pickImport("service")}
              disabled={importing}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--phs-radius-pill)",
                border: "1px solid var(--phs-border)",
                background: "white",
                cursor: "pointer",
                fontWeight: 900,
                opacity: importing ? 0.7 : 1,
              }}
            >
              {importing && importType === "service" ? "Importing…" : "Import Services CSV"}
            </button>

            <button
              type="button"
              onClick={() => pickImport("material")}
              disabled={importing}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--phs-radius-pill)",
                border: "1px solid var(--phs-border)",
                background: "white",
                cursor: "pointer",
                fontWeight: 900,
                opacity: importing ? 0.7 : 1,
              }}
            >
              {importing && importType === "material" ? "Importing…" : "Import Materials CSV"}
            </button>


          </div>
        </div>

        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
      </div>

      {importReport ? (
          <div className="card" style={{ border: "1px solid var(--phs-border)" }}>
            <div style={{ fontWeight: 900 }}>Import report</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 6, fontSize: 13 }}>
              Type: <strong>{importReport.type || importType}</strong> • Created:{" "}
              <strong>{importReport.created ?? 0}</strong> • Updated:{" "}
              <strong>{importReport.updated ?? 0}</strong> • Skipped:{" "}
              <strong>{importReport.skipped ?? 0}</strong>
            </div>

            {Array.isArray(importReport.errors) && importReport.errors.length ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>
                  Errors (showing up to {importReport.errors.length})
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {importReport.errors.slice(0, 12).map((er, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 13,
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(185,28,28,0.25)",
                        background: "rgba(185,28,28,0.06)",
                      }}
                    >
                      <strong>Row {er.row}:</strong> {er.error}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

      {/* List */}
      {/* <div className="card">
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
      </div> */}

      {/* Price Book Browser */}
      <div className="card">
        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : scopedItems.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>No {activeType} items yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {/* Breadcrumb + type switch */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setPath([])}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: 1000,
                    textTransform: "capitalize",
                  }}
                >
                  {activeType}s
                </button>

                {path.map((p, idx) => (
                  <button
                    key={p + idx}
                    type="button"
                    onClick={() => setPath(path.slice(0, idx + 1))}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 900,
                      color: "var(--phs-muted)",
                    }}
                  >
                    › {p}
                  </button>
                ))}

                {path.length ? (
                  <button
                    type="button"
                    onClick={() => setPath(path.slice(0, -1))}
                    style={{
                      marginLeft: 6,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--phs-border)",
                      background: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveType("service")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--phs-border)",
                    background: activeType === "service" ? "var(--phs-surface)" : "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Services
                </button>

                <button
                  type="button"
                  onClick={() => setActiveType("material")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--phs-border)",
                    background: activeType === "material" ? "var(--phs-surface)" : "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Materials
                </button>
              </div>
            </div>

            {/* If there are child groups → show cards */}
            {currentNode?.children?.size ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 14,
                }}
              >
                {Array.from(currentNode.children.entries()).map(([label, node]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPath((p) => [...p, label])}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      borderRadius: 16,
                      border: "1px solid var(--phs-border)",
                      background: "white",
                      cursor: "pointer",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 1000, fontSize: 16 }}>{label}</div>
                    <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
                      {node.children.size ? `${node.children.size} groups` : `${node.items.length} items`}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Leaf node → show row list like Housecall Pro */
              <div style={{ display: "grid", gap: 10 }}>
                {(currentNode?.items || []).map((it) => {
                  const unitLabel = UNIT_OPTIONS.find((u) => u.value === it.unit)?.label || it.unit;

                  return (
                    <div
                      key={it._id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 2fr 1fr 160px",
                        gap: 12,
                        alignItems: "center",
                        padding: 12,
                        border: "1px solid var(--phs-border)",
                        borderRadius: 14,
                        background: "white",
                      }}
                    >
                      <div style={{ fontWeight: 1000 }}>{it.name}</div>

                      <div
                        style={{
                          color: "var(--phs-muted)",
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {it.description || "—"}
                      </div>

                      <div style={{ fontWeight: 1000 }}>
                        ${Number(it.price || 0).toFixed(2)}{" "}
                        <span style={{ color: "var(--phs-muted)", fontWeight: 800, fontSize: 12 }}>
                          / {unitLabel}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
                  );
                })}
              </div>
            )}
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
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "white" }}
                >
                  <option value="service">Service</option>
                  <option value="material">Material</option>
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

              {/* Cost + Unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "white" }}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Taxable */}
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                <input
                  type="checkbox"
                  checked={form.taxable}
                  onChange={(e) => setForm((p) => ({ ...p, taxable: e.target.checked }))}
                />
                Taxable
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                Active
              </label>


              
              {form.type === "material" ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Part # / SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
                  />
                </div>
              ) : null}


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