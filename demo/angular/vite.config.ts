import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  resolve: {
    mainFields: ["module"],
    alias: {
      "@demo/shared": resolve(__dirname, "../shared/index.ts"),
      "@collidor/toolkit": resolve(__dirname, "../../src/main.ts"),
    },
  },
  plugins: [
    angular({
      tsconfig: "./tsconfig.app.json",
      inlineStylesExtension: "css",
    }),
  ],
  esbuild: {
    keepNames: true,
  },
  build: {
    outDir: resolve(__dirname, "../../dist/angular"),
    emptyOutDir: false,
    target: "es2022",
  },
});
