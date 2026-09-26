# 03 - Research Cross-Frame PortChannel Handshake and Buffering

Type: research
Status: resolved
Blocked by: none

## Question

How should `@collidor/event`'s `PortChannel` and `@collidor/command`'s `PortChannelPlugin` establish bi-directional `MessagePortLike` communication between the Host window and sandboxed `<iframe>`s (Angular and Solid), ensuring the handshake (`startEvent`, `subscribeEvent`) and event buffering work reliably without race conditions during iframe load?

## Answer

1. **Native `MessageChannel` Transfer over Point-to-Point Ports**: Avoid fragile `window.postMessage` broadcasts. Use an "Iframe Ready Announce $\to$ Host `MessageChannel` Transfer" handshake:
   - When the sandboxed iframe module loads, it pings the parent window with `{ type: 'COLLIDOR_IFRAME_READY' }`.
   - Host receives the ready ping, instantiates a `MessageChannel`, attaches `port1` to its `PortChannelPlugin`, and transfers `port2` via `iframe.contentWindow.postMessage({ type: 'COLLIDOR_PORT_INIT' }, '*', [messageChannel.port2])`.
   - Iframe attaches `port2` to its local `PortChannelPlugin`. Both sides execute `@collidor`'s internal `startEvent` $\leftrightarrow$ `subscribeEvent` handshake automatically.
2. **Pre-Registration to Eliminate Subscription Churn**: Register command handlers and event listeners on both Host and Iframes before calling `addPort()`, so the initial `startEvent` payload announces all listeners at connection time.
3. **Guard Cross-Frame Commands with `commandBus.waitFor()`**: Because `PortChannelPlugin` has an `ackTimeout` (default 500ms), cross-frame commands called during bootstrap must await `commandBus.waitFor(Command)` to avoid timeouts before the remote iframe has finished loading.
4. **Mesh Topology Support**: Because `PortChannel` accepts multiple ports (`Set<MessagePortLike>`), a direct `MessageChannel` can also be wired between Angular and Solid for zero-latency direct battle updates without burdening the host.
