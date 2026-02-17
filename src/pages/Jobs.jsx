import React, { useEffect, useMemo, useState } from "react";
import { coreClient } from "../api/coreClient";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const STATUS_OPTIONS = [
  "all",
  "created",
  "scheduled",
  "in-progress",
  "completed",
  "canceled",
  "archived",
  "estimate", // if you’re using it already
];
const TIME_FRAMES = [
  { label: "8:00 AM - 10:00 AM", start: "08:00" },
  { label: "9:00 AM - 11:00 AM", start: "09:00" },
  { label: "10:00 AM - 12:00 PM", start: "10:00" },
  { label: "12:00 PM - 2:00 PM", start: "12:00" },
  { label: "1:00 PM - 3:00 PM", start: "13:00" },
  { label: "3:00 PM - 5:00 PM", start: "15:00" },
];


function formatCustomer(c) {
  const name = `${c?.firstName || ""} ${c?.lastName || ""}`.trim();
  return name || c?.email || "Customer";
}

function toLocalDTInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  // yyyy-MM-ddThh:mm for datetime-local
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Toolbar filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Add Job modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("created");
  const [notes, setNotes] = useState("");

  // Reschedule modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [scheduledDay, setScheduledDay] = useState("");   // yyyy-mm-dd
  const [timeFrame, setTimeFrame] = useState("");

  const [rescheduleNote, setRescheduleNote] = useState("");

  async function fetchCustomers() {
    try {
      const res = await coreClient.get("/api/v1/customers", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const list = res.data?.data?.customers || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load customers:", e);
      setCustomers([]);
    }
  }

  async function fetchJobs() {
    setError("");
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.q = search.trim();

      const res = await coreClient.get("/api/v1/jobs", {
        headers: { Authorization: `Bearer ${getToken()}` },
        params,
      });

      const list = res.data?.data?.jobs || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (e) {
      setJobs([]);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load jobs (endpoint may not exist yet)."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createJob(e) {
    e.preventDefault();
    setError("");

    try {
      const payload = { customerId, title, status, notes };
      await coreClient.post("/api/v1/jobs", payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      // reset + close
      setCustomerId("");
      setTitle("");
      setStatus("created");
      setNotes("");
      setIsAddOpen(false);

      fetchJobs();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to create job (check API payload/route)."
      );
    }
  }

  function openReschedule(job) {
    setActiveJob(job);

    if (job?.scheduledDate) {
      const d = new Date(job.scheduledDate);
      const pad = (n) => String(n).padStart(2, "0");

      setScheduledDay(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      );
    } else {
      setScheduledDay("");
    }

    setTimeFrame("");
    setRescheduleNote("");
    setIsRescheduleOpen(true);
  }


  async function saveReschedule(e) {
    e.preventDefault();
    if (!activeJob) return;

    setError("");

    try {
      let scheduledISO = null;

      if (scheduledDay) {
        const selectedFrame = TIME_FRAMES.find(
          (f) => f.label === timeFrame
        );

        const startTime = selectedFrame?.start || "00:00";

        scheduledISO = new Date(
          `${scheduledDay}T${startTime}`
        ).toISOString();
      }

      const updates = {
        scheduledDate: scheduledISO,
      };

      if (activeJob.status === "created" && scheduledISO) {
        updates.status = "scheduled";
      }

      // Append time frame to notes (temporary until DB field added)
      let updatedNotes = activeJob.notes || "";

      if (timeFrame) {
        const frameLine = `Time frame: ${timeFrame}`;
        updatedNotes = updatedNotes
          ? `${updatedNotes}\n${frameLine}`
          : frameLine;
      }

      if (rescheduleNote?.trim()) {
        const prefix = `[Rescheduled ${new Date().toLocaleString()}] `;
        updatedNotes = updatedNotes
          ? `${updatedNotes}\n${prefix}${rescheduleNote.trim()}`
          : `${prefix}${rescheduleNote.trim()}`;
      }

      if (updatedNotes !== activeJob.notes) {
        updates.notes = updatedNotes;
      }

      await coreClient.put(
        `/api/v1/jobs/${activeJob._id || activeJob.id}`,
        updates,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setIsRescheduleOpen(false);
      setActiveJob(null);
      setScheduledDay("");
      setTimeFrame("");
      setRescheduleNote("");

      fetchJobs();
    } catch (e2) {
      setError(
        e2?.response?.data?.message ||
          e2?.message ||
          "Failed to reschedule job."
      );
    }
  }

  async function quickStatus(job, nextStatus) {
    setError("");
    try {
      await coreClient.put(
        `/api/v1/jobs/${job._id || job.id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchJobs();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          `Failed to update status to '${nextStatus}'.`
      );
    }
  }




  useEffect(() => {
    fetchCustomers();
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "all" ? true : (job.status || "").toLowerCase() === statusFilter;

      if (!matchesStatus) return false;

      if (!q) return true;

      const title = (job.title || job.name || "").toLowerCase();
      const cust =
        job.customerId
          ? `${job.customerId.firstName || ""} ${job.customerId.lastName || ""} ${job.customerId.email || ""}`
              .trim()
              .toLowerCase()
          : "";

      const notes = (job.notes || "").toLowerCase();

      return title.includes(q) || cust.includes(q) || notes.includes(q);
    });
  }, [jobs, search, statusFilter]);

  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return customers.find((c) => (c._id || c.id) === customerId) || null;
  }, [customerId, customers]);


  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Toolbar (Leads-style) */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Jobs</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
              Booked leads become jobs and estimates.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                background: "white",
                minWidth: 160,
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                minWidth: 260,
              }}
            />

            {/* Add */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--phs-radius-pill)",
                border: "none",
                background: "var(--phs-primary)",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              + Add Job
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchJobs}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--phs-radius-pill)",
                border: "1px solid var(--phs-border)",
                background: "var(--phs-surface)",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
      </div>

      {/* Job List */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>Job List</div>
          <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>
            Showing {filteredJobs.length} / {jobs.length}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>
            No jobs match your filters.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredJobs.map((job) => (
              <div
                key={job._id || job.id}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <Link
                    to="/admin/jobs"
                    style={{
                      color: "var(--phs-muted)",
                      textDecoration: "none",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    Jobs
                  </Link>
                  <span style={{ color: "var(--phs-muted)" }}>›</span>
                  <span style={{ color: "var(--phs-text)", fontWeight: 720, fontSize: 14 }}>
                    {job?.title || "Job"}
                  </span>
                </div>


                  <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4 }}>
                    <strong>Customer:</strong>{" "}
                    {job.customerId ? formatCustomer(job.customerId) : "—"}
                  </div>

                  <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4 }}>
                    <strong>Scheduled:</strong>{" "}
                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleString() : "—"}
                  </div>

                  <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {job.notes || "—"}
                  </div>

                  {job.status === "scheduled" ? (
                  <button
                    type="button"
                    onClick={() => quickStatus(job, "in-progress")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--phs-border)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 900,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--phs-primary)";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.borderColor = "var(--phs-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.color = "var(--phs-text)";
                      e.currentTarget.style.borderColor = "var(--phs-border)";
                    }}
                  >
                    Start
                  </button>
                ) : null}

                {job.status === "in-progress" ? (
                  <button
                    type="button"
                    onClick={() => quickStatus(job, "completed")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--phs-border)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 900,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#16a34a";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.borderColor = "#16a34a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.color = "var(--phs-text)";
                      e.currentTarget.style.borderColor = "var(--phs-border)";
                    }}
                  >
                    Complete
                  </button>
                ) : null}


                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => openReschedule(job)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.background = "var(--phs-primary-soft)";
                        e.currentTarget.style.borderColor = "rgba(11,125,125,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "var(--phs-border)";
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid var(--phs-border)",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 700,
                        transition: "all 0.15s ease",
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/jobs/${job._id || job.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.background = "var(--phs-primary)";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.borderColor = "var(--phs-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.color = "var(--phs-text)";
                        e.currentTarget.style.borderColor = "var(--phs-border)";
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid var(--phs-border)",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 700,
                        transition: "all 0.15s ease",
                      }}
                    >
                      View / Edit
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "var(--phs-primary-soft)",
                      color: "var(--phs-primary)",
                      border: "1px solid rgba(11,125,125,0.25)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {job.status || "unknown"}
                  </div>
                  <div style={{ color: "var(--phs-muted)", fontSize: 12, marginTop: 6 }}>
                    {job.createdAt ? new Date(job.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {isAddOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAddOpen(false)}
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
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "min(820px, 100%)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Add Job</div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                style={{
                  border: "1px solid var(--phs-border)",
                  background: "white",
                  borderRadius: 999,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createJob} style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--phs-border)",
                    background: "white",
                  }}
                >
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {formatCustomer(c)}
                    </option>
                  ))}
                </select>
                {selectedCustomer ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid var(--phs-border)",
                      background: "var(--phs-surface)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      {formatCustomer(selectedCustomer)}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--phs-muted)" }}>
                      <span><strong>Email:</strong> {selectedCustomer.email || "—"}</span>
                      <span><strong>Phone:</strong> {selectedCustomer.phone || "—"}</span>
                    </div>

                    {/* Address if it exists on your customer model */}
                    {selectedCustomer.address ? (
                      <div style={{ fontSize: 13, color: "var(--phs-muted)" }}>
                        <strong>Address:</strong>{" "}
                        {[
                          selectedCustomer.address.line1,
                          selectedCustomer.address.line2,
                          selectedCustomer.address.city,
                          selectedCustomer.address.state,
                          selectedCustomer.address.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                    ) : null}
                  </div>
                ) : null}

              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Example: HVAC maintenance – Smith residence"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--phs-border)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--phs-border)",
                    background: "white",
                  }}
                >
                  <option value="created">created</option>
                  <option value="scheduled">scheduled</option>
                  <option value="estimate">estimate</option>
                  <option value="in-progress">in-progress</option>
                  <option value="completed">completed</option>
                  <option value="canceled">canceled</option>
                  <option value="archived">archived</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                  rows={3}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--phs-border)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--phs-border)",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 800,
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
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Reschedule Modal */}
      {isRescheduleOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsRescheduleOpen(false)}
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
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(720px, 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                Reschedule: {activeJob?.title || "Job"}
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                style={{
                  border: "1px solid var(--phs-border)",
                  background: "white",
                  borderRadius: 999,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 6 }}>
              Customer: <strong>{activeJob?.customerId ? formatCustomer(activeJob.customerId) : "—"}</strong>
            </div>

            <form onSubmit={saveReschedule} style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {/* <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>New scheduled date/time</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--phs-border)",
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--phs-muted)" }}>
                  Leave blank to clear the schedule.
                </div>
              </div> */}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 700 }}>Date</div>
                  <input
                    type="date"
                    value={scheduledDay}
                    onChange={(e) => setScheduledDay(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--phs-border)",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--phs-muted)", fontWeight: 700 }}>
                    Time frame
                  </div>
                  <select
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--phs-border)",
                      background: "white",
                    }}
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


              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>Reschedule note (optional)</label>
                <textarea
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  rows={3}
                  placeholder="Example: Customer requested new time window…"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--phs-border)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--phs-border)",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 800,
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
                  Save reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
