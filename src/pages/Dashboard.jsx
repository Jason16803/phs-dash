import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getCustomers, getJobs } from "../api/dashboard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdOpenInNew } from "react-icons/md";

function fmtDay(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildLastNDaysBuckets(n = 14) {
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);

    buckets.push({
      key: d.toISOString().slice(0, 10), // YYYY-MM-DD
      label: fmtDay(d),
      value: 0,
    });
  }
  return buckets;
}

function pickJobDate(job) {
  // Try common fields; adjust to your schema as needed.
  // If your Job model uses "scheduledAt" or "startDate", add it here.
  return (
    job?.completedAt ||
    job?.scheduledAt ||
    job?.date ||
    job?.createdAt ||
    null
  );
}

function KpiCard({ label, value, to, hint }) {
  const navigate = useNavigate();

  return (
    <div
      className="card"
      style={{
        padding: 16,
        position: "relative",
        cursor: to ? "pointer" : "default",
      }}
      onClick={() => (to ? navigate(to) : null)}
      role={to ? "button" : undefined}
      tabIndex={to ? 0 : undefined}
      onKeyDown={(e) => {
        if (!to) return;
        if (e.key === "Enter" || e.key === " ") navigate(to);
      }}
    >
      {/* icon button */}
      {to ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // prevents card click double-trigger
            navigate(to);
          }}
          title={`Open ${label}`}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            height: 34,
            width: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "1px solid var(--phs-border)",
            background: "white",
            cursor: "pointer",
          }}
        >
          <MdOpenInNew size={18} />
        </button>
      ) : null}

      <div style={{ color: "var(--phs-muted)", fontWeight: 900, fontSize: 12 }}>
        {label}
      </div>

      <div style={{ fontWeight: 950, fontSize: 24, marginTop: 6 }}>
        {value}
      </div>

      {hint ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--phs-muted)" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

const DEFAULT_STATUS = "all";
const VALID_STATUSES = new Set([
  "all",
  "created",
  "estimate",
  "scheduled",
  "in-progress",
  "completed",
  "canceled",
  "archived",
]);

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    scheduled: 0,
    completed: 0,
    pendingInvoices: 0,
  });
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [status, setStatus] = useState(() => {
    const s = searchParams.get("status") || DEFAULT_STATUS;
    return VALID_STATUSES.has(s) ? s : DEFAULT_STATUS;
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      const customersRes = await getCustomers();
      const jobsRes = await getJobs();

      const customers = customersRes?.data?.length ?? 0;
      const jobsArr = jobsRes?.data?.length ? jobsRes.data : [];

      const scheduled = jobsArr.filter((j) => j.status === "scheduled").length;
      const completed = jobsArr.filter((j) => j.status === "completed").length;

      if (!alive) return;

      setJobs(jobsArr);
      setStats({
        customers,
        scheduled,
        completed,
        pendingInvoices: 0, // until invoices exist
      });
    }

    load().catch(console.error);

    return () => {
      alive = false;
    };
  }, []);

  const completedJobsSeries = useMemo(() => {
    // Build 14-day buckets
    const buckets = buildLastNDaysBuckets(14);
    const map = new Map(buckets.map((b) => [b.key, b]));

    // Count completed jobs per day
    for (const j of jobs) {
      if (j?.status !== "completed") continue;

      const raw = pickJobDate(j);
      if (!raw) continue;

      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;

      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);

      const bucket = map.get(key);
      if (bucket) bucket.value += 1;
    }

    return buckets;
  }, [jobs]);

  return (
  <div style={{ display: "grid", gap: 14 }}>
    {/* KPI grid */}
    <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

      {/* Total Customers */}
      <div
        className="card group cursor-pointer"
        style={{ padding: 16, position: "relative" }}
        onClick={() => navigate("/admin/customers")}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/admin/customers");
          }}
          className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition"
          style={{
            height: 34,
            width: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "1px solid var(--phs-border)",
            background: "white",
          }}
        >
          <MdOpenInNew size={18} />
        </button>

        <div style={{ color: "var(--phs-muted)", fontWeight: 900, fontSize: 12 }}>
          Total Customers
        </div>

        <div style={{ fontWeight: 950, fontSize: 24, marginTop: 6 }}>
          {stats.customers}
        </div>
      </div>

      {/* Scheduled Jobs */}
      <div
        className="card group cursor-pointer"
        style={{ padding: 16, position: "relative" }}
        onClick={() => navigate("/admin/jobs?status=scheduled")}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/admin/jobs?status=scheduled");
          }}
          className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition"
          style={{
            height: 34,
            width: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "1px solid var(--phs-border)",
            background: "white",
          }}
        >
          <MdOpenInNew size={18} />
        </button>

        <div style={{ color: "var(--phs-muted)", fontWeight: 900, fontSize: 12 }}>
          Scheduled Jobs
        </div>

        <div style={{ fontWeight: 950, fontSize: 24, marginTop: 6 }}>
          {stats.scheduled}
        </div>
      </div>

      {/* Pending Invoices */}
      <div
        className="card group cursor-pointer"
        style={{ padding: 16, position: "relative" }}
        onClick={() => navigate("/admin/invoices")}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/admin/invoices");
          }}
          className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition"
          style={{
            height: 34,
            width: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "1px solid var(--phs-border)",
            background: "white",
          }}
        >
          <MdOpenInNew size={18} />
        </button>

        <div style={{ color: "var(--phs-muted)", fontWeight: 900, fontSize: 12 }}>
          Pending Invoices
        </div>

        <div style={{ fontWeight: 950, fontSize: 24, marginTop: 6 }}>
          {stats.pendingInvoices}
        </div>
      </div>

      {/* Completed Jobs */}
      <div
        className="card group cursor-pointer"
        style={{ padding: 16, position: "relative" }}
        onClick={() => navigate("/admin/jobs?status=completed")}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/admin/jobs?status=completed");
          }}
          className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition"
          style={{
            height: 34,
            width: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "1px solid var(--phs-border)",
            background: "white",
          }}
        >
          <MdOpenInNew size={18} />
        </button>

        <div style={{ color: "var(--phs-muted)", fontWeight: 900, fontSize: 12 }}>
          Completed Jobs
        </div>

        <div style={{ fontWeight: 950, fontSize: 24, marginTop: 6 }}>
          {stats.completed}
        </div>
      </div>

    </div>

    {/* First KPI trend */}
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 14 }}>Completed jobs</div>
          <div style={{ color: "var(--phs-muted)", fontSize: 12, marginTop: 2 }}>
            Last 14 days
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{stats.completed}</div>
          <div style={{ color: "var(--phs-muted)", fontSize: 12 }}>total completed</div>
        </div>
      </div>

      <div className="mt-3 h-[200px] sm:h-[220px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={completedJobsSeries}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v}`, "Completed"]} labelStyle={{ fontWeight: 900 }} />
            <Line type="monotone" dataKey="value" stroke="var(--phs-primary)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
}