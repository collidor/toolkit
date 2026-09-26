import React, { useState, useEffect } from "react";
import { Header, NavTab } from "./components/Header";
import { PokedexDemo } from "./components/PokedexDemo";
import { ArchitectureView } from "./components/ArchitectureView";
import { DocViewer } from "./components/DocViewer";
import { DevToolsDock } from "./components/DevToolsDock";
import { busService } from "./services/busService";
import { ThemeChangedEvent } from "@demo/shared";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("demo");
  const [isAngularConnected, setIsAngularConnected] = useState(false);
  const [isSolidConnected, setIsSolidConnected] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("collidor:theme") as "dark" | "light";
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("collidor:theme", theme);

    // Broadcast ThemeChangedEvent over EventBus (flows across PortChannel to iframes)
    busService.eventBus.emit(new ThemeChangedEvent({ theme }));
    busService.logTelemetry("event", "ThemeChangedEvent", "Host/Shell", { theme });

    // Direct postMessage to any active iframes to guarantee instant synchronization
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        f.contentWindow?.postMessage({ type: "COLLIDOR_SET_THEME", theme }, "*");
      } catch {
        // ignore
      }
    });
  }, [theme]);

  // Re-broadcast theme when either iframe completes connection
  useEffect(() => {
    if (isAngularConnected || isSolidConnected) {
      busService.eventBus.emit(new ThemeChangedEvent({ theme }));
      document.querySelectorAll("iframe").forEach((f) => {
        try {
          f.contentWindow?.postMessage({ type: "COLLIDOR_SET_THEME", theme }, "*");
        } catch {
          // ignore
        }
      });
    }
  }, [isAngularConnected, isSolidConnected, theme]);

  return (
    <div className="min-h-screen flex flex-col pb-14 transition-colors duration-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAngularConnected={isAngularConnected}
        isSolidConnected={isSolidConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 lg:px-8">
        {activeTab === "demo" && (
          <PokedexDemo
            onAngularConnectedChange={setIsAngularConnected}
            onSolidConnectedChange={setIsSolidConnected}
          />
        )}
        {activeTab === "architecture" && <ArchitectureView />}
        {activeTab === "docs" && <DocViewer />}
      </main>

      {/* Collidor DevTools Event Monitor Dock */}
      <DevToolsDock />
    </div>
  );
};
export default App;
