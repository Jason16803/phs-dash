import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { coreMe } from "../api/coreClient";

function getToken() {
  return localStorage.getItem("sfg_access_token");
}

export default function RequireAuth({ children }) {
  const location = useLocation();

  const [status, setStatus] = useState("checking"); // checking | authed | unauthed | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function check() {
      setStatus("checking");
      setErrorMsg("");

      const token = getToken();
      if (!token) {
        if (isMounted) setStatus("unauthed");
        return;
      }

      try {
        await coreMe(token);
        if (isMounted) setStatus("authed");
      } catch (e) {
        const httpStatus = e?.response?.status;

        // If Core says unauthorized/forbidden, token is bad/expired -> logout
        if (httpStatus === 401 || httpStatus === 403) {
          localStorage.removeItem("sfg_access_token");
          if (isMounted) setStatus("unauthed");
          return;
        }

        // Otherwise it's likely network/CORS/5xx -> don't nuke token
        if (isMounted) {
          setErrorMsg(
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
  }, [location.pathname]);

  if (status === "checking") {
    return <div style={{ padding: 24 }}>Checking session…</div>;
  }

  if (status === "error") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>
          Session check failed
        </div>
        <div style={{ color: "#6b7280", marginBottom: 12 }}>{errorMsg}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (status === "unauthed") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
