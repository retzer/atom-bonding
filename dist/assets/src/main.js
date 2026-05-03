import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
const rootElement = document.getElementById("root");
rootElement.dataset.ready = "true";
createRoot(rootElement).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
