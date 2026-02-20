import React, { useMemo, useState } from "react";

export default function PriceBookBrowser({
  items = [],
  loading = false,
  error = "",
  onAdd,                // (priceBookItemId, qty) => void
  disabled = false,
}) {
  const [activeType, setActiveType] = useState("service"); // service | material
  const [path, setPath] = useState([]);

  function splitPath(cat) {
    return String(cat || "")
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function buildTree(list) {
    const root = { children: new Map(), items: [] };
    for (const it of list) {
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

  function money(n) {
    const x = Number(n || 0);
    return `$${x.toFixed(2)}`;
  }

  const filtered = useMemo(
    () => (items || []).filter((i) => (i.type || "service") === activeType),
    [items, activeType]
  );

  const tree = useMemo(() => buildTree(filtered), [filtered]);

  const node = useMemo(() => {
    let cur = tree;
    for (const seg of path) cur = cur.children.get(seg) || { children: new Map(), items: [] };
    return cur;
  }, [tree, path]);

  const crumbs = ["All", ...path];

  return (
    <div className="card" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900 }}>Add items</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => { setActiveType("service"); setPath([]); }}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: activeType === "service" ? "none" : "1px solid var(--phs-border)",
              background: activeType === "service" ? "var(--phs-primary)" : "white",
              color: activeType === "service" ? "white" : "var(--phs-text)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Services
          </button>

          <button
            type="button"
            onClick={() => { setActiveType("material"); setPath([]); }}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: activeType === "material" ? "none" : "1px solid var(--phs-border)",
              background: activeType === "material" ? "var(--phs-primary)" : "white",
              color: activeType === "material" ? "white" : "var(--phs-text)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Materials
          </button>
        </div>
      </div>

      {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
      {loading ? <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>Loading price book…</div> : null}

      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
        {crumbs.map((c, idx) => (
          <button
            key={`${c}-${idx}`}
            type="button"
            onClick={() => setPath(idx === 0 ? [] : path.slice(0, idx))}
            style={{
              border: "1px solid var(--phs-border)",
              background: "white",
              padding: "6px 10px",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 900,
              color: idx === crumbs.length - 1 ? "var(--phs-text)" : "var(--phs-muted)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Categories */}
      {node.children.size ? (
        <div style={{ display: "grid", gap: 8 }}>
          {Array.from(node.children.keys()).sort().map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setPath((p) => [...p, name])}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid var(--phs-border)",
                background: "var(--phs-surface)",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Items */}
      {node.items?.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {node.items
            .slice()
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map((it) => (
              <div
                key={it._id}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--phs-border)",
                  background: "white",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ fontWeight: 900 }}>{it.name}</div>
                <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
                  {it.description || "—"}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>
                    {money(it.price)}{" "}
                    <span style={{ color: "var(--phs-muted)", fontWeight: 800 }}>
                      / {it.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd?.(it._id, 1)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "none",
                      background: "var(--phs-primary)",
                      color: "white",
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontWeight: 900,
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
          {node.children.size ? "Pick a category…" : "No items here."}
        </div>
      )}
    </div>
  );
}