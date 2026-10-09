import type { PortChannel } from "@collidor/event";

export interface IframeConnectionOptions {
  iframe: HTMLIFrameElement;
  channel?: PortChannel<any>;
  name?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function applyThemeToDocument(theme: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  const isLight =
    theme === "light" ||
    theme === "neumorphic" ||
    theme === "troy-strategy" ||
    theme === "rpg-parchment";
  document.documentElement.classList.toggle("light", isLight);
  document.documentElement.classList.toggle("dark", !isLight);

  if (document.body) {
    if (theme === "neumorphic") {
      document.body.style.backgroundColor = "oklch(0.92 0.008 260)";
      document.body.style.color = "oklch(0.18 0.025 260)";
    } else if (theme === "rpg-parchment") {
      document.body.style.backgroundColor = "oklch(0.94 0.02 85)";
      document.body.style.color = "oklch(0.24 0.04 45)";
    } else if (theme === "troy-strategy") {
      document.body.style.backgroundColor = "oklch(0.91 0.038 78)";
      document.body.style.color = "oklch(0.18 0.04 45)";
    } else if (theme === "jewel" || theme === "jewel-artnouveau") {
      document.body.style.backgroundColor = "#14181a";
      document.body.style.color = "#fff4dd";
    } else {
      document.body.style.backgroundColor = "#090d16";
      document.body.style.color = "#f8fafc";
    }
  }
}

let cachedHostSessionId: string | null = null;

/**
 * Returns a unique session ID for the host window instance.
 * Generates an ID unique to this tab/window instance so different browser tabs
 * have isolated BroadcastChannels and don't conflict with each other.
 */
export function getHostSessionId(): string {
  if (cachedHostSessionId) return cachedHostSessionId;
  if (typeof window !== "undefined") {
    const rand = Math.random().toString(36).substring(2, 8);
    cachedHostSessionId = `collidor-demo-${Date.now().toString(36)}-${rand}`;
  } else {
    cachedHostSessionId = "collidor-demo-default";
  }
  return cachedHostSessionId;
}

/**
 * Reads the channel ID for an iframe:
 * 1. URL search parameter (?channelId=... or ?channel=...)
 * 2. window.name (set on the iframe tag)
 * 3. Fallback to host session ID or default
 */
export function getIframeChannelId(): string {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get("channelId") || params.get("channel");
      if (urlId) return urlId;
    } catch {
      // ignore
    }

    if (window.name && window.name.startsWith("collidor-demo-")) {
      return window.name;
    }
  }
  return getHostSessionId();
}

/**
 * Broadcasts a theme update message to all iframes sharing this BroadcastChannel
 * and applies it locally.
 */
export function broadcastTheme(channelId: string, theme: string): void {
  applyThemeToDocument(theme);
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel(channelId);
      bc.postMessage({ type: "COLLIDOR_SET_THEME", theme });
      bc.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Host-side helper: Connects the host's PortChannel to the scoped BroadcastChannel.
 * Also monitors the iframe element and provides cleanup.
 */
export function connectIframePort(options: IframeConnectionOptions): () => void {
  const { iframe, name, onConnected, onDisconnected } = options;
  const channelId = getHostSessionId();

  const sendInitTheme = () => {
    try {
      if (iframe.contentWindow) {
        const currentTheme =
          (typeof document !== "undefined" &&
            document.documentElement.getAttribute("data-theme")) ||
          "dark";
        iframe.contentWindow.postMessage(
          {
            type: "COLLIDOR_PORT_INIT",
            channelId,
            theme: currentTheme,
            name: name ?? "iframe-widget",
          },
          "*"
        );
      }
    } catch {
      // ignore cross-origin or unmounted
    }
  };

  iframe.addEventListener("load", sendInitTheme);
  sendInitTheme();
  onConnected?.();

  return () => {
    iframe.removeEventListener("load", sendInitTheme);
    onDisconnected?.();
  };
}

/**
 * Iframe-side helper: Connects the iframe's PortChannel to the scoped BroadcastChannel
 * matching the channel ID provided by the host.
 */
export function initializeIframePort(
  channel: PortChannel<any>,
  options?: { channelId?: string; maxRetries?: number; intervalMs?: number }
): Promise<MessagePort> {
  const channelId = options?.channelId || getIframeChannelId();

  // Create scoped BroadcastChannel
  const bc = new BroadcastChannel(channelId);

  // Apply initial theme from URL search params if present
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const theme = params.get("theme");
      if (theme) {
        applyThemeToDocument(theme);
      }
    } catch {
      // ignore
    }

    // Direct window postMessage listener for theme or init
    window.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "COLLIDOR_SET_THEME" && e.data.theme) {
        applyThemeToDocument(e.data.theme);
      } else if (e.data?.type === "COLLIDOR_PORT_INIT" && e.data.theme) {
        applyThemeToDocument(e.data.theme);
      }
    });
  }

  // BroadcastChannel message listener for theme broadcasts
  bc.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "COLLIDOR_SET_THEME" && e.data.theme) {
      applyThemeToDocument(e.data.theme);
    }
  });

  // Attach the BroadcastChannel to the local PortChannel (acts as MessagePortLike)
  channel.addPort(bc as unknown as MessagePort);

  return Promise.resolve(bc as unknown as MessagePort);
}
