/*
 * Entry point.
 *
 * The three global stylesheets are imported here, before `App`, so the cascade
 * order is deterministic in the built bundle: tokens (custom properties) →
 * base (reset, fonts, layout primitives) → components (shared UI). Each screen
 * imports its own `screen-*.css`, which therefore always lands after these.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

import App from "./app/App.tsx";

const container = document.getElementById("root");
if (!container) throw new Error('Missing #root — check index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
