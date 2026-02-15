import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import "./styles/";
import { coreLogin } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/admin/dashboard";

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
  <div className="min-h-screen flex items-center justify-center bg-[var(--phs-bg)] px-4">
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-semibold text-[var(--phs-text)]">
        PHS-dash Login
      </h2>

      <p className="mt-2 text-sm text-[var(--phs-muted)]">
        Sign in to access the admin dashboard.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--phs-text)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="mt-1 w-full rounded-lg border border-[var(--phs-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--phs-text)]">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-[var(--phs-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--phs-primary)] text-white py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-xs text-center text-[var(--phs-muted)]">
        Protected tenant dashboard • SFG Core Auth
      </div>
    </div>
  </div>
);



}
