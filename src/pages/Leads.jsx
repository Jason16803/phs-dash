import React, { useEffect, useMemo, useState } from "react";
import { listIntakes, createIntake } from "../api/intakeClient";
import { updateIntake } from "../api/crm";

const STATUS_OPTIONS = ["New", "Contacted", "Converted", "Not interested", "Closed"];

export default function Leads() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState(""); // "" = all
  const [query, setQuery] = useState("");

  // Modals
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // Add Lead form
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    zip: "",
    message: "",
    status: "New",
    source: "dashboard",
  });
  const [adding, setAdding] = useState(false);

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

  function copy(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  async function submitAddLead(e) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      await createIntake({
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone.trim(),
        zip: addForm.zip.trim(),
        message: addForm.message.trim(),
        status: addForm.status,
        source: addForm.source,
      });

      setShowAdd(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        zip: "",
        message: "",
        status: "New",
        source: "dashboard",
      });

      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Failed to add lead.");
    } finally {
      setAdding(false);
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
              Intake messages captured for your tenant. Review, contact, and convert.
            </div>

            {error ? (
              <div className="mt-3 text-sm text-[var(--color-danger,#dc2626)]">{error}</div>
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
              onClick={() => setShowAdd(true)}
              className="h-10 rounded-[var(--phs-radius-pill)] bg-[var(--phs-primary)] px-4 text-sm font-extrabold text-white hover:opacity-90"
            >
              + Add lead
            </button>

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
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">ZIP</th>
                  <th className="px-3 py-2 w-[360px]">Message</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => (
                  <tr key={l._id} className="bg-[#f9fafb] border border-[var(--phs-border)]">
                    <td className={td()}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}</td>
                    <td className={td()}>{l.name || "—"}</td>
                    <td className={td()}>{l.email || "—"}</td>
                    <td className={td()}>{l.phone || "—"}</td>
                    <td className={td()}>{l.zip || "—"}</td>
                    <td className={td()}>
                      <div className="max-w-[360px] truncate">{l.message || "—"}</div>
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

                    <td className={`${td()} text-right`}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(l)}
                          className="rounded-xl border border-[var(--phs-border)] bg-white px-4 py-2 text-sm font-bold hover:bg-black/5"
                        >
                          Contact
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {selectedLead ? (
        <Modal title="Lead details" onClose={() => setSelectedLead(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Name" value={selectedLead.name || "—"} />
              <Field label="Status" value={selectedLead.status || "New"} />
              <Field
                label="Email"
                value={selectedLead.email || "—"}
                actionText="Copy"
                onAction={() => copy(selectedLead.email)}
              />
              <Field
                label="Phone"
                value={selectedLead.phone || "—"}
                actionText="Copy"
                onAction={() => copy(selectedLead.phone)}
              />
              <Field label="ZIP" value={selectedLead.zip || "—"} />
              <Field label="Source" value={selectedLead.source || "—"} />
            </div>

            <div>
              <div className="text-xs font-bold text-[var(--phs-muted)]">Message</div>
              <div className="mt-1 whitespace-pre-wrap rounded-xl border border-[var(--phs-border)] bg-white p-3 text-sm text-[var(--phs-text)]">
                {selectedLead.message || "—"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setStatus(selectedLead._id, "Contacted");
                  setSelectedLead(null);
                }}
                className="rounded-xl bg-[var(--phs-primary)] px-4 py-2 text-sm font-extrabold text-white hover:opacity-90"
              >
                Mark Contacted
              </button>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-xl border border-[var(--phs-border)] bg-white px-4 py-2 text-sm font-bold hover:bg-black/5"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Add Lead Modal */}
      {showAdd ? (
        <Modal title="Add lead" onClose={() => setShowAdd(false)}>
          <form onSubmit={submitAddLead} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Name *"
                value={addForm.name}
                onChange={(v) => setAddForm((p) => ({ ...p, name: v }))}
                required
              />
              <select
                value={addForm.status}
                onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value }))}
                className="h-10 rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <Input
                label="Email"
                value={addForm.email}
                onChange={(v) => setAddForm((p) => ({ ...p, email: v }))}
                type="email"
              />
              <Input
                label="Phone"
                value={addForm.phone}
                onChange={(v) => setAddForm((p) => ({ ...p, phone: v }))}
              />

              <Input
                label="ZIP"
                value={addForm.zip}
                onChange={(v) => setAddForm((p) => ({ ...p, zip: v }))}
              />
              <Input
                label="Source"
                value={addForm.source}
                onChange={(v) => setAddForm((p) => ({ ...p, source: v }))}
              />
            </div>

            <div>
              <div className="text-xs font-bold text-[var(--phs-muted)]">Message *</div>
              <textarea
                value={addForm.message}
                onChange={(e) => setAddForm((p) => ({ ...p, message: e.target.value }))}
                required
                rows={5}
                className="mt-1 w-full rounded-xl border border-[var(--phs-border)] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                placeholder="What did the customer request?"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-[var(--phs-border)] bg-white px-4 py-2 text-sm font-bold hover:bg-black/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={adding}
                className="rounded-xl bg-[var(--phs-primary)] px-4 py-2 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add lead"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function td() {
  return "px-3 py-3 text-sm align-top border-y border-[var(--phs-border)]";
}

/** Reusable modal */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-2xl rounded-[var(--phs-radius-xl)] border border-[var(--phs-border)] bg-[var(--phs-surface)] p-5 shadow-[var(--phs-shadow-soft)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-extrabold text-[var(--phs-text)]">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--phs-border)] bg-white px-3 py-1.5 text-sm font-bold hover:bg-black/5"
            type="button"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, actionText, onAction }) {
  return (
    <div className="rounded-xl border border-[var(--phs-border)] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-[var(--phs-muted)]">{label}</div>
        {actionText && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-extrabold text-[var(--phs-primary)] hover:underline"
          >
            {actionText}
          </button>
        ) : null}
      </div>
      <div className="mt-1 text-sm text-[var(--phs-text)]">{value}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-[var(--phs-muted)]">{label}</div>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
      />
    </label>
  );
}
