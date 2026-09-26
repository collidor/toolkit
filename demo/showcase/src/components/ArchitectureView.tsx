import React from "react";

export const ArchitectureView: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Overview Intro */}
      <div className="glass-panel p-6 border-l-4 border-rose-500">
        <h2 className="text-xl font-bold text-white mb-2">
          Multi-Framework Cross-Context Topology
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          The showcase unifies <strong>5 modern UI frameworks</strong> (React, Vue 3, Svelte 5, Angular with Analog/Vite, and Solid.js)
          operating simultaneously in two distinct execution environments: <strong>Same-Window In-Memory Mounts</strong> and <strong>Sandboxed Cross-Origin Iframes</strong>.
          Every component shares strict contracts through <code className="text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded">@collidor/toolkit</code>.
        </p>
      </div>

      {/* Visual Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Same-Window Realm */}
        <div className="glass-panel p-6 border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase rounded-bl-lg border-b border-l border-emerald-500/30">
            Window Realm 1: In-Memory Host
          </div>

          <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Same-Window Direct Mounts (Zero Latency)
          </h3>

          <div className="space-y-4">
            {/* React Shell */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 uppercase">React 18 Shell (Host)</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Orchestrator</span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Instantiates <code>CommandBus</code>, <code>EventBus</code>, <code>Injector</code>, and <code>PortChannelPlugin</code>.
                Hosts top-level filters, documentation reader, and real-time DevTools.
              </p>
            </div>

            {/* Direct Injection Arrows */}
            <div className="text-center text-xs font-mono text-emerald-400 flex items-center justify-center gap-2">
              <span>↓ Direct in-memory reference sharing (no serialization) ↓</span>
            </div>

            {/* Vue & Svelte boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 block mb-1">Vue 3 Catalog</span>
                <p className="text-[11px] text-slate-400">
                  Mounted directly into DOM container. Emits <code>PokemonSelectedEvent</code> on user click.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-orange-500/20">
                <span className="text-xs font-bold text-orange-400 block mb-1">Svelte 5 Inspector</span>
                <p className="text-[11px] text-slate-400">
                  Mounted in same DOM. Executes <code>FetchPokemonDetailCommand</code> and parses with <code>Result</code> monad.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Iframe Realm */}
        <div className="glass-panel p-6 border border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase rounded-bl-lg border-b border-l border-purple-500/30">
            Window Realm 2: Sandboxed Iframes
          </div>

          <h3 className="text-base font-bold text-purple-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            Cross-Context IPC via PortChannel & MessagePort
          </h3>

          <div className="space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 uppercase">PortChannel Protocol</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Point-to-Point</span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Uses <code>MessageChannel</code> transferred on handshake. Features buffering queues for messages sent before iframe connection.
              </p>
            </div>

            <div className="text-center text-xs font-mono text-purple-400 flex items-center justify-center gap-2">
              <span>↕ Bi-directional MessagePort transfer ↕</span>
            </div>

            {/* Angular & Solid boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-red-500/20">
                <span className="text-xs font-bold text-red-400 block mb-1">Angular + Analog</span>
                <p className="text-[11px] text-slate-400">
                  Runs in sandboxed iframe. Uses <code>SchemaCommand</code> (Zod validation) to manage team members.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/20">
                <span className="text-xs font-bold text-cyan-400 block mb-1">Solid.js Battle Sim</span>
                <p className="text-[11px] text-slate-400">
                  Runs in sandboxed iframe. Uses <code>ObservableCommandBus</code> &amp; <code>ObservableEventBus</code> (RxJS) for live combat animations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Matrix Table */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Collidor Toolkit Feature Implementation Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2.5 px-3">Toolkit Module</th>
                <th className="py-2.5 px-3">Primary Responsibility</th>
                <th className="py-2.5 px-3">Showcase Role</th>
                <th className="py-2.5 px-3">Framework Environment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-mono text-rose-400">@collidor/command</td>
                <td className="py-2.5 px-3">Type-safe command dispatch &amp; RPC</td>
                <td className="py-2.5 px-3">Catalog queries, battle commands, and remote calls</td>
                <td className="py-2.5 px-3"><span className="text-blue-400">React</span>, <span className="text-orange-400">Svelte</span>, <span className="text-cyan-400">Solid</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-rose-400">@collidor/event</td>
                <td className="py-2.5 px-3">Pub/sub messaging &amp; PortChannel bridge</td>
                <td className="py-2.5 px-3">Selection broadcasts, team updates, and iframe handshake</td>
                <td className="py-2.5 px-3"><span className="text-blue-400">React</span>, <span className="text-emerald-400">Vue</span>, <span className="text-red-400">Angular</span>, <span className="text-cyan-400">Solid</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-rose-400">@collidor/injector</td>
                <td className="py-2.5 px-3">Zero-dependency IoC container</td>
                <td className="py-2.5 px-3">Injecting buses &amp; Pokédex client into Angular services</td>
                <td className="py-2.5 px-3"><span className="text-red-400">Angular (Analog)</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-rose-400">@collidor/result</td>
                <td className="py-2.5 px-3">Realm-safe error handling monad</td>
                <td className="py-2.5 px-3">Safe response parsing across iframes (no instanceof bugs)</td>
                <td className="py-2.5 px-3">All 5 Frameworks</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-rose-400">@collidor/schema-command</td>
                <td className="py-2.5 px-3">Zod runtime contract validation</td>
                <td className="py-2.5 px-3">Validating team size, movesets, and boundary payloads</td>
                <td className="py-2.5 px-3"><span className="text-red-400">Angular (Analog)</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-rose-400">@collidor/observable-*</td>
                <td className="py-2.5 px-3">RxJS observable buses for commands &amp; events</td>
                <td className="py-2.5 px-3">Real-time battle combat animations &amp; turn streams</td>
                <td className="py-2.5 px-3"><span className="text-cyan-400">Solid.js</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
