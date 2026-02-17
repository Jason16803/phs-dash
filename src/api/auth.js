// src/api/auth.js
import { coreClient } from "./coreClient";

export async function coreLogin(payload) {
  const res = await coreClient.post("/api/v1/auth/login", payload);
  return res.data;
}
