import React, { useState, useEffect } from "react";
import { busService } from "../services/busService";
import {
  FetchPokemonDetailCommand,
  AddTeamMemberSchemaCommand,
  DeployToBattleCommand,
  PokemonSelectedEvent,
  SEED_POKEMON_LIST,
  TelemetryCategory,
  TelemetryEntry,
} from "@demo/shared";

export const DevToolsDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<TelemetryEntry[]>([]);
  const [filter, setFilter] = useState<TelemetryCategory | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<TelemetryEntry | null>(null);
  const [angularAvailable, setAngularAvailable] = useState(
    busService.isCommandAvailable(AddTeamMemberSchemaCommand)
  );
  const [solidAvailable, setSolidAvailable] = useState(
    busService.isCommandAvailable(DeployToBattleCommand)
  );

  useEffect(() => {
    // Initial logs
    setLogs(busService.getTelemetryLogs());

    // Subscribe to new real-time logs
    const unsubscribeLogs = busService.subscribeTelemetry((entry) => {
      setLogs((prev) => [entry, ...prev.slice(0, 99)]);
    });

    // Subscribe to real-time CommandBus availability changes
    const unsubAngular = busService.onAvailabilityChange(
      AddTeamMemberSchemaCommand,
      (avail: boolean) => setAngularAvailable(avail)
    );
    const unsubSolid = busService.onAvailabilityChange(
      DeployToBattleCommand,
      (avail: boolean) => setSolidAvailable(avail)
    );

    return () => {
      unsubscribeLogs();
      unsubAngular();
      unsubSolid();
    };
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.category === filter);

  const simulateSelectPikachu = () => {
    const pikachu = SEED_POKEMON_LIST.find((p) => p.name === "pikachu")!;
    busService.eventBus.emit(new PokemonSelectedEvent(pikachu));
  };

  const simulateSelectGengar = () => {
    const gengar = SEED_POKEMON_LIST.find((p) => p.name === "gengar")!;
    busService.eventBus.emit(new PokemonSelectedEvent(gengar));
  };

  const simulateFetchDetail = async () => {
    await busService.commandBus.execute(new FetchPokemonDetailCommand({ idOrName: "mewtwo" }));
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-t border-white/10 ${
        isOpen ? "h-96" : "h-10"
      } bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col`}
    >
      {/* Dock Bar / Handle */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-slate-900/60 select-none cursor-pointer"
           onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Collidor DevTools & Event Monitor
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-400 font-mono">
            {logs.length} events logged
          </span>

          {/* Active Command Handlers Live Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono border-l border-white/10 pl-3">
            <span className="text-slate-500 font-sans font-medium">Handlers:</span>
            <span
              className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 transition-colors ${
                angularAvailable
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
              title={angularAvailable ? "AddTeamMemberSchemaCommand is registered" : "Angular is unmounted - handler cleared"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${angularAvailable ? "bg-emerald-400" : "bg-rose-400"}`} />
              Angular {angularAvailable ? "Registered" : "Cleared"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 transition-colors ${
                solidAvailable
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
              title={solidAvailable ? "DeployToBattleCommand is registered" : "Solid.js is unmounted - handler cleared"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${solidAvailable ? "bg-emerald-400" : "bg-rose-400"}`} />
              Solid.js {solidAvailable ? "Registered" : "Cleared"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {/* Quick simulation buttons */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <button
              onClick={simulateSelectPikachu}
              className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition text-[11px] font-semibold"
            >
              + Select Pikachu
            </button>
            <button
              onClick={simulateSelectGengar}
              className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition text-[11px] font-semibold"
            >
              + Select Gengar
            </button>
            <button
              onClick={simulateFetchDetail}
              className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition text-[11px] font-semibold"
            >
              + Fetch Mewtwo
            </button>
          </div>

          <button
            onClick={() => busService.clearTelemetry()}
            className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-white/5"
          >
            Clear
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
          >
            {isOpen ? "▼ Minimize" : "▲ Expand Monitor"}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Feed list */}
          <div className="w-full md:w-3/5 border-r border-white/5 flex flex-col h-full">
            {/* Filter Toolbar & Command Status Bar */}
            <div className="p-2 border-b border-white/5 bg-slate-900/40 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold px-2">Filter:</span>
                {(["all", "command", "event", "port"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider transition ${
                      filter === cat
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Handlers status in expanded view */}
              <div className="flex items-center gap-2 text-[11px] font-mono px-2">
                <span className="text-slate-400 text-[10px] hidden sm:inline">Registry State:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${angularAvailable ? "bg-emerald-950/80 text-emerald-300 border border-emerald-600/40" : "bg-rose-950/80 text-rose-300 border border-rose-600/40"}`}>
                  Angular: {angularAvailable ? "● Registered" : "○ Cleared"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${solidAvailable ? "bg-emerald-950/80 text-emerald-300 border border-emerald-600/40" : "bg-rose-950/80 text-rose-300 border border-rose-600/40"}`}>
                  Solid: {solidAvailable ? "● Registered" : "○ Cleared"}
                </span>
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No events captured yet. Click a Pokémon in the catalog or use the simulate buttons above.
                </div>
              ) : (
                filteredLogs.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-2 rounded-lg cursor-pointer transition border flex items-center justify-between gap-3 ${
                      selectedEntry?.id === entry.id
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-200"
                        : "bg-slate-900/40 hover:bg-slate-900 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          entry.category === "command"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : entry.category === "event"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {entry.category}
                      </span>
                      <span className="font-semibold truncate">{entry.name}</span>
                      <span className="text-[11px] text-slate-500 truncate">
                        [{entry.origin}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500">
                      {entry.durationMs !== undefined && (
                        <span className="text-amber-400/80">
                          {entry.durationMs.toFixed(1)}ms
                        </span>
                      )}
                      <span>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Payload Inspector */}
          <div className="w-full md:w-2/5 flex flex-col bg-slate-950 p-3 overflow-hidden">
            <div className="text-xs font-bold text-slate-400 border-b border-white/10 pb-2 mb-2 flex items-center justify-between">
              <span>Inspect Payload</span>
              {selectedEntry && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedEntry.name}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto rounded-lg bg-slate-900/60 p-3 border border-white/5 font-mono text-[11px] text-slate-300">
              {selectedEntry ? (
                <div>
                  <div className="mb-2 text-slate-400">
                    <span className="text-rose-400 font-semibold">Origin:</span> {selectedEntry.origin}
                  </div>
                  <div className="mb-2 text-slate-400">
                    <span className="text-rose-400 font-semibold">Status:</span> {selectedEntry.success ? "Success" : "Failed"}
                  </div>
                  <div className="mb-2 text-slate-400">
                    <span className="text-rose-400 font-semibold">Payload:</span>
                    <pre className="mt-1 text-slate-200 overflow-x-auto">
                      {JSON.stringify(selectedEntry.payload, null, 2)}
                    </pre>
                  </div>
                  {selectedEntry.result && (
                    <div className="mt-3 text-slate-400">
                      <span className="text-blue-400 font-semibold">Result / Output:</span>
                      <pre className="mt-1 text-slate-200 overflow-x-auto">
                        {JSON.stringify(selectedEntry.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  Select any event or command log on the left to inspect its full payload and response.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
