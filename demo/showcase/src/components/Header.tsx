import React from "react";

export type NavTab = "demo" | "architecture" | "docs";

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAngularConnected: boolean;
  isSolidConnected: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isAngularConnected,
  isSolidConnected,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 p-[2px] shadow-lg shadow-rose-900/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-rose-400 text-lg">
              C
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Collidor Toolkit
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                v0.2.3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-Framework IPC & Architecture Showcase
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => onTabChange("demo")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "demo"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            ⚡ Pokédex Demo
          </button>
          <button
            onClick={() => onTabChange("architecture")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "architecture"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            🧩 Architecture & IPC
          </button>
          <button
            onClick={() => onTabChange("docs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "docs"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            📚 Documentation
          </button>
        </nav>

        {/* Right Section: Status Indicators & Always-Visible Theme Switch */}
        <div className="flex items-center gap-3">
          {/* Active Framework Status Indicators (visible on xl screens) */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              React Shell
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Vue 3
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
              Svelte 5
            </span>
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                isAngularConnected
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-slate-800 border-white/10 text-slate-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAngularConnected ? "bg-red-400 animate-pulse" : "bg-slate-600"
                }`}
              ></span>
              Angular
            </span>
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                isSolidConnected
                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  : "bg-slate-800 border-white/10 text-slate-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSolidConnected ? "bg-cyan-400 animate-pulse" : "bg-slate-600"
                }`}
              ></span>
              Solid.js
            </span>
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]"
              title="Cache-First ServiceWorker intercepts and caches all PokéAPI & Sprite CDN requests"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              SW Cache Active
            </span>
          </div>

          {/* Theme Switch Toggle: ALWAYS VISIBLE */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 hover:border-white/30 text-xs font-semibold transition-all active:scale-95 shadow-md shadow-black/20"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`}
            aria-label="Toggle dark/light theme"
          >
            <span className="text-sm leading-none">{theme === "dark" ? "🌙" : "☀️"}</span>
            <span className="font-mono text-xs text-slate-200 capitalize">
              {theme}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
