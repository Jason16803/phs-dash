import "@sfg/dashboard-core/styles";  // dashboard-core SCSS (login, layout, etc.)
import "./index.css";                  // Tailwind + phs custom classes
import "./styles/phs.css";             // PHS overrides on top

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);