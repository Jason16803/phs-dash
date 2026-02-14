import React, { useEffect, useState } from "react";
import { getCustomers, getJobs } from "../api/dashboard";

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    scheduled: 0,
    completed: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    async function load() {
      const customersRes = await getCustomers();
      const jobsRes = await getJobs();

      const customers = customersRes?.data?.length ?? 0;
      const jobs = jobsRes?.data?.length ? jobsRes.data : [];

      const scheduled = jobs.filter((j) => j.status === "scheduled").length;
      const completed = jobs.filter((j) => j.status === "completed").length;

      setStats({
        customers,
        scheduled,
        completed,
        pendingInvoices: 0, // until invoices exist
      });
    }

    load().catch(console.error);
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <div className="label">Total Customers</div>
        <div className="value">{stats.customers}</div>
      </div>

      <div className="card">
        <div className="label">Scheduled Jobs</div>
        <div className="value">{stats.scheduled}</div>
      </div>

      <div className="card">
        <div className="label">Pending Invoices</div>
        <div className="value">{stats.pendingInvoices}</div>
      </div>

      <div className="card">
        <div className="label">Completed Jobs</div>
        <div className="value">{stats.completed}</div>
      </div>
    </div>
  );
}
