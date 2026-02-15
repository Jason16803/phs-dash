import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  <div className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--text)]">
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[420px] place-items-center">
      <div className="w-full rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4">
          <h2 className="m-0 text-xl font-semibold tracking-tight">PHS-dash Login</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sign in to access the admin dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-[var(--text)]/80">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-[var(--text)]/80">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </label>

          {error ? (
            <div className="rounded-[var(--r-lg)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex w-full items-center justify-center rounded-[var(--r-full)] bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary)]/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-xs text-[var(--muted)]">
          Protected tenant dashboard • SFG Core Auth
        </div>
      </div>
    </div>
  </div>
);

}
