import { Component, createSignal, createEffect, onCleanup, For, Show } from "solid-js";
import { battleEngine } from "./services/battleEngine";
import {
  PokemonSelectedEvent,
  SEED_POKEMON_LIST,
  ThemeChangedEvent,
} from "@demo/shared";
import type {
  BattleState,
  PokemonDetail,
  PokemonMove,
  Team,
} from "@demo/shared";

export const App: Component = () => {
  const [battleState, setBattleState] = createSignal<BattleState>(battleEngine.createInitialState());
  const [isConnected, setIsConnected] = createSignal(false);
  const [isAttacking, setIsAttacking] = createSignal(false);
  const [isCatching, setIsCatching] = createSignal(false);
  const [showTeamPicker, setShowTeamPicker] = createSignal(false);
  const [angularTeam, setAngularTeam] = createSignal<Team | null>(null);
  const [lastLog, setLastLog] = createSignal<string>("Battle ready! Choose an attack below.");
  const [theme, setTheme] = createSignal<"dark" | "light">(
    typeof document !== "undefined" && document.documentElement.classList.contains("light") ? "light" : "dark"
  );

  createEffect(() => {
    const unsubConnect = battleEngine.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Theme listener from ObservableEventBus and window message
    const themeSub = battleEngine.observableEventBus.on(ThemeChangedEvent).subscribe((ev: any) => {
      if (ev?.theme) {
        setTheme(ev.theme);
      }
    });

    const handleWindowMsg = (event: MessageEvent) => {
      if (event.data?.type === "COLLIDOR_SET_THEME" && event.data.theme) {
        setTheme(event.data.theme);
      }
    };
    window.addEventListener("message", handleWindowMsg);

    // Subscribe to RxJS stream for combat round updates
    const roundSub = battleEngine.roundStream$.subscribe((log) => {
      setLastLog(log.message);
      setIsAttacking(true);
      setTimeout(() => setIsAttacking(false), 500);
    });

    // Listen to Pokemon selection from Vue Catalog, Svelte Inspector, or Angular Team Builder
    const selectSub = battleEngine.observableEventBus.on(PokemonSelectedEvent).subscribe((pokemon: any) => {
      const full = SEED_POKEMON_LIST.find((p) => p.id === pokemon.id) ?? (pokemon as PokemonDetail);
      setBattleState(battleEngine.createInitialState(full));
      setLastLog(`Challenger ${full.name.toUpperCase()} stepped into the arena!`);
    });

    onCleanup(() => {
      unsubConnect();
      roundSub.unsubscribe();
      selectSub.unsubscribe();
      themeSub.unsubscribe();
      window.removeEventListener("message", handleWindowMsg);
    });
  });

  const handleUseMove = (move: PokemonMove) => {
    const current = battleState();
    if (current.status === "finished") return;

    const next = battleEngine.executeTurn(current, move);
    setBattleState(next);
  };

  const handleResetBattle = () => {
    const player = battleState().player?.pokemon;
    setBattleState(battleEngine.createInitialState(player));
    setLastLog("Arena reset. Select a move to attack!");
  };

  const handleInspectOpponent = () => {
    const opp = battleState().opponent?.pokemon;
    if (opp) {
      battleEngine.inspectPokemon(opp);
      setLastLog(`Inspecting opponent ${opp.name.toUpperCase()} in Svelte Inspector & Vue Catalog...`);
    }
  };

  const handleInspectPlayer = () => {
    const p = battleState().player?.pokemon;
    if (p) {
      battleEngine.inspectPokemon(p);
      setLastLog(`Inspecting ${p.name.toUpperCase()} in Svelte Inspector...`);
    }
  };

  const handleCatchOpponent = async () => {
    const opp = battleState().opponent?.pokemon;
    if (!opp || isCatching()) return;

    setIsCatching(true);
    setLastLog(`Throwing Pokéball at ${opp.name.toUpperCase()}...`);

    const res = await battleEngine.catchOpponent(opp);
    setIsCatching(false);
    setLastLog(res.message);
  };

  const handleOpenTeamPicker = async () => {
    const team = await battleEngine.fetchTeam();
    setAngularTeam(team);
    setShowTeamPicker(true);
  };

  const handleSelectTeammate = (pokemon: PokemonDetail) => {
    setBattleState(battleEngine.createInitialState(pokemon));
    setLastLog(`${pokemon.name.toUpperCase()} tagged into the arena from Angular Party!`);
    setShowTeamPicker(false);
  };

  const playerHpPct = () => {
    const p = battleState().player;
    if (!p) return 0;
    return Math.max(0, Math.min(100, Math.round((p.currentHp / p.maxHp) * 100)));
  };

  const opponentHpPct = () => {
    const opp = battleState().opponent;
    if (!opp) return 0;
    return Math.max(0, Math.min(100, Math.round((opp.currentHp / opp.maxHp) * 100)));
  };

  return (
    <div class={`h-full flex flex-col gap-2 p-3 font-sans select-none overflow-hidden relative solid-arena-root ${theme() === "light" ? "light bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"}`}>
      {/* Top Bar */}
      <div class="solid-topbar flex items-center justify-between border-b border-white/10 pb-2">
        <div>
          <h2 class="solid-title text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
            Solid.js Battle Arena
          </h2>
          <p class="solid-subtitle text-[10px] text-slate-400">Sandboxed Iframe &bull; RxJS Stream</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            onClick={handleOpenTeamPicker}
            class="solid-tag-btn px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/50 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
            title="Switch combatant to a Pokémon from the Angular Team"
          >
            🔄 Tag Teammate
          </button>
          <span
            class={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isConnected()
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
            }`}
          >
            {isConnected() ? "⚡ Port Live" : "Handshaking..."}
          </span>
        </div>
      </div>

      {/* Battle Stadium Canvas / Stage */}
      <div class="solid-stage flex-1 bg-gradient-to-b from-slate-900/90 to-slate-950 rounded-xl border border-white/5 p-3 flex flex-col justify-between relative overflow-hidden">
        {/* Opponent Row (Top Right) */}
        <div class="flex justify-end items-start gap-4">
          <div class="solid-card bg-slate-900/80 border border-white/10 p-2 rounded-lg min-w-[150px] shadow">
            <div class="flex justify-between items-baseline text-[11px] font-bold">
              <span class="solid-card-name capitalize text-slate-200">{battleState().opponent?.pokemon.name}</span>
              <button
                onClick={handleInspectOpponent}
                class="solid-inspect-btn text-[9px] text-cyan-400 hover:text-white underline cursor-pointer"
                title="Inspect this Opponent in Svelte & Vue"
              >
                👁️ Inspect
              </button>
            </div>
            <div class="solid-hp-track w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                class={`h-full rounded-full transition-all duration-300 ${
                  opponentHpPct() > 50 ? "bg-emerald-400" : opponentHpPct() > 20 ? "bg-yellow-400" : "bg-rose-500"
                }`}
                style={{ width: `${opponentHpPct()}%` }}
              ></div>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="solid-hp-text text-[9px] font-mono text-slate-400">
                {battleState().opponent?.currentHp} / {battleState().opponent?.maxHp} HP
              </span>
              <Show when={opponentHpPct() <= 50 || battleState().status === "finished"}>
                <button
                  onClick={handleCatchOpponent}
                  disabled={isCatching()}
                  class="px-1.5 py-0.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                  title="Catch this opponent and send to Angular Party via SchemaCommand"
                >
                  🔴 Catch
                </button>
              </Show>
            </div>
          </div>

          <div
            onClick={handleInspectOpponent}
            class={`relative w-20 h-20 flex items-center justify-center transition-transform cursor-pointer ${
              isAttacking() ? "scale-90 opacity-75" : "hover:scale-105"
            }`}
            title="Click to inspect Opponent"
          >
            <img
              src={battleState().opponent?.pokemon.sprites.showdownFront}
              alt="Opponent"
              class="w-16 h-16 object-contain drop-shadow"
            />
          </div>
        </div>

        {/* Player Row (Bottom Left) */}
        <div class="flex justify-start items-end gap-4">
          <div
            onClick={handleInspectPlayer}
            class={`relative w-20 h-20 flex items-center justify-center transition-transform cursor-pointer ${
              isAttacking() ? "scale-110 translate-x-2" : "hover:scale-105"
            }`}
            title="Click to inspect Player"
          >
            <img
              src={battleState().player?.pokemon.sprites.showdownBack}
              alt="Player"
              class="w-16 h-16 object-contain drop-shadow"
            />
          </div>

          <div class="solid-card bg-slate-900/80 border border-white/10 p-2 rounded-lg min-w-[150px] shadow">
            <div class="flex justify-between items-baseline text-[11px] font-bold">
              <span class="solid-card-name capitalize text-cyan-300">{battleState().player?.pokemon.name}</span>
              <button
                onClick={handleInspectPlayer}
                class="solid-inspect-btn text-[9px] text-cyan-400 hover:text-white underline cursor-pointer"
                title="Inspect in Svelte & Vue"
              >
                👁️ Inspect
              </button>
            </div>
            <div class="solid-hp-track w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                class={`h-full rounded-full transition-all duration-300 ${
                  playerHpPct() > 50 ? "bg-emerald-400" : playerHpPct() > 20 ? "bg-yellow-400" : "bg-rose-500"
                }`}
                style={{ width: `${playerHpPct()}%` }}
              ></div>
            </div>
            <span class="solid-hp-text text-[9px] font-mono text-slate-400 text-right block mt-0.5">
              {battleState().player?.currentHp} / {battleState().player?.maxHp} HP
            </span>
          </div>
        </div>
      </div>

      {/* Battle Ticker / Commentary */}
      <div class="solid-ticker p-2 bg-slate-900/90 rounded-lg border border-white/5 text-[11px] font-mono text-cyan-200 min-h-[32px] flex items-center justify-between">
        <span class="truncate">{lastLog()}</span>
        <Show when={battleState().status === "finished"}>
          <button
            onClick={handleResetBattle}
            class="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded text-[10px] shrink-0 cursor-pointer"
          >
            Rematch
          </button>
        </Show>
      </div>

      {/* Action Moves (Command Execution Grid) */}
      <div class="grid grid-cols-2 gap-1.5">
        <For each={battleState().player?.pokemon.moves.slice(0, 4)}>
          {(move) => (
            <button
              onClick={() => handleUseMove(move)}
              disabled={battleState().status === "finished"}
              class="solid-move-btn p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-white/5 transition flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <span class="solid-move-name text-[11px] font-bold text-white capitalize block">{move.name}</span>
                <span class="solid-move-type text-[9px] text-slate-400 font-mono uppercase">{move.type}</span>
              </div>
              <span class="solid-move-pwr text-[10px] font-mono font-bold text-amber-400">{move.power || 40} PWR</span>
            </button>
          )}
        </For>
      </div>

      {/* Teammate Selector Modal / Overlay */}
      <Show when={showTeamPicker()}>
        <div class="solid-modal absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 p-4 flex flex-col justify-between rounded-xl">
          <div>
            <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <h3 class="solid-card-name text-xs font-bold text-cyan-300">Tag Teammate from Angular Party</h3>
              <button
                onClick={() => setShowTeamPicker(false)}
                class="text-xs text-slate-400 hover:text-white px-2 py-0.5 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p class="solid-subtitle text-[10px] text-slate-400 mb-2">
              Select a party member from your Angular roster to swap in:
            </p>
            <div class="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
              <For each={angularTeam()?.members}>
                {(member) => (
                  <button
                    onClick={() => handleSelectTeammate(member.pokemon)}
                    class="solid-modal-card p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-400 rounded-lg flex items-center gap-2 text-left cursor-pointer transition"
                  >
                    <img
                      src={member.pokemon.sprites.thumbnail}
                      alt={member.pokemon.name}
                      class="w-8 h-8 object-contain"
                    />
                    <div>
                      <span class="solid-card-name text-[11px] font-bold text-white capitalize block">
                        {member.nickname || member.pokemon.name}
                      </span>
                      <span class="solid-hp-text text-[9px] font-mono text-slate-400">Lv. {member.level}</span>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
          <button
            onClick={() => setShowTeamPicker(false)}
            class="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </Show>
    </div>
  );
};
