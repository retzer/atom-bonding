import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root")!;
rootElement.dataset.ready = "true";

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
