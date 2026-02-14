import React from "react";

export default function Invoices() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Invoices</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
              Coming next. This page will show invoice status, totals, and payment links.
            </div>
          </div>
          <button
            type="button"
            style={{
              padding: "10px 14px",
              borderRadius: "var(--phs-radius-pill)",
              border: "1px solid var(--phs-border)",
              background: "var(--phs-surface)",
              cursor: "pointer",
              height: 42,
              alignSelf: "start",
            }}
            onClick={() => alert("Invoices endpoints not wired yet.")}
          >
            + New Invoice
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Invoice List</div>
        <div style={{ color: "var(--phs-muted)" }}>
          No invoice data connected yet. Once you add Core routes, we’ll wire this to:
          <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 13 }}>
            GET /api/v1/invoices
          </div>
        </div>
      </div>
    </div>
  );
}
