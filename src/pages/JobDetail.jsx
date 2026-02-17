import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const STATUS_OPTIONS = [
  "created",
  "estimate",
  "scheduled",
  "in-progress",
  "completed",
  "canceled",
  "archived",
];
const TIME_FRAMES = [
  { label: "8:00 AM - 10:00 AM", start: "08:00" },
  { label: "9:00 AM - 11:00 AM", start: "09:00" },
  { label: "10:00 AM - 12:00 PM", start: "10:00" },
  { label: "12:00 PM - 2:00 PM", start: "12:00" },
  { label: "1:00 PM - 3:00 PM", start: "13:00" },
  { label: "3:00 PM - 5:00 PM", start: "15:00" },
];

function nextActionsFor(status) {
  switch (status) {
    case "created":
      return ["estimate", "scheduled", "canceled"];
    case "estimate":
      return ["scheduled", "canceled"];
    case "scheduled":
      return ["in-progress", "canceled"];
    case "in-progress":
      return ["completed", "canceled"];
    case "completed":
      return ["archived"];
    case "canceled":
      return ["archived"];
    default:
      return [];
  }
}


function formatCustomer(c) {
  const name = `${c?.firstName || ""} ${c?.lastName || ""}`.trim();
  return name || c?.email || "Customer";
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // editable fields
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("created");
  const [notes, setNotes] = useState("");
  const [scheduledDay, setScheduledDay] = useState(""); // YYYY-MM-DD
  const [timeFrame, setTimeFrame] = useState("");       // label


  async function fetchJob() {
    setLoading(true);
    setError("");
    try {
      const res = await coreClient.get(`/api/v1/jobs/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = res.data?.data || res.data?.data?.job || res.data?.data; // flexible
      setJob(data);

      setTitle(data?.title || "");
      setStatus(data?.status || "created");
      setNotes(data?.notes || "");
      if (data?.scheduledDate) {
        const d = new Date(data.scheduledDate);
        const pad = (n) => String(n).padStart(2, "0");
        setScheduledDay(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      } else {
        setScheduledDay("");
      }

      // optional: if you previously stored "Time frame: X" in notes, you could parse it.
      // for now keep it blank:
      setTimeFrame("");

    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load job."
      );
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      let scheduledISO = null;

      if (scheduledDay) {
        const selectedFrame = TIME_FRAMES.find((f) => f.label === timeFrame);
        const startTime = selectedFrame?.start || "00:00";
        scheduledISO = new Date(`${scheduledDay}T${startTime}`).toISOString();
      }

      // optionally stamp the time frame into notes (temporary until you add a field)
      let notesOut = notes || "";
      if (timeFrame) {
        const tfLine = `Time frame: ${timeFrame}`;
        if (!notesOut.includes(tfLine)) {
          notesOut = notesOut ? `${notesOut}\n${tfLine}` : tfLine;
        }
      }

      const payload = {
        title,
        status,
        notes: notesOut,
        scheduledDate: scheduledISO,
      };


      await coreClient.put(`/api/v1/jobs/${id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      // refresh so UI shows latest populated customer, timestamps, etc.
      await fetchJob();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to save job."
      );
    } finally {
      setSaving(false);
    }
  }
  async function quickUpdate(patch) {
    setSaving(true);
    setError("");
    try {
      await coreClient.put(`/api/v1/jobs/${id}`, patch, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await fetchJob();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }


  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="card">Loading…</div>;

  if (error)
    return (
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Job</div>
        <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
        <button
          type="button"
          onClick={() => navigate("/admin/jobs")}
          style={{
            width: "fit-content",
            padding: "10px 14px",
            borderRadius: "var(--phs-radius-pill)",
            border: "1px solid var(--phs-border)",
            background: "white",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          ← Back to Jobs
        </button>
      </div>
    );

  return (

  <div style={{ display: "grid", gap: 14 }}>
  {/* Header card with breadcrumb + actions */}
  <div className="card" style={{ display: "grid", gap: 10 }}>
    {/* breadcrumb */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <a
        href="/admin/jobs"
        onClick={(e) => { e.preventDefault(); navigate("/admin/jobs"); }}
        style={{ color: "var(--phs-muted)", textDecoration: "none", fontWeight: 800 }}
      >
        Jobs
      </a>
      <span style={{ color: "var(--phs-muted)" }}>›</span>
      <span style={{ color: "var(--phs-text)", fontWeight: 900 }}>
        {job?.title || "Job"}
      </span>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          {job?.status === "estimate" ? "Estimate Details" : "Job Details"}
        </div>
        <div style={{ color: "var(--phs-muted)", marginTop: 4, fontSize: 13 }}>
          Customer: <strong>{job?.customerId ? formatCustomer(job.customerId) : "—"}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        {nextActionsFor(status).includes("estimate") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => quickUpdate({ status: "estimate" })}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid var(--phs-border)",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Convert to Estimate
          </button>
        ) : null}

        {nextActionsFor(status).includes("scheduled") ? (
          <button
            type="button"
            disabled={saving || !scheduledDay} // require a date to schedule
            onClick={() => quickUpdate({ status: "scheduled" })}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "none",
              background: "var(--phs-primary)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              opacity: saving || !scheduledDay ? 0.6 : 1,
            }}
            title={!scheduledDay ? "Pick a schedule date first" : ""}
          >
            Mark Scheduled
          </button>
        ) : null}

        {nextActionsFor(status).includes("in-progress") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => quickUpdate({ status: "in-progress" })}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid var(--phs-border)",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Start Job
          </button>
        ) : null}

        {nextActionsFor(status).includes("completed") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => quickUpdate({ status: "completed" })}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "none",
              background: "#16a34a",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              opacity: saving ? 0.7 : 1,
            }}
          >
            Complete
          </button>
        ) : null}

        {nextActionsFor(status).includes("archived") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => quickUpdate({ status: "archived" })}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid var(--phs-border)",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Archive
          </button>
        ) : null}

        {nextActionsFor(status).includes("canceled") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => quickUpdate({ status: "canceled" })}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(185,28,28,0.35)",
              background: "rgba(185,28,28,0.08)",
              color: "#991b1b",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>


      <div style={{ display: "flex", gap: 10 }}>

        <button type="button" onClick={() => navigate("/admin/jobs")} className="rounded-(--phs-radius-pill) border border-(--phs-border) bg-white px-4 py-2 text-sm font-extrabold">
          ← Back
        </button>
        <button type="button" onClick={save} disabled={saving} className="rounded-(--phs-radius-pill) bg-(--phs-primary) px-4 py-2 text-sm font-extrabold text-white disabled:opacity-70">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  </div>

  {/* Two-card layout */}
  <div
    style={{
      display: "grid",
      gap: 14,
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    }}
  >
    {/* Customer Info Card */}
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 900 }}>Customer information</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>Name</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId ? formatCustomer(job.customerId) : "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>Email</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.email || "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>Phone</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.phone || "—"}
          </div>
        </div>
        
      </div>

      {/* Address block (your GET /jobs/:id populates customer address already) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", gap: 10 }}>
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>Address line 1</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.address?.line1 || "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>Address line 2</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.address?.line2 || "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>State</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.address?.state  || "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>City</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.address?.city || "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 800 }}>Postal</div>
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "var(--phs-surface)" }}>
            {job?.customerId?.address?.postalCode || "—"}
          </div>
        </div>
      </div>

    </div>

    {/* Job Details Card */}
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 900 }}>Job details</div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 13, color: "#374151" }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 13, color: "#374151" }}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "white" }}
        >
          {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ fontSize: 12, color: "var(--phs-muted)" }}>
          Transitions are enforced (created → scheduled/estimate/canceled, etc.)
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
  <label style={{ fontSize: 13, color: "#374151" }}>Schedule</label>

  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 700 }}>Date</div>
      <input
        type="date"
        value={scheduledDay}
        onChange={(e) => setScheduledDay(e.target.value)}
        style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)" }}
      />
    </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 700 }}>Time frame</div>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", background: "white" }}
          >
            <option value="">Select time frame…</option>
            {TIME_FRAMES.map((f) => (
              <option key={f.label} value={f.label}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--phs-muted)" }}>
        Tip: Leave the date blank to clear the schedule.
      </div>
    </div>


      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 13, color: "#374151" }}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--phs-border)", resize: "vertical" }}
        />
      </div>
    </div>
  </div>

  {/* Line items placeholder stays below */}
  <div className="card">
    <div style={{ fontWeight: 900 }}>Line items</div>
    <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4 }}>
      Next: services/materials + price book picker (Housecall Pro style).
    </div>
  </div>
</div>

  );
}
