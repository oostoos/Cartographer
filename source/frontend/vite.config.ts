import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend dev server config. Port 5173 (Vite's default) must match FRONTEND_ORIGIN in the
// backend's .env, and BACKEND_PORT (5000) below must match the backend's own .env setting.
// Test config lives separately in vitest.config.ts (see that file for why).
const BACKEND_DEV_SERVER_URL = "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail loudly instead of silently picking a different port — a silent port drift would
    // desync from the hardcoded URL in .vscode/launch.json's browser debug configs.
    strictPort: true,
    proxy: {
      "/api": {
        target: BACKEND_DEV_SERVER_URL,
        changeOrigin: true,
      },
    },
  },
});
