import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer, createJob } from "../api/crm";
import { listIntakes, createIntake, updateIntake } from "../api/intakeClient";


const STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Converted",
  "Not interested",
  "Closed"
];
const INTAKE_SOURCE_OPTIONS = [
  { value: "web", label: "Web" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "dashboard", label: "Dashboard" },
  { value: "referral", label: "Referral" },
  { value: "walk-in", label: "Walk-in" },
  { value: "other", label: "Other" },
];
const TIME_BLOCKS = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM",
];


export default function Leads() {
  const navigate = useNavigate();
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
    contactMethod: "phone",
    address: { 
      line1: "", 
      line2: "", 
      city: "", 
      state: "GA", 
      postalCode: "" 
    },
    message: "",
    status: "New",
    source: "dashboard",
  });
  const [adding, setAdding] = useState(false);

  //booking flow states
  const [showBook, setShowBook] = useState(false);
  const [bookingLead, setBookingLead] = useState(null);
  const [booking, setBooking] = useState(false);

  const [bookForm, setBookForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: { line1: "", line2: "", city: "", state: "GA", postalCode: "" },
    date: "",
    timeBlock: TIME_BLOCKS[0],
    message: "",
  });
  //Time Block options
  



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
        l.zip || l.address?.postalCode,
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

  function copy(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  async function submitAddLead(e) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const postalCode = addForm.address.postalCode.trim();

      await createIntake({
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone.trim(),
        address: {
          line1: addForm.address.line1.trim(),
          line2: addForm.address.line2.trim(),
          city: addForm.address.city.trim(),
          state: addForm.address.state.trim(),
          postalCode,
        },
        // keep zip mirrored for legacy searching/compat
        zip: postalCode,
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
        address: { line1: "", line2: "", city: "", state: "GA", postalCode: "" },
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

  function formatAddress(a, zipFallback = "") {
    const line1 = a?.line1?.trim();
    const line2 = a?.line2?.trim();
    const city = a?.city?.trim();
    const state = a?.state?.trim();
    const postal = (a?.postalCode?.trim() || zipFallback?.trim());

    const cityState = [city, state].filter(Boolean).join(", ");
    const parts = [line1, line2, cityState, postal].filter(Boolean);

    return parts.length ? parts.join(" ") : "—";
  }


  function openBookModal(lead) {
    setBookingLead(lead);

    const a = lead?.address || {};
    const postal = a.postalCode || lead?.zip || "";

    setBookForm({
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      contactMethod: lead?.contactMethod || "phone",
      address: {
        line1: a.line1 || "",
        line2: a.line2 || "",
        city: a.city || "",
        state: a.state || "GA",
        postalCode: postal,
      },
      date: "",
      timeBlock: TIME_BLOCKS[0],
      message: lead?.message || "",
    });

    setShowBook(true);
  }


  function splitName(full = "") {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "Unknown", lastName: "Customer" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "Customer" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!bookingLead) return;

    setError("");
    setBooking(true);

    try {
      // 1) Customer
      const { firstName, lastName } = splitName(bookForm.name);
      const customerRes = await createCustomer({
        firstName,
        lastName,
        email: (bookForm.email || "").trim().toLowerCase(),
        phone: (bookForm.phone || "").trim(),
        address: {
          line1: bookForm.address.line1?.trim() || "",
          line2: bookForm.address.line2?.trim() || "",
          city: bookForm.address.city?.trim() || "",
          state: bookForm.address.state?.trim() || "",
          postalCode: bookForm.address.postalCode?.trim() || "",
        },
      });

      const customer = customerRes?.data;
      const customerId = customer?._id || customer?.id;
      if (!customerId) throw new Error("Customer created but no id returned.");

      // 2) Job (Estimate)
      const title =
        (bookForm.message || "").slice(0, 60) ||
        `Service Estimate (${bookForm.address.postalCode || bookingLead.zip || "no zip"})`;

      const scheduledDate = bookForm.date ? new Date(`${bookForm.date}T00:00:00`) : undefined;

      const addressSummary = [
        bookForm.address.line1,
        bookForm.address.line2,
        [bookForm.address.city, bookForm.address.state].filter(Boolean).join(", "),
        bookForm.address.postalCode,
      ].filter(Boolean).join(" ");

      const notes = bookForm.message?.trim() || "";

      await createJob({
        customerId,
        title,
        status: "estimate",
        notes,
        scheduledDate, // REAL Date object
      });


      // 3) Update Intake
      await updateIntake(bookingLead._id, {
        status: "Converted", // or "Booked" if you want to keep legacy label
        address: bookForm.address,
        zip: bookForm.address?.postalCode || bookingLead.zip || "",
        message: bookForm.message || bookingLead.message || "",
        contactMethod: bookForm.contactMethod,
      });

      // close modals + refresh
      setShowBook(false);
      setBookingLead(null);
      await load();

      // optional: send him straight to Jobs tab
      navigate("/admin/jobs");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Booking failed.");
    } finally {
      setBooking(false);
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
                  <th className="px-3 py-2 w-[360px]">Message</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-24">Contact</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => {
                  const isConverted = l.status === "Converted";

                  return (
                    <tr key={l._id} className="bg-[#f9fafb] border border-[var(--phs-border)]">
                      <td className={td()}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className={td()}>{l.name || "—"}</td>
                      <td className={td()}>{l.email || "—"}</td>
                      <td className={td()}>{l.phone || "—"}</td>

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
                      <td className={td()}>
                        {(l.contactMethod || "phone").replace(/^./, (c) => c.toUpperCase())}
                      </td>
                      <td className={`${td()} text-right`}>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(l)}
                            className="rounded-xl border border-[var(--phs-border)] bg-white px-4 py-2 text-sm font-bold hover:bg-black/5"
                          >
                            {isConverted ? "View" : "Contact"}
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

     {/* Contact Modal */}
      {selectedLead ? (
        <Modal title="Lead details" onClose={() => setSelectedLead(null)}>
          {(() => {
            const isConverted = selectedLead.status === "Converted";

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Name" value={selectedLead.name || "—"} />
                  <Field label="Status" value={selectedLead.status || "New"} />
                  <Field
                    className="sm:col-span-2"
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
                  <Field
                    className="sm:col-span-2"
                    label="Address"
                    value={formatAddress(selectedLead.address, selectedLead.zip)}
                  />
                  <Field
                    className="sm:col-span-1"
                    label="Preferred contact"
                    value={(selectedLead.contactMethod || "phone").toUpperCase()}
                  />

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
                      openBookModal(selectedLead);
                      setSelectedLead(null); // close contact modal
                    }}
                    disabled={isConverted}
                    className="rounded-xl bg-[var(--phs-primary)] px-4 py-2 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isConverted ? "Already Converted" : "Book / Convert"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatus(selectedLead._id, "Contacted");
                      setSelectedLead(null);
                    }}
                    disabled={isConverted} // optional — remove if you still want edits after conversion
                    className="rounded-xl bg-[var(--phs-primary)] px-4 py-2 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
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
            );
          })()}
        </Modal>
      ) : null}


      {/* Booking Modal */}
      {showBook && bookingLead ? (
        <Modal title="Schedule estimate" onClose={() => setShowBook(false)}>
          <form onSubmit={submitBooking} className="space-y-6">
          {/* Contact Information */}
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--phs-primary-dark)]">
              Contact Information
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Name"
                value={bookForm.name}
                onChange={(v) => setBookForm((p) => ({ ...p, name: v }))}
                required
              />
              <Input
                label="Email"
                value={bookForm.email}
                onChange={(v) => setBookForm((p) => ({ ...p, email: v }))}
                type="email"
              />
              <Input
                label="Phone"
                value={bookForm.phone}
                onChange={(v) => setBookForm((p) => ({ ...p, phone: v }))}
                required
              />
              <label className="block">
                <div className="text-xs font-bold text-[var(--phs-muted)]">Contact method</div>
                <select
                  value={bookForm.contactMethod}
                  onChange={(e) => setBookForm((p) => ({ ...p, contactMethod: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                  required
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="both">Both</option>
                </select>
              </label>

            </div>
          </div>

          {/* Schedule time & date */}
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--phs-primary-dark)]">
              Schedule time &amp; date
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-bold text-[var(--phs-muted)]">Date</div>
                <input
                  type="date"
                  value={bookForm.date}
                  onChange={(e) => setBookForm((p) => ({ ...p, date: e.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                />
              </label>

              <label className="block">
                <div className="text-xs font-bold text-[var(--phs-muted)]">Time frame</div>
                <select
                  value={bookForm.timeBlock}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, timeBlock: e.target.value }))
                  }
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                >
                  {TIME_BLOCKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--phs-primary-dark)]">
              Address
            </div>

            {/* Row 1: line1 | line2 */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                className="sm:col-span-2"
                label="Address line 1"
                value={bookForm.address.line1}
                onChange={(v) =>
                  setBookForm((p) => ({ ...p, address: { ...p.address, line1: v } }))
                }
                required
              />
              <Input
                className="sm:col-span-2"
                label="Address line 2"
                value={bookForm.address.line2}
                onChange={(v) =>
                  setBookForm((p) => ({ ...p, address: { ...p.address, line2: v } }))
                }
                required={false}
              />
            </div>

            {/* Row 2: city | state | postal */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="City"
                value={bookForm.address.city}
                onChange={(v) =>
                  setBookForm((p) => ({ ...p, address: { ...p.address, city: v } }))
                }
                required
              />
              <Input
                label="State"
                value={bookForm.address.state}
                onChange={(v) =>
                  setBookForm((p) => ({ ...p, address: { ...p.address, state: v } }))
                }
                required
              />
              <Input
                label="Postal Code"
                value={bookForm.address.postalCode}
                onChange={(v) =>
                  setBookForm((p) => ({ ...p, address: { ...p.address, postalCode: v } }))
                }
                required
              />
            </div>
          </div>


          {/* Message */}
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--phs-primary-dark)]">
              Message
            </div>

            <textarea
              value={bookForm.message}
              onChange={(e) => setBookForm((p) => ({ ...p, message: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-[var(--phs-border)] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
              placeholder="Notes for the job (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBook(false)}
              className="rounded-xl border border-[var(--phs-border)] bg-white px-4 py-2 text-sm font-bold hover:bg-black/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={booking}
              className="rounded-xl bg-[var(--phs-primary)] px-4 py-2 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60"
            >
              {booking ? "Booking..." : "Create estimate job"}
            </button>
          </div>
        </form>

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
              <label className="block">
                <div className="text-xs font-bold text-[var(--phs-muted)]">Status</div>
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

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
                label="Address line 1"
                value={addForm.address.line1}
                onChange={(v) => setAddForm((p) => ({ ...p, address: { ...p.address, line1: v } }))}
              />
              <Input
                label="Address line 2"
                value={addForm.address.line2}
                onChange={(v) => setAddForm((p) => ({ ...p, address: { ...p.address, line2: v } }))}
              />
              <Input
                label="City"
                value={addForm.address.city}
                onChange={(v) => setAddForm((p) => ({ ...p, address: { ...p.address, city: v } }))}
              />
              <Input
                label="State"
                value={addForm.address.state}
                onChange={(v) => setAddForm((p) => ({ ...p, address: { ...p.address, state: v } }))}
              />
              <Input
                label="Postal Code"
                value={addForm.address.postalCode}
                onChange={(v) => setAddForm((p) => ({ ...p, address: { ...p.address, postalCode: v } }))}
              />
              <Input
                label="ZIP"
                value={addForm.zip}
                onChange={(v) => setAddForm((p) => ({ ...p, zip: v }))}
              />
              <label className="block">
                <div className="text-xs font-bold text-[var(--phs-muted)]">Source</div>
                <select
                  value={addForm.source}
                  onChange={(e) => setAddForm((p) => ({ ...p, source: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--phs-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
                >
                  {INTAKE_SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
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

function Field({ label, value, actionText, onAction, className = "" }) {
  return (
    <div className={`rounded-xl border border-[var(--phs-border)] bg-white p-3 ${className}`}>
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

// The Input component is used in the Add Lead form for consistent styling
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
