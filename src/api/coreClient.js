// src/api/coreClient.js
import axios from "axios";

export const coreClient = axios.create({
  baseURL: import.meta.env.VITE_CORE_BASE_URL,
  withCredentials: false, // set true only if you use cookie auth
});

export async function coreMe(token) {
  // Adjust the path if your core uses a different one
  const res = await coreClient.get("/api/v1/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

console.log("CORE BASE URL:", import.meta.env.VITE_CORE_BASE_URL);

