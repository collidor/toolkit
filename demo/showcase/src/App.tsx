import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { PokedexDemo } from "./components/PokedexDemo";
import { ArchitectureView } from "./components/ArchitectureView";
import { DocViewer } from "./components/DocViewer";
import { DevToolsDock } from "./components/DevToolsDock";
import { busService } from "./services/busService";
import { ThemeChangedEvent } from "@demo/shared";

export const App: React.FC = () => {
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
    <HashRouter>
      <div className="min-h-screen flex flex-col pb-14 transition-colors duration-200">
        {/* Top Header */}
        <Header
          isAngularConnected={isAngularConnected}
          isSolidConnected={isSolidConnected}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main View Area with Documentation as Entry Point */}
        <main className="flex-1 px-4 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/docs" replace />} />
            <Route path="/docs" element={<DocViewer />} />
            <Route path="/docs/:sectionId" element={<DocViewer />} />
            <Route path="/docs/:sectionId/:exampleId" element={<DocViewer />} />
            <Route
              path="/demo"
              element={
                <PokedexDemo
                  onAngularConnectedChange={setIsAngularConnected}
                  onSolidConnectedChange={setIsSolidConnected}
                />
              }
            />
            <Route path="/architecture" element={<ArchitectureView />} />
            <Route path="*" element={<Navigate to="/docs" replace />} />
          </Routes>
        </main>

        {/* Collidor DevTools Event Monitor Dock */}
        <DevToolsDock />
      </div>
    </HashRouter>
  );
};
export default App;
