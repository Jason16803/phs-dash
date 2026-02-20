import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const STATUS_FILTERS = [
  "all",
  "created",
  "estimate",
  "scheduled",
  "in-progress",
  "completed",
  "canceled",
  "archived",
];

// Kanban column order for v1
const KANBAN_COLUMNS = [
  { key: "created", label: "Created" },
  { key: "estimate", label: "Estimate" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "canceled", label: "Canceled" },
  { key: "archived", label: "Archived" },
];

function prettyStatus(s) {
  return (s || "created").replace("-", " ");
}

function customerName(customerId) {
  if (!customerId) return "—";
  const full = `${customerId?.firstName || ""} ${customerId?.lastName || ""}`.trim();
  return full || customerId?.email || "—";
}

export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  async function fetchJobs() {
    setLoading(true);
    setError("");
    try {
      const res = await coreClient.get("/api/v1/jobs", {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: {
          search: q.trim() || undefined,
          status: status !== "all" ? status : undefined,
          limit: 100,
          page: 1,
        },
      });

      setJobs(res.data?.data?.jobs || res.data?.data || []);
    } catch (e) {
      setJobs([]);
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const rows = useMemo(() => jobs || [], [jobs]);

  // For Kanban: group jobs by status
  const kanban = useMemo(() => {
    const map = new Map();
    for (const c of KANBAN_COLUMNS) map.set(c.key, []);

    for (const j of rows) {
      const key = (j.status || "created");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(j);
    }

    // Optional: within each column, sort by scheduledDate (soonest first), then createdAt
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => {
        const ad = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
        const bd = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
        if (ad !== bd) return ad - bd;

        const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bc - ac;
      });
    }

    return map;
  }, [rows]);

  const showKanban = status === "all";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div className="min-w-0">
            <div style={{ fontWeight: 900, fontSize: 18 }}>Jobs</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
              Track work from created → scheduled → completed.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
              placeholder="Search jobs…"
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                minWidth: 260,
              }}
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                background: "white",
                minWidth: 180,
                textTransform: "capitalize",
              }}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses (Kanban)" : prettyStatus(s)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchJobs}
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
          </div>
        </div>

        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
      </div>

      {/* Body */}
      <div className="card">
        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>No jobs yet.</div>
        ) : showKanban ? (
          <KanbanBoard kanban={kanban} onOpen={(id) => navigate(`/admin/jobs/${id}`)} />
        ) : (
          <ListView rows={rows} onOpen={(id) => navigate(`/admin/jobs/${id}`)} />
        )}
      </div>
    </div>
  );
}

function KanbanBoard({ kanban, onOpen }) {
  return (
    <div
      style={{
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      {/* Horizontal scroll container */}
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "320px", // fixed width
          gap: 16,
          overflowX: "auto",
          paddingBottom: 8,
          scrollSnapType: "x proximity",
        }}
      >
        {KANBAN_COLUMNS.map((col) => {
          const items = kanban.get(col.key) || [];
          return (
            <div
              key={col.key}
              style={{
                scrollSnapAlign: "start",
                border: "1px solid var(--phs-border)",
                borderRadius: 16,
                background: "rgba(255,255,255,0.75)",
                display: "grid",
                gridTemplateRows: "auto 1fr",
                minHeight: 220,
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: "12px 12px",
                  borderBottom: "1px solid var(--phs-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 950 }}>{col.label}</div>
                <div
                  style={{
                    fontWeight: 950,
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "var(--phs-primary-soft)",
                    color: "var(--phs-primary)",
                  }}
                >
                  {items.length}
                </div>
              </div>

              {/* Cards */}
              <div style={{ padding: 12, display: "grid", gap: 10, alignContent: "start" }}>
                {items.length === 0 ? (
                  <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>No jobs</div>
                ) : (
                  items.map((j) => (
                    <button
                      key={j._id}
                      type="button"
                      onClick={() => onOpen(j._id)}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid var(--phs-border)",
                        background: "white",
                        cursor: "pointer",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 1000,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={j.title || "Untitled job"}
                      >
                        {j.title || "Untitled job"}
                      </div>

                      <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
                        <strong>{customerName(j.customerId)}</strong>
                      </div>

                      <div style={{ color: "var(--phs-muted)", fontSize: 12 }}>
                        {j.scheduledDate
                          ? `Scheduled: ${new Date(j.scheduledDate).toLocaleString()}`
                          : "Not scheduled"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ color: "var(--phs-muted)", fontSize: 12 }}>
        Tip: Drag-and-drop status changes can ship in v1.4 (after you’re happy with the flow).
      </div>
    </div>
  );
}

function ListView({ rows, onOpen }) {
  return (
    <div style={{ padding: 14, display: "grid", gap: 10 }}>
      {rows.map((j) => (
        <button
          key={j._id}
          type="button"
          onClick={() => onOpen(j._id)}
          style={{
            textAlign: "left",
            padding: 14,
            borderRadius: 14,
            border: "1px solid var(--phs-border)",
            background: "white",
            cursor: "pointer",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 1000 }}>{j.title || "Untitled job"}</div>
            <div style={{ fontWeight: 900, color: "var(--phs-muted)", textTransform: "capitalize" }}>
              {j.status || "created"}
            </div>
          </div>

          <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
            Customer: <strong>{customerName(j.customerId)}</strong>
          </div>

          <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
            {j.scheduledDate ? `Scheduled: ${new Date(j.scheduledDate).toLocaleString()}` : "Not scheduled"}
          </div>
        </button>
      ))}
    </div>
  );
}