// RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { coreMe } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

const ALLOWED_TENANT_IDS = ["TNT_YRNBZWIEA8PH", "TNT_4TWOZ4KYOO2O"];

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = getToken();
        if (!token) {
          if (alive) setStatus("unauthed");
          return;
        }

        // coreMe returns the JSON payload from the API
        const payload = await coreMe(token);

        // Your API successResponse likely returns:
        // { success, message, data: { id, email, tenantId, ... } }
        const user = payload?.data ?? payload?.data?.data;
        const tenantId = user?.tenantId;

        if (!tenantId) {
          localStorage.removeItem("sfg_access_token");
          if (alive) setStatus("unauthed");
          return;
        }

        if (!ALLOWED_TENANT_IDS.includes(tenantId)) {
          localStorage.removeItem("sfg_access_token");
          if (alive) setStatus("unauthed");
          return;
        }

        if (alive) setStatus("authed");
      } catch (e) {
        const httpStatus = e?.response?.status;

        if (httpStatus === 401 || httpStatus === 403) {
          localStorage.removeItem("sfg_access_token");
          if (alive) setStatus("unauthed");
          return;
        }

        if (alive) {
          setErrorMsg(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to verify session right now. Please try again."
          );
          setStatus("error");
        }
      }
    })();

    return () => {
      alive = false;
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
