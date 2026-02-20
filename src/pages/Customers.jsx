import React, { useEffect, useState } from "react";
import { coreClient } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // ui helpers
  const [query, setQuery] = useState("");

  async function fetchCustomers() {
    setError("");
    setLoading(true);

    try {
      const res = await coreClient.get("/api/v1/customers", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const list = res.data?.data?.customers || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (e) {
      setCustomers([]);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load customers (endpoint may not exist yet)."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createCustomer(e) {
    e.preventDefault();
    setError("");

    try {
      // Adjust payload to match your Customer model if needed
      const payload = {
        firstName,
        lastName,
        phone,
        email,
        address: {
          line1: addressLine1,
          city,
          state,
          postalCode,
        },
      };

      await coreClient.post("/api/v1/customers", payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      // reset
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setAddressLine1("");
      setCity("");
      setState("");
      setZip("");

      fetchCustomers();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to create customer (check API payload/route)."
      );
    }
  }

  function openActions(customer) {
    setSelectedCustomer(customer);
    setShowActions(true);
  }

  function closeActions() {
    setShowActions(false);
    setSelectedCustomer(null);
  }

  async function deleteCustomer(customerId) {
    if (!customerId) return;
    const ok = window.confirm("Delete this customer? This cannot be undone.");
    if (!ok) return;

    try {
      await coreClient.delete(`/api/v1/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      closeActions();
      fetchCustomers();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete customer.");
    }
  }

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = customers.filter((c) => {
    const hay = [
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c?.address?.line1,
      c?.address?.city,
      c?.address?.state,
      c?.address?.zip,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18 }}>Customers</div>
        <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
          Create customers and manage contact info.
        </div>

        <form
          onSubmit={createCustomer}
          style={{ display: "grid", gap: 10, marginTop: 14 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="First name" value={firstName} setValue={setFirstName} required />
            <Field label="Last name" value={lastName} setValue={setLastName} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Phone" value={phone} setValue={setPhone} placeholder="229-xxx-xxxx" />
            <Field label="Email" value={email} setValue={setEmail} type="email" />
          </div>

          <Field label="Address line 1" value={addressLine1} setValue={setAddressLine1} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            <Field label="City" value={city} setValue={setCity} />
            <Field label="State" value={state} setValue={setState} placeholder="GA" />
            <Field label="ZIP" value={postalCode} setValue={setPostalCode} placeholder="31601" />
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
            + Create Customer
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
          <div style={{ fontWeight: 700 }}>
            Customer List{" "}
            <span style={{ color: "var(--phs-muted)", fontWeight: 500 }}>
              ({filtered.length})
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="search"
              placeholder="Search customers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 320 }}
            />
            <button
              type="button"
              onClick={fetchCustomers}
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
        </div>

        {loading ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "var(--phs-muted)" }}>
            No customers yet (or customers endpoint not wired).
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((c) => (
              <CustomerRow
                key={c._id || c.id}
                customer={c}
                onOpen={() => openActions(c)}
              />
            ))}
          </div>
        )}
      </div>
      {showActions && selectedCustomer ? (
        <CustomerActionsModal
          customer={selectedCustomer}
          onClose={closeActions}
          onCreateEstimate={() => alert("Create estimate (wire later)")}
          onEdit={() => alert("Edit customer (wire later)")}
          onDelete={() => deleteCustomer(selectedCustomer._id || selectedCustomer.id)}
        />
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#374151" }}>
        {label} {required ? <span style={{ color: "#b91c1c" }}>*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        placeholder={placeholder}
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid var(--phs-border)",
        }}
      />
    </label>
  );
}

function CustomerRow({ customer, onOpen }) {
  const name =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.name ||
    "Unnamed customer";

  const email = customer.email || "—";
  const phone = customer.phone || "—";

  const addr = customer.address || {};
  const addressLine = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, (addr.zip || addr.postalCode)].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 14,
        border: "1px solid var(--phs-border)",
        background: "#f9fafb",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 900 }}>{name}</div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ color: "var(--phs-muted)", fontSize: 12 }}>
            {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : ""}
          </div>

          <button
            type="button"
            onClick={onOpen}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--phs-radius-pill)",
              border: "1px solid var(--phs-border)",
              background: "white",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            Actions
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
        <span><strong>Email:</strong> {email}</span>
        <span><strong>Phone:</strong> {phone}</span>
        <span><strong>Address:</strong> {addressLine || "—"}</span>
      </div>
    </div>
  );
}

function CustomerActionsModal({ customer, onClose, onCreateEstimate, onEdit, onDelete }) {
  const name =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.name ||
    "Unnamed customer";

  const addr = customer.address || {};
  const addressLine = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, (addr.zip || addr.postalCode)].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "min(720px, 100%)",
          padding: 16,
          borderRadius: 18,
          background: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 16 }}>{name}</div>
            <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 2 }}>
              {customer.email || "—"} • {customer.phone || "—"}
            </div>
            <div style={{ color: "var(--phs-muted)", fontSize: 13, marginTop: 2 }}>
              {addressLine || "—"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--phs-border)",
              background: "white",
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onCreateEstimate}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--phs-radius-pill)",
              border: "none",
              background: "var(--phs-primary)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Create estimate
          </button>

          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--phs-radius-pill)",
              border: "1px solid var(--phs-border)",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Edit customer
          </button>

          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--phs-radius-pill)",
              border: "1px solid rgba(185, 28, 28, 0.35)",
              background: "rgba(185, 28, 28, 0.08)",
              color: "#991b1b",
              cursor: "pointer",
              fontWeight: 900,
              marginLeft: "auto",
            }}
          >
            Delete customer
          </button>
        </div>

        <div style={{ marginTop: 10, color: "var(--phs-muted)", fontSize: 12 }}>
          Tip: If the same person appears twice, delete the extra record for now. (Later we can add merge.)
        </div>
      </div>
    </div>
  );
}
