# 08 - Prototype Solid Iframe Battle Simulator with Observable Buses

Type: prototype
Status: resolved
Blocked by: none (03, 04 resolved)

## Question

How should the Solid.js battle simulator application run within an iframe, connect to the host via `PortChannel` and `PortChannelPlugin`, and execute streaming battle rounds using `@collidor/observable-command` and `@collidor/observable-event` with RxJS streams driving animations?

## Answer

1. **Solid.js Standalone Sub-App (`toolkit/demo/solid`)**:
   - Built with Solid.js 1.9, Vite 5, and `vite-plugin-solid`.
   - Uses `base: './'` in `vite.config.ts`, outputting statically to `dist/solid/` for sandboxed iframe embedding.
2. **Observable Reactive Buses & Battle Animation Streams**:
   - [`battleEngine.ts`](file:///c:/Users/alyka/projects/collidor/toolkit/demo/solid/src/services/battleEngine.ts):
     - Instantiates `ObservableEventBus` and `ObservableCommandBus` backed by `PortChannelPlugin`.
     - Executes `initializeIframePort()` to bind the transferred `MessagePort` from the host shell.
     - Bridges `ObservableEventBus.on(PokemonSelectedEvent)` to dynamically update the active player combatant when selections occur anywhere in the Pokédex.
     - Drives combat round calculations and damage formulas, emitting events through an RxJS `roundStream$` Observable.
3. **Reactive Arena UI (`App.tsx`)**:
   - Subscribes to `roundStream$` to trigger animated sprite shakes, critical hit banners, health bar transitions, and turn commentary logs.
   - Provides 4 move buttons, rematch controls, and live `⚡ PortChannel Live` status.
4. **Verification**:
   - Compiled with TypeScript and Vite into `toolkit/dist/solid/index.html` in 2.15s with 0 errors.
