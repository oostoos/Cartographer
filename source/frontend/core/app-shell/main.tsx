import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { apiPost } from "../api/apiClient";
import { AppRoutes } from "./AppRoutes";
import { registerShutdownOnClose } from "./shutdownOnClose";
import "./app-shell.css";
import "../design-system/tokens.css";

const queryClient = new QueryClient();

registerShutdownOnClose();
// Cancels any shutdown left pending by a refresh (which fires the same unload signal as a real
// tab close); a no-op if nothing was pending, so this is safe on every fresh load too.
apiPost("/api/cancel-shutdown").catch(() => {});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find the #root element to mount Cartographer into.");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
