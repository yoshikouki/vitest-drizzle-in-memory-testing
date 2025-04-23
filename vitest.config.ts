import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    env: {
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
