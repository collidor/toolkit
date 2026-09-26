## Destination

A production-ready documentation and multi-framework Pokédex demonstration application in `@collidor/toolkit`, deploying statically to GitHub Pages, where React, Vue, Svelte, Angular (with Vite and Analog), and Solid run seamlessly together across same-window mounts and sandboxed iframes showcasing all core toolkit features (CommandBus, EventBus, PortChannel, Injector, Result, SchemaCommand, and Observable buses).

## Notes

- Domain: Micro-frontends, cross-context inter-process communication, type-safe messaging, Pokédex explorer.
- Relevant Skills: `wayfinder`, `domain-modeling`, `modern-web-guidance`, `codebase-design`.
- Standing Preferences:
  - Framework allocation: Host Shell (React) + Same-window mounts (Vue 3, Svelte 5) + Sandboxed Iframes (Angular via Analog/Vite, Solid.js).
  - Cross-context communication must use `@collidor/event` `PortChannel` and `@collidor/command` `PortChannelPlugin`.
  - Static build output deployable to GitHub Pages under sub-paths without server-side Node runtime.
  - Zero modification to core `@collidor/*` packages; build as showcase consumer in `toolkit/apps/showcase` or `toolkit/demo`.

## Decisions so far

- [01 - Research PokéAPI Endpoints, Schemas, and Caching Strategy](issues/01-research-pokeapi-contract.md): Established jsDelivr CDN deterministic URLs, normalized ~1KB Zod domain schemas, and a 3-tier cache-first strategy with pre-bundled 120KB Gen 1 seed JSON for zero-latency offline operation.
- [02 - Research Vite + Analog + Angular Standalone Sub-App Configuration](issues/02-research-vite-analog-setup.md): Configured `@analogjs/vite-plugin-angular` in client-only zoneless mode with `base: './'` outputting to `dist/angular/`.
- [03 - Research Cross-Frame PortChannel Handshake and Buffering](issues/03-research-cross-frame-portchannel.md): Standardized on an Iframe-Ready $\to$ Host-MessageChannel point-to-point handshake, pre-registering handlers before `addPort`, and guarding initial remote calls with `commandBus.waitFor()`.
- [04 - Define Domain Contracts: Commands, Events, Schemas, and Result Types](issues/04-define-domain-contracts.md): Created unified contracts in `toolkit/demo/shared/` covering all Commands, Events, Zod schemas, offline seed data, PokedexClient, and IPC bridges, verified via automated test suite.
- [05 - Prototype React Showcase Shell with DevTools Event Monitor and Doc Viewer](issues/05-prototype-react-shell.md): Implemented React 18 host shell in `toolkit/demo/showcase` with Pokédex demo grid, live Collidor DevTools dock, interactive 7-module documentation reader, and DOM containers for Vue and Svelte.
- [06 - Prototype Same-Window Mounting for Vue Catalog and Svelte Detail Widgets](issues/06-prototype-same-window-vue-svelte.md): Integrated Vue 3 and Svelte directly into the host DOM window via lifecycle hooks, sharing in-memory `CommandBus`, `EventBus`, and `Result` instances with 0ms latency.
- [07 - Prototype Angular + Analog Iframe Team Builder Widget with SchemaCommand and Injector](issues/07-prototype-angular-analog-iframe.md): Built standalone Angular 18 (Analog/Vite) team builder sub-app in `toolkit/demo/angular` compiling to `dist/angular/`, connecting via transferred MessagePort and enforcing Zod contracts via SchemaCommand.
- [08 - Prototype Solid Iframe Battle Simulator with Observable Buses](issues/08-prototype-solid-battle-simulator.md): Built standalone Solid.js battle simulator in `toolkit/demo/solid` compiling to `dist/solid/`, powered by ObservableEventBus and RxJS combat animation streams.
- [09 - Setup GitHub Pages Multi-App Build and Automated Deployment](issues/09-setup-github-pages-workflow.md): Added unified monorepo build script (`npm run build:demo`) across Angular, Solid, and Showcase, configured Tailwind CSS stylesheets, and created automated GitHub Pages deployment workflow (`.github/workflows/deploy-pages.yml`).
- [10 - Search and Paginate All Original 151 Pokémon](issues/10-search-pagination-gen1.md): Indexed all 151 original Pokémon (IDs 1-151) with canonical names and types, expanded PokedexClient with pagination and offline synthesis fallback, and added responsive Vue 3 pagination controls.
- [11 - Documentation Expansion, Result Capabilities, and Syntax-Highlighted Code Formatter](issues/11-documentation-result-syntax-highlighting.md): Integrated Prism.js syntax highlighting with custom dark theme, expanded Result documentation with 5 interactive multi-scenario examples (pipe, pipeAsync, chain, map, from, unwrap, combine, try), and added tabbed navigation across modules.

## Not yet specified

- **Battle Engine Complexity**: Depth of battle simulation algorithms, move power calculations, and animation timing in the Solid arena.
- **Offline Persistence & Caching**: Cache-first PokéAPI caching layer using browser Storage or Service Worker.
- **Deep-linking & Team Sharing**: URL hash state serialization for sharing custom Pokémon teams across iframe boundaries.

## Out of scope

- Backend server or dynamic server-side rendering (GitHub Pages is strictly static).
- User account authentication or external database persistence.
- Modifying underlying `@collidor/*` library code or publishing new library packages.
