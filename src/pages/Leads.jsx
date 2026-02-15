import React, { useEffect, useMemo, useState } from "react";
import { listIntakes } from "../api/intakeClient";
import { createCustomer, createJob, updateIntake } from "../api/crm";

const STATUS_OPTIONS = ["New", "Contacted", "Booked", "Not interested", "Closed"];

export default function Leads() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [convertingId, setConvertingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("new");
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
      const hay = [l.name, l.email, l.phone, l.zip, l.message, l.status]
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
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-[var(--phs-radius-lg)] border border-[var(--phs-border)] bg-[var(--phs-surface)] p-4 shadow-[var(--phs-shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-extrabold">Leads</div>
            <div className="mt-1 text-sm text-[var(--phs-muted)]">
              Intake messages captured for your tenant. Convert them into customers/jobs.
            </div>

            {error ? (
              <div className="mt-3 text-sm text-[var(--color-danger,#dc2626)]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              placeholder="Search leads…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full sm:w-80 rounded-[var(--phs-radius-pill)] border border-[var(--phs-border)] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
            />

            <button
              type="button"
              onClick={load}
              className="h-10 rounded-[var(--phs-radius-pill)] border border-[var(--phs-border)] bg-[var(--phs-surface)] px-4 text-sm font-semibold hover:bg-black/5"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-[var(--phs-radius-lg)] border border-[var(--phs-border)] bg-[var(--phs-surface)] p-4 shadow-[var(--phs-shadow-soft)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <span>Lead List</span>
          <span className="font-medium text-[var(--phs-muted)]">({filtered.length})</span>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--phs-muted)]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-[var(--phs-muted)]">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-bold text-[var(--phs-text)]">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">ZIP</th>
                  <th className="px-3 py-2 w-[360px]">Message</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Converted</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => {
                  const isConverted = !!l.convertedToCustomerId;
                  const isConverting = convertingId === l._id;

                  return (
                    <tr
                      key={l._id}
                      className="bg-[#f9fafb] border border-[var(--phs-border)]"
                    >
                      <td className={td()}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className={td()}>{l.name || "—"}</td>
                      <td className={td()}>{l.email || "—"}</td>
                      <td className={td()}>{l.zip || "—"}</td>

                      <td className={td()}>
                        <div className="max-w-[360px] truncate">
                          {l.message || "—"}
                        </div>
                      </td>

                      <td className={td()}>
                        <select
                          value={l.status || "New"}
                          onChange={(e) => setStatus(l._id, e.target.value)}
                          className="rounded-lg border border-[var(--phs-border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className={td()}>
                        {isConverted ? (
                          <span className="inline-flex items-center rounded-full bg-[var(--phs-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--phs-primary)]">
                            Converted
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className={`${td()} text-right`}>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => markBooked(l)}
                            disabled={isConverting || isConverted}
                            className="rounded-xl bg-[var(--phs-primary)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            {isConverted ? "Converted" : isConverting ? "Converting..." : "Book / Convert"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatus(l._id, "Not interested")}
                            className="rounded-xl border border-[var(--phs-border)] bg-white px-4 py-2 text-sm font-bold hover:bg-black/5"
                          >
                            Not interested
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function td() {
  return "px-3 py-3 text-sm align-top border-y border-[var(--phs-border)]";
}
