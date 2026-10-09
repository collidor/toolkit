import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@demo/shared": resolve(__dirname, "../shared/index.ts"),
      "@collidor/toolkit": resolve(__dirname, "../../src/main.ts"),
    },
  },
  esbuild: {
    keepNames: true,
  },
  build: {
    outDir: resolve(__dirname, "../../dist/react"),
    emptyOutDir: false,
    target: "es2022",
  },
});
