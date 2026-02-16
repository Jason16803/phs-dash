import { coreClient } from "./coreClient";

function token() {
  return localStorage.getItem("sfg_access_token");
}

import { coreClient } from "./coreClient";

function token() {
  return localStorage.getItem("sfg_access_token");
}
function headers() {
  return { Authorization: `Bearer ${token()}` };
}

export async function listIntakes(params = {}) {
  const res = await coreClient.get("/api/v1/intake", {
    params,
    headers: headers(),
  });
  return res.data; // { success, message, data: { intakes, pagination } }
}

export async function createIntake(payload) {
  const res = await coreClient.post("/api/v1/intake", payload, {
    headers: headers(),
  });
  return res.data; // { success, message, data: intake }
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
