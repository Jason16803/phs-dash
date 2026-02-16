// src/api/intakeClient.js
import { coreClient } from "./coreClient";

function token() {
  return localStorage.getItem("sfg_access_token");
}

function authHeaders() {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * GET /api/v1/intake
 * successResponse => { success, message, data: { intakes, pagination } }
 */
export async function listIntakes({ status = "", page = 1, limit = 50 } = {}) {
  const params = { page, limit };
  if (status) params.status = status;

  const res = await coreClient.get("/api/v1/intake", {
    params,
    headers: authHeaders(),
  });

  return res.data;
}

/**
 * POST /api/v1/intake
 * Create intake internally (dashboard add lead)
 */
export async function createIntake(payload) {
  const res = await coreClient.post("/api/v1/intake", payload, {
    headers: authHeaders(),
  });
  return res.data;
}

/**
 * PUT /api/v1/intake/:id
 * Update intake (status, notes, etc.)
 */
export async function updateIntake(id, patch) {
  const res = await coreClient.put(`/api/v1/intake/${id}`, patch, {
    headers: authHeaders(),
  });
  return res.data;
}
