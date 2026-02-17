// src/api/coreClient.js
import axios from "axios";

export const coreClient = axios.create({
  baseURL: import.meta.env.VITE_CORE_BASE_URL,
  withCredentials: false,
});

// ✅ Attach tenant + auth token automatically
coreClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sfg_access_token");

  // 1) Auth header (for protected routes)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2) Tenant header (this is what fixes localhost login)
  const tenantId =
    localStorage.getItem("sfg_tenant_id") || import.meta.env.VITE_TENANT_ID;

  if (tenantId) {
    config.headers["X-Tenant-Id"] = tenantId;
  }

  return config;
});

export async function coreMe() {
  const res = await coreClient.get("/api/v1/me");
  return res.data;
}

console.log("CORE BASE URL:", import.meta.env.VITE_CORE_BASE_URL);
console.log("TENANT ID:", import.meta.env.VITE_TENANT_ID);
