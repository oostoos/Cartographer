import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts: importing vitest's defineConfig alongside
// @vitejs/plugin-react in one file causes a duplicate-vite-type conflict (vitest bundles its
// own copy of vite's types), so test config and dev-server/plugin config are split.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
