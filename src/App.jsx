import React, { useEffect } from "react";
import AppRoutes from "./app/routes";
import { applyTheme } from "./branding/applyTheme";
import { phsTheme } from "./branding/theme.phs";

export default function App() {
  useEffect(() => {
    applyTheme(phsTheme);
  }, []);

  return <AppRoutes />;
}
