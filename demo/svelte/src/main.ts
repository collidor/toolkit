import { EventBus } from "@collidor/event";
import { AsyncCommandBus, PortChannelPlugin } from "@collidor/command";
import { initializeIframePort } from "@demo/shared";
import App from "./App.svelte";

const portPlugin = new PortChannelPlugin({
  commandTimeout: 10000,
  ackTimeout: 5000,
});

const eventBus = new EventBus({ channel: portPlugin });
const commandBus = new AsyncCommandBus({ plugin: portPlugin });

// Bridge for command availability and telemetry
const busService = {
  eventBus,
  commandBus,
  portPlugin,
  isCommandAvailable: (cmd: any) => {
    const name = typeof cmd === "string" ? cmd : cmd?.name;
    return !!(name && commandBus.handlers.has(name));
  },
  onAvailabilityChange: (cmd: any, listener: (avail: boolean) => void) => {
    // Initial true assume host routes commands
    listener(true);
    return () => {};
  },
  logTelemetry: (
    category: string,
    name: string,
    origin: string,
    payload: any,
    result?: any,
    durationMs?: number,
    success = true
  ) => {
    eventBus.emit({
      name: "TelemetryLoggedEvent",
      data: {
        id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        category,
        name,
        origin,
        payload,
        result,
        durationMs,
        success,
      },
    });
  },
};

initializeIframePort(portPlugin)
  .then(() => {
    console.log("[Svelte Widget] PortChannel successfully connected to Host");
  })
  .catch((err) => {
    console.warn("[Svelte Widget] Standalone or connection timeout:", err);
  });

const app = new App({
  target: document.getElementById("app")!,
  props: {
    busService,
  },
});

export default app;
