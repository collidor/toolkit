# 05 - Prototype React Showcase Shell with DevTools Event Monitor and Doc Viewer

Type: prototype
Status: resolved
Blocked by: none (04 resolved)

## Question

How should the top-level React Showcase Shell render the responsive navigation, feature documentation reader, global search filter, live Collidor DevTools event monitor dock, and DOM mount points for the same-window widgets?

## Answer

1. **Host Architecture (`toolkit/demo/showcase`)**:
   - Built with React 18, TypeScript, and Vite, bundling static assets to `toolkit/dist/` for GitHub Pages.
   - **Header & Navigation**: Tabs for "Pokédex Demo", "Architecture & IPC" diagram, and "Feature Documentation", with live connection badges for all 5 frameworks.
   - **Pokédex Layout (`PokedexDemo.tsx`)**: Responsive 3-column split view with `#vue-catalog-container` (Vue 3), `#svelte-detail-container` (Svelte 5), and sandboxed iframes for Angular and Solid.
   - **Collidor DevTools Dock (`DevToolsDock.tsx`)**: Expandable monitor logging all events, commands, and port handshakes in real time with payload inspection, category filtering, and quick dispatch simulators.
   - **Interactive Documentation (`DocViewer.tsx`)**: Comprehensive guides and interactive examples for all 7 `@collidor/*` packages with live "Execute in Bus" buttons.
2. **Verification**: Successfully compiled with TypeScript and bundled with Vite in 1.91s with 0 errors.
