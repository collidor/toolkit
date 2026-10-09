import React from "react";
import ReactDOM from "react-dom/client";
import { EventBus } from "@collidor/event";
import { AsyncCommandBus, PortChannelPlugin } from "@collidor/command";
import { initializeIframePort } from "@demo/shared";
import { App } from "./App";
import "./styles.css";

// Initialize PortChannel for cross-iframe communication
const portPlugin = new PortChannelPlugin({
  commandTimeout: 10000,
  ackTimeout: 5000,
});

const eventBus = new EventBus({ channel: portPlugin });
const commandBus = new AsyncCommandBus({ plugin: portPlugin });

function mount() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App eventBus={eventBus} commandBus={commandBus} />
    </React.StrictMode>
  );
}

// Establish connection with parent host window
initializeIframePort(portPlugin)
  .then(() => {
    console.log("[React Widget] PortChannel successfully connected to Host");
    mount();
  })
  .catch((err) => {
    console.warn("[React Widget] Standalone or connection timeout:", err);
    mount();
  });
