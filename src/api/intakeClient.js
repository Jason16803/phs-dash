import { coreClient } from "./coreClient";

function token() {
  return localStorage.getItem("sfg_access_token");
}

export async function listIntakes({ status = "", page = 1, limit = 50 } = {}) {
  const params = {};
  if (status) params.status = status;
  params.page = page;
  params.limit = limit;

  const res = await coreClient.get("/api/v1/intake", {
    params,
    headers: { Authorization: `Bearer ${token()}` },
  });

  // successResponse => { success, message, data: { intakes, pagination } }
  return res.data;
}

export async function updateIntake(id, patch) {
  const res = await coreClient.put(`/api/v1/intake/${id}`, patch, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  return res.data;
}
