import React, { useState, useEffect, useRef } from "react";
import { busService } from "../services/busService";
import { mountVueCatalog } from "../widgets/vue/mountVueCatalog";
import { mountSvelteInspector } from "../widgets/svelte/mountSvelteInspector";
import {
  FilterChangedEvent,
  FocusViewEvent,
  PokemonType,
  PokemonTypeSchema,
} from "@demo/shared";

interface PokedexDemoProps {
  onAngularConnectedChange: (connected: boolean) => void;
  onSolidConnectedChange: (connected: boolean) => void;
}

export const PokedexDemo: React.FC<PokedexDemoProps> = ({
  onAngularConnectedChange,
  onSolidConnectedChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<PokemonType | undefined>();
  const [rightPanelTab, setRightPanelTab] = useState<"angular" | "solid">("angular");

  const vueContainerRef = useRef<HTMLDivElement>(null);
  const svelteContainerRef = useRef<HTMLDivElement>(null);
  const angularIframeRef = useRef<HTMLIFrameElement>(null);
  const solidIframeRef = useRef<HTMLIFrameElement>(null);

  // Subscribe to selection and focus events from anywhere in the system
  useEffect(() => {
    const unsubFocus = busService.eventBus.on(FocusViewEvent, (event) => {
      if (event.tab) {
        setRightPanelTab(event.tab);
      }
    });

    return () => {
      unsubFocus();
    };
  }, []);

  // Broadcast search filter changes
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    busService.eventBus.emit(
      new FilterChangedEvent({
        search: text,
        selectedType,
      })
    );
  };

  const handleTypeSelect = (type?: PokemonType) => {
    setSelectedType(type);
    busService.eventBus.emit(
      new FilterChangedEvent({
        search: searchTerm,
        selectedType: type,
      })
    );
  };

  // Wire active iframe to PortChannel and synchronize command handlers
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (rightPanelTab === "angular") {
      // Register Angular command handlers and unregister Solid handlers
      busService.registerAngularHandlers();
      busService.unregisterSolidHandlers();
      onSolidConnectedChange(false);

      if (angularIframeRef.current) {
        cleanup = busService.attachIframe(angularIframeRef.current, "Angular-Analog");
        onAngularConnectedChange(true);
      }
    } else if (rightPanelTab === "solid") {
      // Register Solid command handlers and unregister Angular handlers
      busService.registerSolidHandlers();
      busService.unregisterAngularHandlers();
      onAngularConnectedChange(false);

      if (solidIframeRef.current) {
        cleanup = busService.attachIframe(solidIframeRef.current, "Solid-Battle");
        onSolidConnectedChange(true);
      }
    }

    return () => {
      cleanup?.();
      if (rightPanelTab === "angular") {
        busService.unregisterAngularHandlers();
        onAngularConnectedChange(false);
      } else {
        busService.unregisterSolidHandlers();
        onSolidConnectedChange(false);
      }
    };
  }, [rightPanelTab, onAngularConnectedChange, onSolidConnectedChange]);

  // Mount same-window Vue and Svelte widgets directly into host DOM containers
  useEffect(() => {
    let unmountVue: (() => void) | undefined;
    let unmountSvelte: (() => void) | undefined;

    if (vueContainerRef.current) {
      unmountVue = mountVueCatalog(vueContainerRef.current, busService);
    }

    if (svelteContainerRef.current) {
      unmountSvelte = mountSvelteInspector(svelteContainerRef.current, busService);
    }

    return () => {
      unmountVue?.();
      unmountSvelte?.();
    };
  }, []);

  const allTypes = PokemonTypeSchema.options;

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Pokémon by name or #id..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Type pills filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1">
          <button
            onClick={() => handleTypeSelect(undefined)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition shrink-0 ${
              !selectedType
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            All Types
          </button>
          {allTypes.slice(0, 10).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeSelect(t)}
              className={`type-badge type-${t} shrink-0 cursor-pointer ${
                selectedType === t ? "ring-2 ring-white/80 scale-105" : "opacity-80 hover:opacity-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Panel 1: Vue 3 Catalog (Left Column: 4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 flex flex-col h-[700px] border border-emerald-500/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Vue 3 Catalog
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Same-Window DOM
            </span>
          </div>

          {/* Mount point for Vue 3 */}
          <div ref={vueContainerRef} id="vue-catalog-container" className="flex-1 overflow-hidden" />
        </div>

        {/* Panel 2: Svelte 5 Details (Middle Column: 4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 flex flex-col h-[700px] border border-orange-500/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                Svelte 5 Inspector
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
              Same-Window DOM
            </span>
          </div>

          {/* Mount point for Svelte 5 */}
          <div ref={svelteContainerRef} id="svelte-detail-container" className="flex-1 overflow-hidden" />
        </div>

        {/* Panel 3: Iframes Realm (Angular + Solid: Right Column 4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 flex flex-col h-[700px] border border-purple-500/20">
          {/* Iframe View Switcher */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => setRightPanelTab("angular")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                  rightPanelTab === "angular"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                Angular Team Builder
              </button>
              <button
                onClick={() => setRightPanelTab("solid")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                  rightPanelTab === "solid"
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                Solid.js Battle Arena
              </button>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-mono font-semibold">
              Sandboxed Iframe
            </span>
          </div>

          {/* Iframe Containers — Inactive tab is completely unmounted from the DOM */}
          <div className="flex-1 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 relative">
            {rightPanelTab === "angular" ? (
              <iframe
                key="angular-iframe"
                ref={angularIframeRef}
                src="./angular/index.html"
                title="Angular Team Builder Sub-App"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <iframe
                key="solid-iframe"
                ref={solidIframeRef}
                src="./solid/index.html"
                title="Solid Battle Arena Sub-App"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
