# 02 - Research Vite + Analog + Angular Standalone Sub-App Configuration

Type: research
Status: resolved
Blocked by: none

## Question

How should `@analogjs/vite-plugin-angular` and Angular standalone components be configured in a client-only static SPA mode within our Vite project, outputting to a sub-directory (`dist/angular/`) compatible with GitHub Pages relative base paths?

## Answer

1. **Client-Only Plugin**: Use `@analogjs/vite-plugin-angular` directly in Vite (without `@analogjs/platform`) to build a pure static client SPA.
2. **Relative Base Path**: Set `base: './'` in `vite.config.ts` and `<base href="./">` in `index.html`. This ensures all JS/CSS/asset paths are relative to `dist/angular/`, working under any GitHub Pages repository path or domain.
3. **Zoneless Angular 18+**: Use `provideExperimentalZonelessChangeDetection()` in `bootstrapApplication()`, allowing Analog to omit `zone.js` completely, saving bundle size and eliminating DOM monkey-patching in the iframe.
4. **Project Structure**: House the Angular sub-app in `toolkit/demo/angular` with its own `package.json`, `tsconfig.app.json`, and `vite.config.ts`, building to `../../dist/angular/`.
