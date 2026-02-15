import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { coreLogin } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    async function handleSubmit(e) {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const data = await coreLogin({ email: email.toLowerCase().trim(), password });

        const accessToken = data?.data?.accessToken;

        if (!accessToken) {
          throw new Error("Login succeeded but accessToken was missing.");
        }

        localStorage.setItem("sfg_access_token", accessToken);
        navigate(from, { replace: true });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Login failed. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }


  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 18, border: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: 0 }}>PHS-dash Login</h2>
        <p style={{ marginTop: 6, color: "#6b7280" }}>
          Sign in to access the admin dashboard.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          </label>

          {error ? (
            <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 999,
              border: "none",
              background: "#0b7d7d",
              color: "white",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
