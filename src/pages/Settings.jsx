import React, { useEffect, useMemo, useState } from "react";
import { coreMe, coreUpdateMe } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

export default function Settings() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | saving | success
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    async function load() {
      setError("");
      setStatus("loading");
      try {
        const res = await coreMe(getToken());
        const user = res?.data || null;
        setMe(user);

        setForm({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
        });

        setStatus("idle");
      } catch (e) {
        setMe(null);
        setStatus("idle");
        setError(
          e?.response?.data?.message || e?.message || "Failed to load profile."
        );
      }
    }
    load();
  }, []);

  const fullNamePreview = useMemo(() => {
    const full = `${form.firstName} ${form.lastName}`.trim();
    return full || "—";
  }, [form.firstName, form.lastName]);

  async function onSave(e) {
    e.preventDefault();
    setError("");
    setStatus("saving");

    // tiny v1 validation
    if (!form.email?.includes("@")) {
      setStatus("idle");
      setError("Please enter a valid email.");
      return;
    }

    try {
      const payload = {
        firstName: form.firstName?.trim(),
        lastName: form.lastName?.trim(),
        email: form.email?.trim(),
      };

      const res = await coreUpdateMe(payload);
      const updated = res?.data || null;

      setMe(updated);
      setForm({
        firstName: updated?.firstName || payload.firstName || "",
        lastName: updated?.lastName || payload.lastName || "",
        email: updated?.email || payload.email || "",
      });

      setStatus("success");
      setTimeout(() => setStatus("idle"), 900);
    } catch (e) {
      setStatus("idle");
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to update profile."
      );
    }
  }

  const isDisabled = status === "loading" || status === "saving";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>Settings</div>
        <div style={{ color: "var(--phs-muted)", marginTop: 4, fontSize: 13 }}>
          Update your profile information.
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 850, fontSize: 15 }}>Profile</div>
            <div style={{ color: "var(--phs-muted)", fontSize: 12, marginTop: 2 }}>
              Name and email used for your account.
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: 12 }}>{fullNamePreview}</div>
            <div style={{ color: "var(--phs-muted)", fontSize: 12 }}>
              {form.email || "—"}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--phs-border)", margin: "12px 0" }} />

        {error ? (
          <div style={{ color: "#b91c1c", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            {error}
          </div>
        ) : null}

        {!me && status === "loading" ? (
          <div style={{ color: "var(--phs-muted)" }}>Loading…</div>
        ) : (
          <form onSubmit={onSave} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <Field
                label="First name"
                value={form.firstName}
                disabled={isDisabled}
                onChange={(v) => setForm((s) => ({ ...s, firstName: v }))}
              />
              <Field
                label="Last name"
                value={form.lastName}
                disabled={isDisabled}
                onChange={(v) => setForm((s) => ({ ...s, lastName: v }))}
              />
            </div>

            <Field
              label="Email"
              value={form.email}
              disabled={isDisabled}
              onChange={(v) => setForm((s) => ({ ...s, email: v }))}
            />

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
              <button
                type="submit"
                disabled={isDisabled}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--phs-radius-pill)",
                  border: "none",
                  background: "#111827",
                  color: "white",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.7 : 1,
                  fontWeight: 900,
                }}
              >
                {status === "saving" ? "Saving…" : "Save changes"}
              </button>

              {status === "success" ? (
                <span style={{ color: "var(--phs-muted)", fontSize: 12, fontWeight: 800 }}>
                  Saved ✓
                </span>
              ) : null}
            </div>
          </form>
        )}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 850, marginBottom: 10 }}>Session</div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("sfg_access_token");
            window.location.href = "/login";
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "var(--phs-radius-pill)",
            border: "1px solid var(--phs-border)",
            background: "transparent",
            color: "var(--phs-text)",
            cursor: "pointer",
            width: "fit-content",
            fontWeight: 900,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ color: "var(--phs-muted)", fontSize: 12, fontWeight: 900 }}>
        {label}
      </div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 40,
          padding: "0 12px",
          borderRadius: 12,
          border: "1px solid var(--phs-border)",
          background: "transparent",
          color: "var(--phs-text)",
          outline: "none",
          fontWeight: 800,
        }}
      />
    </label>
  );
}