import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf-8"),
);

export default defineConfig({
  base: "./",
  define: {
    __TOOLKIT_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    vue(),
    svelte({
      preprocess: vitePreprocess(),
    }),
  ],
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
    outDir: resolve(__dirname, "../../dist"),
    emptyOutDir: false,
    target: "es2022",
  },
  server: {
    port: 5173,
    open: true,
  },
});
