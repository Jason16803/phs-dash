import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { coreMe } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const ALLOWED_TENANT_IDS = (import.meta.env.VITE_ALLOWED_TENANTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function check() {
      setStatus("checking");
      setErrorMsg("");

      const token = getToken();
      if (!token) return isMounted && setStatus("unauthed");

      try {
        const me = await coreMe(token);
        const tenantId = me?.data?.tenantId;

        if (ALLOWED_TENANT_IDS.length && !ALLOWED_TENANT_IDS.includes(tenantId)) {
          localStorage.removeItem("sfg_access_token");
          return isMounted && setStatus("unauthed");
        }

        if (isMounted) setStatus("authed");
      } catch (e) {
        const httpStatus = e?.response?.status;

        if (httpStatus === 401 || httpStatus === 403) {
          localStorage.removeItem("sfg_access_token");
          return isMounted && setStatus("unauthed");
        }

        if (isMounted) {
          setErrorMsg(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to verify session right now. Please try again."
          );
          setStatus("error");
        }
      }
    }

    check();
    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") return <div style={{ padding: 24 }}>Checking session…</div>;
  if (status === "error")
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>Session check failed</div>
        <div style={{ color: "#6b7280", marginBottom: 12 }}>{errorMsg}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  if (status === "unauthed") return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}
