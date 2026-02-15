import React, { useEffect, useState } from "react";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // simple create form
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("created");
  const [notes, setNotes] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  async function fetchCustomers() {
    try {
      const res = await coreClient.get("/api/v1/customers", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const list = res.data?.data?.customers || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (e) {
      // don't hard-fail the jobs page if customers can't load
      console.error("Failed to load customers:", e);
      setCustomers([]);
    }
  }

  async function fetchJobs() {
    setError("");
    setLoading(true);
    try {
      const res = await coreClient.get("/api/v1/jobs", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      // successResponse format: { success, message, data }
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
      const payload = {
        customerId,
        title,
        status,
        notes,
      };

      await coreClient.post("/api/v1/jobs", payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setTitle("");
      setStatus("created");
      setNotes("");
      fetchJobs();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to create job (check API payload/route)."
      );
    }
  }

  useEffect(() => {
    fetchCustomers();
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18 }}>Jobs</div>
        <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
          Create and track service jobs.
        </div>

        <form
          onSubmit={createJob}
          style={{ display: "grid", gap: 10, marginTop: 14 }}
        >
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
                  {`${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || "Customer"}
                </option>
              ))}
            </select>
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

          <button
            type="submit"
            style={{
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: "var(--phs-radius-pill)",
              border: "none",
              background: "var(--phs-primary)",
              color: "white",
              cursor: "pointer",
            }}
          >
            + Create Job
          </button>

          {error ? (
            <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
          ) : null}
        </form>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>Job List</div>
          <button
            type="button"
            onClick={fetchJobs}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--phs-radius-pill)",
              border: "1px solid var(--phs-border)",
              background: "var(--phs-surface)",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        

        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>
            No jobs yet (or jobs endpoint not wired).
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {jobs.map((job) => (
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
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {job.title || job.name || "Untitled job"}
                  </div>
                  
                  <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4 }}>
                    <strong>Customer:</strong>{" "}
                    {job.customerId
                      ? `${job.customerId.firstName || ""} ${job.customerId.lastName || ""}`.trim() ||
                        job.customerId.email ||
                        "—"
                      : "—"}
                  </div>

                  <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 4 }}>
                    {job.notes || "—"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
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
    </div>
  );
}
