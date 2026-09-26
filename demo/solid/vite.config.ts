import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [solidPlugin()],
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
    outDir: resolve(__dirname, "../../dist/solid"),
    emptyOutDir: false,
    target: "es2022",
  },
});
