import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const uiDir = resolve(__dirname, "node_modules/@collidor/ui");

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf-8"),
);

export default defineConfig({
  base: "./",
  define: {
    __TOOLKIT_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("ui-"),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@collidor/ui/dist/ui.css": resolve(uiDir, "dist/ui.css"),
      "@collidor/ui/themes": resolve(uiDir, "src/themes"),
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
