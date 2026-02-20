import React from "react";
import { Routes, Route } from "react-router-dom";
import {  Navigate } from "react-router-dom";

import RequireAuth from "../auth/RequireAuth";
import AdminLayout from "../layout/AdminLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import Jobs from "../pages/Jobs";
import JobDetail from "../pages/JobDetail";
import PriceBook from "../pages/PriceBook";
import Leads from "../pages/Leads";
import Invoices from "../pages/Invoices";
import Settings from "../pages/Settings";
import Calendar from "../pages/Calendar";

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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="customers" element={<Customers />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="leads" element={<Leads />} />
        <Route path="pricebook" element={<PriceBook />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />

    </Routes>
  );
}
