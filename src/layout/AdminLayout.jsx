// src/layout/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">P</div>
          <div>
            <div className="brandTitle">PHS-dash</div>
            <div className="brandSub">Services Dashboard</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/admin" end className="navLink">
            Dashboard
          </NavLink>
          <NavLink to="/admin/customers" className="navLink">
            Customers
          </NavLink>
          <NavLink to="/admin/leads" className="navLink">
            Leads
          </NavLink>
          <NavLink to="/admin/jobs" className="navLink">
            Jobs
          </NavLink>
          <NavLink to="/admin/invoices" className="navLink">
            Invoices
          </NavLink>
          <NavLink to="/admin/settings" className="navLink">
            Settings
          </NavLink>

          <button
            className="navLink navLinkBtn"
            onClick={() => {
              localStorage.removeItem("sfg_access_token");
              window.location.href = "/login";
            }}
            type="button"
          >
            Logout
          </button>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="title">PHS Dashboard</h1>
            <p className="subtitle">Customers, jobs, and invoices in one place.</p>
          </div>

          <input className="search" placeholder="Search…" />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
