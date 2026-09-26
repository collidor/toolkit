# 07 - Prototype Angular + Analog Iframe Team Builder Widget with SchemaCommand and Injector

Type: prototype
Status: resolved
Blocked by: none (02, 03, 04 resolved)

## Question

How should the Angular (with Analog/Vite) team builder application run within a sandboxed iframe, subscribe to Pokémon selections via `PortChannel`, validate team size and constraints with `SchemaCommand` (Zod), and manage dependencies using `@collidor/injector`?

## Answer

1. **Angular Standalone + Analog Architecture (`toolkit/demo/angular`)**:
   - Configured with `@analogjs/vite-plugin-angular` and Vite 6 in client-only zoneless mode (`provideExperimentalZonelessChangeDetection()`).
   - Uses `base: './'` in `vite.config.ts` and `<base href="./">` in `index.html`, compiling statically to `dist/angular/` for path-agnostic iframe embedding.
2. **Cross-Realm IPC & Toolkit Integration**:
   - `TeamService` instantiates a local `PortChannelPlugin`, `EventBus`, `AsyncCommandBus`, and `@collidor/injector`.
   - On load, executes `initializeIframePort()`, which initiates the zero-race `COLLIDOR_IFRAME_READY` $\leftrightarrow$ `COLLIDOR_PORT_INIT` handshake with the host, receiving a dedicated `MessagePort`.
   - Updates its reactive party roster using Angular signals upon receiving `TeamUpdatedEvent`.
   - Dispatches `AddTeamMemberSchemaCommand` (Zod validation for max 6 members and valid move sets) and `RemoveTeamMemberCommand`.
3. **Verification**:
   - Compiled with TypeScript and Vite into `toolkit/dist/angular/index.html` and bundled assets in 8.32s with 0 errors.
