import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayLabel(d) {
  const today = startOfDay(new Date()).getTime();
  const t = startOfDay(d).getTime();
  const diffDays = Math.round((t - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function customerName(customerId) {
  if (!customerId) return "—";
  const full = `${customerId?.firstName || ""} ${customerId?.lastName || ""}`.trim();
  return full || customerId?.email || "—";
}

export default function Calendar() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await coreClient.get("/api/v1/jobs", {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: {
          status: "scheduled",
          limit: 200,
          page: 1,
        },
      });

      const list = res.data?.data?.jobs || res.data?.data || [];
      setJobs(list);
    } catch (e) {
      setJobs([]);
      setError(e?.response?.data?.message || e?.message || "Failed to load calendar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const { todayJobs, upcomingGroups } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    // normalize scheduled jobs
    const scheduled = (jobs || [])
      .filter((j) => j?.scheduledDate)
      .map((j) => ({ ...j, _sched: new Date(j.scheduledDate) }))
      .filter((j) => !Number.isNaN(j._sched.getTime()))
      .sort((a, b) => a._sched - b._sched);

    const today = [];
    const upcoming = [];

    for (const j of scheduled) {
      const d0 = startOfDay(j._sched);
      if (d0.getTime() === todayStart.getTime()) {
        today.push(j);
      } else if (d0.getTime() >= tomorrowStart.getTime()) {
        upcoming.push(j);
      }
      // Anything before today is ignored (past jobs)
    }

    // group upcoming by day
    const map = new Map();
    for (const j of upcoming) {
      const day = startOfDay(j._sched);
      const key = day.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: day, items: [] });
      map.get(key).items.push(j);
    }

    const groups = Array.from(map.values()).sort((a, b) => a.date - b.date);

    return { todayJobs: today, upcomingGroups: groups };
  }, [jobs]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Calendar</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
              Today + upcoming scheduled jobs (estimates will appear here later).
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--phs-radius-pill)",
              border: "1px solid var(--phs-border)",
              background: "var(--phs-surface)",
              cursor: "pointer",
              fontWeight: 900,
              height: "fit-content",
            }}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</div>
        ) : null}
      </div>

      {/* Body */}
      <div className="card" style={{ padding: 16 }}>
        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {/* TODAY */}
            <div>
              <div style={{
                fontWeight: 950,
                fontSize: 16,
                marginBottom: 10
              }}>
                Today
              </div>
              {todayJobs.length === 0 ? (
                <div style={{ color: "var(--phs-muted)" }}>🎉 No jobs scheduled today.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {todayJobs.map((j) => (
                    <JobRow key={j._id} job={j} onOpen={() => navigate(`/admin/jobs/${j._id}`)} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--phs-border)" }} />

            {/* UPCOMING */}
            <div>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Upcoming</div>

              {upcomingGroups.length === 0 ? (
                <div style={{ color: "var(--phs-muted)" }}>No upcoming jobs scheduled.</div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {upcomingGroups.map((g) => (
                    <div key={g.date.toISOString()}>
                      <div style={{ fontWeight: 900, marginBottom: 10 }}>{dayLabel(g.date)}</div>

                      <div style={{ display: "grid", gap: 10 }}>
                        {g.items.map((j) => (
                          <JobRow key={j._id} job={j} onOpen={() => navigate(`/admin/jobs/${j._id}`)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({ job, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div style={{
          fontWeight: 1000,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "75%",
        }}>
          {job.title || "Untitled job"}
        </div>
        <div style={{ fontWeight: 950 }}>
          {new Date(job.scheduledDate).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </div>

      <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
        Customer: <strong>{customerName(job.customerId)}</strong>
      </div>

      <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
        Status: <strong style={{ textTransform: "capitalize" }}>{job.status || "scheduled"}</strong>
      </div>
    </button>
  );
}

// function customerName(customerId) {
//   if (!customerId) return "—";
//   const full = `${customerId?.firstName || ""} ${customerId?.lastName || ""}`.trim();
//   return full || customerId?.email || "—";
// }