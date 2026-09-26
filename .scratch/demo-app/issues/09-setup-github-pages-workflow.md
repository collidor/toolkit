# 09 - Setup GitHub Pages Multi-App Build and Automated Deployment

Type: task
Status: resolved
Blocked by: none (06, 07, 08 resolved)

## Question

How should Vite build scripts and the GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) be configured to assemble the root showcase, the Angular sub-app, and the Solid sub-app into a single unified `dist/` directory with correct relative base paths for seamless GitHub Pages hosting?

## Resolution

1. **Unified Monorepo Build Scripts**:
   - Added `build:demo:angular`, `build:demo:solid`, `build:demo:showcase`, and `build:demo` scripts to `toolkit/package.json`.
   - `build:demo` executes all three builds sequentially:
     1. Angular sub-app (`npm --prefix demo/angular run build`) compiling zoneless Angular 18 + Analog into `dist/angular/`.
     2. Solid sub-app (`npm --prefix demo/solid run build`) compiling Solid.js arena into `dist/solid/`.
     3. Showcase shell (`npm --prefix demo/showcase run build`) compiling React shell + Vue 3 catalog + Svelte inspector into `dist/`.
   - With `base: './'` and `emptyOutDir: false` across all three Vite configs, the static bundle deploys seamlessly from root or any nested subpath on GitHub Pages (`https://<user>.github.io/<repo>/`).

2. **Tailwind CSS & Styling Engine**:
   - Configured Tailwind CSS v3, PostCSS, and Autoprefixer across Showcase and Solid widgets.
   - Fixed base styling and resets in `demo/angular/index.html` to eliminate white flash and default user-agent margins.
   - Complete CSS bundle size expanded from 2.7 kB to 28.6 kB, restoring 3-column responsive layout, glassmorphism panels, type badges, and real-time animation pulses.

3. **Automated GitHub Actions Deployment**:
   - Created `.github/workflows/deploy-pages.yml` with:
     - `actions/checkout@v4` & `actions/setup-node@v4`
     - Dependency installations across root, `demo/showcase`, `demo/angular`, and `demo/solid` via `npm ci`
     - Toolkit compilation (`npm run build`) and demo aggregation (`npm run build:demo`)
     - Artifact publishing via `actions/upload-pages-artifact@v3` pointing to `./dist`
     - Official deployment via `actions/deploy-pages@v4` to GitHub Pages
