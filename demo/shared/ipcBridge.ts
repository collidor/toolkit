import type { PortChannel } from "@collidor/event";

export interface IframeConnectionOptions {
  iframe: HTMLIFrameElement;
  channel: PortChannel<any>;
  name?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * Host-side helper: Listens for COLLIDOR_IFRAME_READY from a sandboxed iframe,
 * creates a dedicated MessageChannel, binds port1 to the host PortChannel,
 * and transfers port2 to the iframe.
 */
export function connectIframePort(options: IframeConnectionOptions): () => void {
  const { iframe, channel, name, onConnected, onDisconnected } = options;
  let activePort: MessagePort | null = null;
  let cleanupPort: (() => void) | null = null;
  let isHandshakeComplete = false;

  const handleWindowMessage = (event: MessageEvent) => {
    // Security check: Only accept messages originating from the target iframe contentWindow
    if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;

    if (event.data?.type === "COLLIDOR_IFRAME_READY") {
      if (isHandshakeComplete) return;
      isHandshakeComplete = true;

      // 1. Create dedicated point-to-point MessageChannel
      const messageChannel = new MessageChannel();
      activePort = messageChannel.port1;

      // 2. Attach port1 to the host PortChannel (initiates internal startEvent)
      cleanupPort = channel.addPort(activePort);

      const currentTheme = typeof document !== "undefined" && document.documentElement.classList.contains("light") ? "light" : "dark";

      // 3. Transfer port2 to the iframe window with initial theme
      iframe.contentWindow.postMessage(
        { type: "COLLIDOR_PORT_INIT", name: name ?? "iframe-widget", theme: currentTheme },
        "*",
        [messageChannel.port2],
      );

      onConnected?.();
    }
  };

  window.addEventListener("message", handleWindowMessage);

  return () => {
    window.removeEventListener("message", handleWindowMessage);
    if (cleanupPort) cleanupPort();
    if (activePort) {
      activePort.close();
      activePort = null;
    }
    onDisconnected?.();
  };
}

/**
 * Iframe-side helper: Broadcasts COLLIDOR_IFRAME_READY to parent until COLLIDOR_PORT_INIT
 * is received, then binds the transferred MessagePort to the iframe's PortChannel.
 */
export function initializeIframePort(
  channel: PortChannel<any>,
  options?: { maxRetries?: number; intervalMs?: number },
): Promise<MessagePort> {
  const maxRetries = options?.maxRetries ?? 50;
  const intervalMs = options?.intervalMs ?? 150;

  // Direct theme listener for immediate postMessage synchronization
  if (typeof window !== "undefined") {
    window.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "COLLIDOR_SET_THEME") {
        const theme = e.data.theme;
        document.documentElement.classList.toggle("light", theme === "light");
        document.documentElement.classList.toggle("dark", theme === "dark");
        if (document.body) {
          document.body.style.backgroundColor = theme === "light" ? "#f8fafc" : "#090d16";
          document.body.style.color = theme === "light" ? "#0f172a" : "#f8fafc";
        }
      }
    });
  }

  return new Promise<MessagePort>((resolve, reject) => {
    let attempts = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    const messageHandler = (event: MessageEvent) => {
      if (event.source !== window.parent) return;

      if (event.data?.type === "COLLIDOR_PORT_INIT" && event.ports?.[0]) {
        if (timer) clearInterval(timer);
        window.removeEventListener("message", messageHandler);

        // Apply theme sent by host
        if (event.data.theme) {
          document.documentElement.classList.toggle("light", event.data.theme === "light");
          document.documentElement.classList.toggle("dark", event.data.theme === "dark");
          if (document.body) {
            document.body.style.backgroundColor = event.data.theme === "light" ? "#f8fafc" : "#090d16";
            document.body.style.color = event.data.theme === "light" ? "#0f172a" : "#f8fafc";
          }
        }

        const port = event.ports[0];
        port.start();

        // Attach transferred port to local iframe PortChannel
        channel.addPort(port);
        resolve(port);
      }
    };

    window.addEventListener("message", messageHandler);

    const pingHost = () => {
      if (++attempts > maxRetries) {
        if (timer) clearInterval(timer);
        window.removeEventListener("message", messageHandler);
        reject(new Error("Timeout waiting for COLLIDOR_PORT_INIT from host"));
        return;
      }
      try {
        window.parent.postMessage({ type: "COLLIDOR_IFRAME_READY" }, "*");
      } catch {
        // window.parent access might fail if unmounted
      }
    };

    timer = setInterval(pingHost, intervalMs);
    pingHost();
  });
}
