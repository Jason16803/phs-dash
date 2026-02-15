import React, { useEffect, useMemo, useState } from "react";
import { listIntakes } from "../api/intakeClient";
import { createCustomer, createJob, updateIntake } from "../api/crm";


const STATUS_OPTIONS = ["New", "Contacted", "Booked", "Not interested", "Closed"];

export default function Leads() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [convertingId, setConvertingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listIntakes({ status: statusFilter });
      setIntakes(res?.data?.intakes || []);
    } catch (e) {
      setIntakes([]);
      setError(e?.response?.data?.message || e?.message || "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return intakes;

    return intakes.filter((l) => {
      const hay = [
        l.name,
        l.email,
        l.phone,
        l.zip,
        l.message,
        l.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [intakes, query]);

  async function setStatus(intakeId, nextStatus) {
    try {
      await updateIntake(intakeId, { status: nextStatus });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update status.");
    }
  }

  function splitName(full = "") {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "Unknown", lastName: "Customer" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "Customer" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  async function convertLead(lead) {
    const { firstName, lastName } = splitName(lead.name);

    const customerRes = await createCustomer({
      firstName,
      lastName,
      email: lead.email || "",
      phone: lead.phone || "",
      address: lead.zip ? { zip: lead.zip } : undefined,
    });

    const customer = customerRes?.data;
    const customerId = customer?._id || customer?.id;
    if (!customerId) throw new Error("Customer created but no id returned.");

    const title =
      (lead.message || "").slice(0, 60) || `Service Request (${lead.zip || "no zip"})`;

    await createJob({
      customerId,
      title,
      status: "created",
      notes: lead.message || "",
    });

    await updateIntake(lead._id, {
      status: "Booked",
      convertedToCustomerId: customerId,
    });
  }

  async function markBooked(lead) {
    setError("");
    setConvertingId(lead._id);

    try {
      await convertLead(lead);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Conversion failed.");
    } finally {
      setConvertingId(null);
    }
  }



  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Leads</div>
            <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
              Intake messages captured for your tenant. Convert them into customers/jobs.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--phs-border)",
                background: "white",
                height: 42,
              }}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input
              placeholder="Search leads…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                width: 320,
                height: 42,
              }}
            />

            <button
              type="button"
              onClick={load}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid var(--phs-border)",
                background: "var(--phs-surface)",
                cursor: "pointer",
                height: 42,
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? <div style={{ color: "#b91c1c", marginTop: 10, fontSize: 13 }}>{error}</div> : null}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          Lead List{" "}
          <span style={{ color: "var(--phs-muted)", fontWeight: 500 }}>
            ({filtered.length})
          </span>
        </div>

        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>No leads found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px", minWidth: 980 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#111827", fontSize: 13 }}>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>ZIP</th>
                  <th style={{ width: 360 }}>Message</th>
                  <th>Status</th>
                  <th>Converted</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => (
                  <tr key={l._id} style={{ background: "#f9fafb", border: "1px solid var(--phs-border)" }}>
                    <td style={cell()}>
                      {l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}
                    </td>
                    <td style={cell()}>{l.name || "—"}</td>
                    <td style={cell()}>{l.email || "—"}</td>
                    <td style={cell()}>{l.zip || "—"}</td>
                    <td style={cell()}>
                      <div style={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {l.message || "—"}
                      </div>
                    </td>

                    <td style={cell()}>
                      <select
                        value={l.status || "New"}
                        onChange={(e) => setStatus(l._id, e.target.value)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--phs-border)",
                          background: "white",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    <td style={cell()}>
                      {l.convertedToCustomerId
                        ? `${l.convertedToCustomerId.firstName || ""} ${l.convertedToCustomerId.lastName || ""}`.trim() ||
                          l.convertedToCustomerId.email ||
                          "Converted"
                        : "—"}
                    </td>

                    <td style={{ ...cell(), textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => markBooked(l)}
                          style={btnPrimary()}
                          disabled={convertingId === l._id || !!l.convertedToCustomerId}
                        >
                          {l.convertedToCustomerId
                            ? "Converted"
                            : convertingId === l._id
                              ? "Converting..."
                              : "Book / Convert"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(l._id, "Not interested")}
                          style={btnGhost()}
                        >
                          Not interested
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function cell() {
  return {
    padding: "12px 12px",
    borderTop: "1px solid var(--phs-border)",
    borderBottom: "1px solid var(--phs-border)",
    fontSize: 13,
    verticalAlign: "top",
  };
}

function btnPrimary() {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "none",
    background: "var(--phs-primary)",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  };
}

function btnGhost() {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid var(--phs-border)",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  };
}
