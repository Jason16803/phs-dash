import { coreClient } from "./coreClient";

export async function coreLogin({ email, password }) {
  const res = await coreClient.post("/api/v1/auth/login", { email, password });
  return res.data;
}
