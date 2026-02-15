import { coreClient } from "./coreClient";

function token() {
  return localStorage.getItem("sfg_access_token");
}
function headers() {
  return { Authorization: `Bearer ${token()}` };
}

export async function createCustomer(payload) {
  const res = await coreClient.post("/api/v1/customers", payload, {
    headers: headers(),
  });
  return res.data; // { success, message, data: customer }
}

export async function createJob(payload) {
  const res = await coreClient.post("/api/v1/jobs", payload, {
    headers: headers(),
  });
  return res.data; // { success, message, data: job }
}

export async function updateIntake(intakeId, payload) {
  const res = await coreClient.put(`/api/v1/intake/${intakeId}`, payload, {
    headers: headers(),
  });
  return res.data;
}

export async function convertIntake(intakeId) {
  const res = await coreClient.post(`/api/v1/intake/${intakeId}/convert`, {}, {
    headers: headers(),
  });
  return res.data; // { success, message, data: { intake, customer, job } }
}


