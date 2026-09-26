# 01 - Research PokéAPI Endpoints, Schemas, and Caching Strategy

Type: research
Status: resolved
Blocked by: none

## Question

What exact PokéAPI endpoints, response schemas, sprite asset URLs, and client-side caching strategies should we establish to guarantee fast, reliable, zero-latency interactions in the demo without hitting public API rate limits on GitHub Pages?

## Answer

1. **Deterministic CDN Sprite URLs**: Use jsDelivr CDN (`cdn.jsdelivr.net/gh/PokeAPI/sprites@master/...`) for official-artwork PNGs and animated Showdown GIFs. These are derived deterministically from Pokémon ID without needing runtime API lookups.
2. **Normalized Domain Schemas**: Raw PokéAPI responses (~280 KB each) are pruned to ~1 KB normalized domain objects (`PokemonSummary`, `PokemonDetail`, `PokemonStats`, `PokemonMove`) validated with Zod.
3. **3-Tier Cache Strategy**: L1 in-memory map $\to$ L2 `localStorage` $\to$ L3 pre-bundled 120 KB static seed JSON for the first 151 Pokémon. This guarantees instant 0ms first-page loads and zero initial network requests.
4. **Rate-Limit & Request Coalescing**: Requests for the same ID coalesce into a single in-flight Promise with max 3 concurrent requests to protect against PokéAPI rate limiting.
