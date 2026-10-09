import { defineConfig } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [
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
    outDir: resolve(__dirname, "../../dist/svelte"),
    emptyOutDir: false,
    target: "es2022",
  },
});
