// src/api/serviceClient.js
import axios from "axios";

export const serviceClient = axios.create({
  baseURL: import.meta.env.VITE_SERVICE_BASE_URL,
  withCredentials: false,
});

export async function getCustomers(token) {
  const res = await serviceClient.get("/api/v1/customers", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}
