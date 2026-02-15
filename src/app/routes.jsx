import React from "react";
import { Routes, Route } from "react-router-dom";

import RequireAuth from "../auth/RequireAuth";
import AdminLayout from "../layout/AdminLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import Jobs from "../pages/Jobs";
import Leads from "../pages/Leads";
import Invoices from "../pages/Invoices";
import Settings from "../pages/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="leads" element={<Leads />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Login />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}
