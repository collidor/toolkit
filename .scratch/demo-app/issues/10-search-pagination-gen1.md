# 10 - Search and Paginate All Original 151 Pokémon

Type: task
Status: resolved
Blocked by: none (01-09 resolved)

## Question

How should the Pokédex catalog and PokedexClient be structured to index, search, filter, and paginate all 151 original Generation 1 Pokémon with instant client-side performance, responsive Vue 3 pagination controls, and robust offline fallback?

## Answer

1. **Complete Gen 1 Dataset (`gen1Data.ts`)**:
   - Indexed all 151 original Pokémon (IDs 1-151) from Bulbasaur to Mew with canonical names, dual type arrays, and CDN artwork URLs (`raw.githubusercontent.com/PokeAPI/sprites`).
   - Packaged as `ALL_GEN1_SUMMARY_LIST` for zero-latency in-memory queries without hitting external rate limits.

2. **PokedexClient Enhancements (`pokedexClient.ts`)**:
   - Upgraded `getPokemonList` and added `getPokemonPage` supporting full text search, type filtering, page numbers, and page sizes.
   - Built 4-tier offline fallback in `getPokemonDetail`: if network/PokéAPI fails or times out, synthesizes a valid domain `PokemonDetail` from `GEN1_RAW_LIST` so any of the 151 Pokémon can be clicked, inspected in Svelte, added to Angular party, and battled in Solid offline.

3. **Vue 3 Catalog UI Pagination**:
   - Added responsive search input and type filter dropdown with live count (`X / 151 Pokémon`).
   - Added smooth pagination toolbar with previous/next controls, page numbers (e.g. 1-16), and auto-navigation to the target page when a Pokémon is selected from other widgets.
