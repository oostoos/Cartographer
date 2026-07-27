/// <reference types="vitest/config" />
import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const REPO_ROOT = path.resolve(__dirname, "../../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, REPO_ROOT, "CARTOGRAPHER_");
  const backendPort = env.CARTOGRAPHER_BACKEND_PORT ?? "5000";
  const frontendPort = Number(env.CARTOGRAPHER_FRONTEND_PORT ?? "5173");

  return {
    plugins: [react()],
    envDir: REPO_ROOT,
    resolve: {
      alias: {
        "@common": path.resolve(__dirname, "../../common/frontend"),
        "@lib": path.resolve(__dirname, "../../../lib/typescript"),
      },
    },
    server: {
      port: frontendPort,
      proxy: {
        "/api": `http://localhost:${backendPort}`,
      },
      fs: {
        allow: [REPO_ROOT],
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      globals: true,
      include: [
        "**/*.{test,spec}.{ts,tsx}",
        "../../common/frontend/**/*.{test,spec}.{ts,tsx}",
        "../../../lib/typescript/**/*.{test,spec}.{ts,tsx}",
      ],
    },
  };
});
