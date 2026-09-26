# 06 - Prototype Same-Window Mounting for Vue Catalog and Svelte Detail Widgets

Type: prototype
Status: resolved
Blocked by: none (05 resolved)

## Question

How should the Vue 3 Pokémon catalog widget and Svelte 5 Pokémon detail/evolution inspector be mounted into their respective host DOM containers, directly injecting and sharing in-memory `CommandBus`, `EventBus`, and `Result` instances across framework boundaries without iframes?

## Answer

1. **Direct Lifecycle Mounting**:
   - Implemented `mountVueCatalog(container, busService)` in `src/widgets/vue/mountVueCatalog.ts` using Vue 3's `createApp(PokemonCatalog, { busService }).mount(container)`.
   - Implemented `mountSvelteInspector(container, busService)` in `src/widgets/svelte/mountSvelteInspector.ts` using `new PokemonInspector({ target: container, props: { busService } })`.
   - Both widgets are mounted directly into `#vue-catalog-container` and `#svelte-detail-container` via React's `useEffect` in `PokedexDemo.tsx`.
2. **In-Memory Bus Sharing & Zero-Latency IPC**:
   - **Vue 3 Catalog**: Queries `FetchPokemonListCommand` on the in-memory `CommandBus`, listens to `FilterChangedEvent`, and emits `PokemonSelectedEvent` when a card is clicked.
   - **Svelte Inspector**: Listens to `PokemonSelectedEvent`, dispatches `FetchPokemonDetailCommand`, wraps output in `@collidor/result` (`Result.isResult`), displays dynamic animated stat bars and Showdown GIFs, and provides an "+ Add to Team" button executing `AddTeamMemberSchemaCommand`.
3. **Verification**:
   - Unified multi-framework Vite build compiles React + Vue 3 + Svelte into `toolkit/dist/` in 1.71s with 0 errors.
