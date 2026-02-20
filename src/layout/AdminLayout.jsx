// src/layout/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

function TopLink({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "relative px-3 py-2 text-sm font-extrabold transition",
          "rounded-(--phs-radius-pill)",
          isActive
            ? "bg-(--phs-primary-soft) text-(--phs-primary)"
            : "text-white/90 hover:bg-white/10 hover:text-white",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

function routeMeta(pathname) {
  // Layout-only: titles for the header row (optional)
  if (pathname === "/admin") return { title: "Dashboard", subtitle: "Overview" };
  if (pathname.startsWith("/admin/leads")) return { title: "Leads", subtitle: "Intake and follow-ups" };
  if (pathname.startsWith("/admin/jobs")) return { title: "Jobs", subtitle: "Work in progress" };
  if (pathname.startsWith("/admin/estimates")) return { title: "Estimates", subtitle: "Quotes and approvals" };
  if (pathname.startsWith("/admin/invoices")) return { title: "Invoices", subtitle: "Billing and payments" };
  if (pathname.startsWith("/admin/customers")) return { title: "Customers", subtitle: "Customer directory" };
  if (pathname.startsWith("/admin/pricebook")) return { title: "Price Book", subtitle: "Services and pricing" };
  if (pathname.startsWith("/admin/settings")) return { title: "Settings", subtitle: "Profile" };
  return { title: "Admin", subtitle: "" };
}

function NavMenu({ label, children }) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="rounded-(--phs-radius-pill) px-3 py-2 text-sm font-extrabold text-white/90 hover:bg-white/10 hover:text-white"
      >
        {label} <span style={{ fontSize: 11, opacity: 0.85 }}>▾</span>
      </button>

      {/* Dropdown */}
      <div
        className={[
          "invisible absolute left-0 top-[90%] z-50 min-w-[220px]",
          "rounded-2xl border border-white/15 bg-[#0b4da2] p-2",
          "opacity-0 shadow-lg transition",
          "group-hover:visible group-hover:opacity-100",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

function MenuItem({ to, children, disabled, end }) {
  if (disabled) {
    return (
      <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-extrabold text-white/55">
        <span>{children}</span>
        <span className="text-[11px] font-black text-white/35">Soon</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "block rounded-xl px-3 py-2 text-sm font-extrabold transition",
          isActive ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10 hover:text-white",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = routeMeta(location.pathname);

  const logout = () => {
    localStorage.removeItem("sfg_access_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-(--phs-bg) text-(--phs-text)">
      {/* TOP BAR */}
      <header
        className={[
          "sticky top-0 z-50",
          "border-b border-(--phs-border)",
          "bg-linear-to-r from-[#0b4da2] via-[#0b5ec2] to-[#0b4da2]",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-300 items-center justify-between gap-3 px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* <div className="flex h-9 w-9 items-center justify-center rounded-(--phs-radius-pill) bg-white/15 font-extrabold text-white">
              P
            </div> */}
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-white">PHS LLC</div>
              <div className="text-[11px] text-white/75">Services Dashboard</div>
            </div>
          </div>

          {/* Nav */}
          {/* <nav className="hidden items-center gap-1 md:flex">
            <TopLink to="/admin" end>
              Dashboard
            </TopLink>
            <TopLink to="/admin/calendar">Calendar</TopLink>
            <TopLink to="/admin/leads">Leads</TopLink>
            <TopLink to="/admin/jobs">Jobs</TopLink>
            <TopLink to="/admin/pricebook">Pricebook</TopLink>
            <TopLink to="/admin/invoices">Invoices</TopLink>
            <TopLink to="/admin/customers">Customers</TopLink>
          </nav> */}

          <nav className="hidden items-center gap-2 md:flex">
            <NavMenu label="Operations">
              <MenuItem to="/admin" end>Dashboard</MenuItem>
              <MenuItem to="/admin/calendar">Calendar</MenuItem>
              <MenuItem to="/admin/leads">Leads</MenuItem>
              <MenuItem to="/admin/jobs">Jobs</MenuItem>
              <MenuItem to="/admin/customers">Customers</MenuItem>

              {/* If you want it visible but not built yet */}
              <MenuItem to="/admin/estimates" disabled>Estimates</MenuItem>
            </NavMenu>

            <NavMenu label="Finances">
              <MenuItem to="/admin/invoices">Invoices</MenuItem>
              <MenuItem to="/admin/pricebook">Price Book</MenuItem>
            </NavMenu>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search (layout only) */}
            <div className="hidden sm:block">
              <input
                className="w-[320px] rounded-(--phs-radius-pill) border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/40"
                placeholder="Search…"
              />
            </div>

            {/* Settings shortcut (optional) */}
            <button
              type="button"
              onClick={() => navigate("/admin/settings")}
              className="rounded-(--phs-radius-pill) bg-white/10 px-3 py-2 text-sm font-extrabold text-white hover:bg-white/15"
              title="Settings"
            >
              ⚙
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="rounded-(--phs-radius-pill) bg-white px-3 py-2 text-sm font-extrabold text-[#0b4da2] hover:bg-white/90"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="border-t border-white/10 md:hidden">
          <div className="mx-auto flex w-full max-w-600 items-center gap-2 overflow-x-auto px-3 py-2">
            <TopLink to="/admin" end>
              Dashboard
            </TopLink>
            <TopLink to="/admin/leads">Leads</TopLink>
            <TopLink to="/admin/jobs">Jobs</TopLink>
            <TopLink to="/admin/invoices">Invoices</TopLink>
            <TopLink to="/admin/customers">Customers</TopLink>
          </div>
        </div>
      </header>

      {/* PAGE WRAP */}
      <div className="mx-auto w-full max-w-600 px-4 py-6">
        {/* Optional page header row (title + subtitle) */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{meta.title}</h1>
            {meta.subtitle ? (
              <p className="text-sm text-(--phs-muted)">{meta.subtitle}</p>
            ) : null}
          </div>

          {/* Optional: Page-level action slot (later per-route) */}
          {/* For now keep empty so layout stays consistent */}
        </div>

        <main className="flex flex-col gap-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}