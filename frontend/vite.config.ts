/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the backend so the browser never needs CORS.
    proxy: {
      "/api": process.env.API_PROXY_TARGET ?? "http://localhost:8080",
      "/evaluate_board_state":
        process.env.API_PROXY_TARGET ?? "http://localhost:8080",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
