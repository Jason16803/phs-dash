// src/layout/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

function SideLink({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "block rounded-(--phs-radius-pill) px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-(--phs-primary-soft) text-(--phs-primary) ring-1 ring-[rgba(11,125,125,0.25)]"
            : "text-(--phs-text) hover:bg-black/5",
        ].join(" ")
      } 
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("sfg_access_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-(--phs-bg) text-(--phs-text)">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-65 shrink-0 border-r border-(--phs-border) bg-(--phs-surface) p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-(--phs-radius-pill) bg-(--phs-primary-soft) font-extrabold text-(--phs-primary)">
              P
            </div>
            <div>
              <div className="font-extrabold leading-tight">PHS-dash</div>
              <div className="text-xs text-(--phs-muted)">Services Dashboard</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <SideLink to="/admin" end>
              Dashboard
            </SideLink>
            <SideLink to="/admin/customers">Customers</SideLink>
            <SideLink to="/admin/leads">Leads</SideLink>
            <SideLink to="/admin/jobs">Jobs</SideLink>
            <SideLink to="/admin/pricebook">Price Book</SideLink>
            <SideLink to="/admin/invoices">Invoices</SideLink>
            <SideLink to="/admin/settings">Settings</SideLink>

            <button
              type="button"
              onClick={logout}
              className="mt-2 rounded-(--phs-radius-pill) px-3 py-2 text-left text-sm font-medium text-(--phs-text) hover:bg-black/5"
            >
              Logout
            </button>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold">PHS Dashboard</h1>
              <p className="text-sm text-[var(--phs-muted)]">
                Customers, jobs, and invoices in one place.
              </p>
            </div>

            <input
              className="w-full sm:w-[520px] rounded-[var(--phs-radius-pill)] border border-[var(--phs-border)] bg-[var(--phs-surface)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--phs-primary)]"
              placeholder="Search…"
            />
          </header>

          <main className="flex flex-col gap-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
