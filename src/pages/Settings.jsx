import React, { useEffect, useState } from "react";
import { coreMe } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

export default function Settings() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const data = await coreMe(getToken());
        // coreMe returns successResponse => { success, message, data }
        setMe(data?.data || null);
      } catch (e) {
        setMe(null);
        setError(e?.response?.data?.message || e?.message || "Failed to load profile.");
      }
    }
    load();
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18 }}>Settings</div>
        <div style={{ color: "var(--phs-muted)", marginTop: 4 }}>
          Profile, tenant info, and session controls.
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Account</div>

        {error ? (
          <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
        ) : !me ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <Row label="Name" value={`${me.firstName || ""} ${me.lastName || ""}`.trim() || "—"} />
            <Row label="Email" value={me.email || "—"} />
            <Row label="Role" value={me.role || "—"} />
            <Row label="Tenant ID" value={me.tenantId || "—"} />
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Session</div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("sfg_access_token");
            window.location.href = "/login";
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "var(--phs-radius-pill)",
            border: "none",
            background: "#111827",
            color: "white",
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: "1px solid var(--phs-border)",
        paddingBottom: 8,
      }}
    >
      <div style={{ color: "var(--phs-muted)", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{value}</div>
    </div>
  );
}
