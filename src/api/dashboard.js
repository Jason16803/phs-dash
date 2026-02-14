import { coreClient } from "./coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

export async function getCustomers() {
  const res = await coreClient.get("/api/v1/customers", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
}

export async function getJobs() {
  const res = await coreClient.get("/api/v1/jobs", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
}
