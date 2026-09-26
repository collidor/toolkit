# 04 - Define Domain Contracts: Commands, Events, Schemas, and Result Types

Type: task
Status: resolved
Blocked by: none (01 resolved)

## Question

What is the precise TypeScript contract definitions for all Commands (`FetchPokemonListCommand`, `FetchPokemonDetailCommand`, `AddTeamMemberCommand`, `SimulateBattleCommand`), Events (`PokemonSelectedEvent`, `TeamUpdatedEvent`, `BattleRoundEvent`, `TelemetryLoggedEvent`), Zod validation schemas, and Result monad wrappers to be shared across all 5 framework widgets?

## Answer

1. **Shared Contract Architecture**: Established `toolkit/demo/shared/` containing:
   - `schemas.ts`: Zod schemas for Pokémon entities, moves, stats, team builder, battle simulation, and real-time telemetry.
   - `commands.ts`: Typed Command classes (`FetchPokemonListCommand`, `FetchPokemonDetailCommand`, `AddTeamMemberSchemaCommand` via `@collidor/schema-command`, `SimulateBattleRoundCommand`, `StartBattleCommand`).
   - `events.ts`: Typed Event classes (`PokemonSelectedEvent`, `PokemonInspectedEvent`, `TeamUpdatedEvent`, `BattleStateChangedEvent`, `BattleRoundEmittedEvent`, `TelemetryLoggedEvent`).
   - `seed.ts`: Instant offline seed data for Gen 1 Pokémon with official artwork and Showdown GIFs from jsDelivr CDN.
   - `pokedexClient.ts`: 3-tier cache (RAM $\to$ localStorage $\to$ seed) with singleflight request coalescing and Result monad wrappers.
   - `ipcBridge.ts`: Reusable, race-free `MessageChannel` bridge for host and sandboxed iframes.
2. **Verification**: Comprehensive automated test in `toolkit/demo/shared/contracts.test.ts` passed 100%, validating command dispatch, event pub/sub, schema validation, cache querying, and `Result.isResult` cross-realm checks.
