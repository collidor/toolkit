import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/main.ts",
    "./src/command.ts",
    "./src/event.ts",
    "./src/injector.ts",
    "./src/observable-command.ts",
    "./src/observable-event.ts",
    "./src/result.ts",
    "./src/schema-command.ts",
  ],
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
});
