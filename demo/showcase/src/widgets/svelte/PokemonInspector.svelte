<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    FetchPokemonDetailCommand,
    FocusViewEvent,
    PokemonSelectedEvent,
    PokemonInspectedEvent,
    DeployToBattleCommand,
    SEED_POKEMON_LIST,
    AddTeamMemberSchemaCommand,
  } from "@demo/shared";
  import type { PokemonDetail } from "@demo/shared";
  import { Result } from "@collidor/result";

  export let busService: any;

  let currentPokemon: PokemonDetail = SEED_POKEMON_LIST[3]; // Pikachu default
  let isLoading = false;
  let statusMessage: string | null = null;
  let isErrorMessage = false;
  let isAngularAvailable = busService.isCommandAvailable(AddTeamMemberSchemaCommand);
  let isSolidAvailable = busService.isCommandAvailable(DeployToBattleCommand);
  let unsubs: Array<() => void> = [];

  onMount(() => {
    const handleLoadPokemon = async (pokemon: any) => {
      if (!pokemon?.id) return;
      isLoading = true;
      try {
        const res = await busService.commandBus.execute(
          new FetchPokemonDetailCommand({ idOrName: pokemon.id })
        );

        // Verify boundary-safe Result monad
        if (Result.isResult(res) && res.success) {
          currentPokemon = res.value;
        } else if (!res.success) {
          console.error("Failed to fetch detail:", res.error);
        }
      } catch (err) {
        console.error("Command execution error:", err);
      } finally {
        isLoading = false;
      }
    };

    // Listen for PokemonSelectedEvent and PokemonInspectedEvent
    const unsubSelect = busService.eventBus.on(PokemonSelectedEvent, handleLoadPokemon);
    const unsubInspect = busService.eventBus.on(PokemonInspectedEvent, handleLoadPokemon);

    // Listen to real-time CommandBus availability changes
    const unsubAvailAngular = busService.onAvailabilityChange(
      AddTeamMemberSchemaCommand,
      (avail: boolean) => {
        isAngularAvailable = avail;
      }
    );
    const unsubAvailSolid = busService.onAvailabilityChange(
      DeployToBattleCommand,
      (avail: boolean) => {
        isSolidAvailable = avail;
      }
    );

    unsubs.push(unsubSelect, unsubInspect, unsubAvailAngular, unsubAvailSolid);
  });

  onDestroy(() => {
    unsubs.forEach((u) => u());
  });

  async function handleAddToTeam() {
    if (!busService.isCommandAvailable(AddTeamMemberSchemaCommand)) {
      isErrorMessage = true;
      statusMessage = "⚠️ Command Unavailable: Angular Team Builder is unmounted (handler cleared). Switch tab to Angular to activate.";
      busService.logTelemetry(
        "command",
        "AddTeamMemberSchemaCommand",
        "Svelte-Inspector",
        { pokemon: currentPokemon.name },
        "REJECTED: No handler registered (Angular microfrontend unmounted)",
        0,
        false
      );
      setTimeout(() => {
        statusMessage = null;
        isErrorMessage = false;
      }, 4500);
      return;
    }

    isErrorMessage = false;
    statusMessage = "Adding to Angular Team via SchemaCommand...";
    try {
      const res = await busService.commandBus.execute(
        new AddTeamMemberSchemaCommand({
          pokemon: currentPokemon,
          level: 50,
        })
      );

      if (res.success) {
        statusMessage = `✓ ${currentPokemon.name} added to party!`;
      } else {
        isErrorMessage = true;
        statusMessage = `⚠ ${res.message}`;
      }
    } catch (err: any) {
      isErrorMessage = true;
      statusMessage = `⚠ Command Error: ${err.message || String(err)}`;
    }

    setTimeout(() => {
      statusMessage = null;
      isErrorMessage = false;
    }, 3000);
  }

  async function handleDeployToBattle() {
    if (!busService.isCommandAvailable(DeployToBattleCommand)) {
      isErrorMessage = true;
      statusMessage = "⚠️ Command Unavailable: Solid.js Battle Arena is unmounted (handler cleared). Switch tab to Solid.js to activate.";
      busService.logTelemetry(
        "command",
        "DeployToBattleCommand",
        "Svelte-Inspector",
        { pokemon: currentPokemon.name },
        "REJECTED: No handler registered (Solid.js microfrontend unmounted)",
        0,
        false
      );
      setTimeout(() => {
        statusMessage = null;
        isErrorMessage = false;
      }, 4500);
      return;
    }

    isErrorMessage = false;
    statusMessage = `Deploying ${currentPokemon.name} to Arena via CommandBus...`;
    try {
      const res = await busService.commandBus.execute(
        new DeployToBattleCommand({ pokemon: currentPokemon })
      );
      if (Result.isResult(res) && res.success) {
        statusMessage = `⚔️ ${currentPokemon.name} deployed to Battle Arena!`;
      } else {
        isErrorMessage = true;
        statusMessage = `⚠ Deploy failed: ${res?.error || "Unknown error"}`;
      }
    } catch (err: any) {
      isErrorMessage = true;
      statusMessage = `⚠ Command Error: ${err.message || String(err)}`;
    }

    setTimeout(() => {
      statusMessage = null;
      isErrorMessage = false;
    }, 3000);
  }
</script>

<div class="svelte-inspector-root flex flex-col h-full space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-white/5">
    <span class="font-bold text-orange-400 flex items-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-orange-400"></span>
      Svelte 5 Reactive Inspector
    </span>
    {#if isLoading}
      <span class="text-rose-400 text-[10px] animate-pulse">Loading via CommandBus...</span>
    {/if}
  </div>

  <!-- Hero Card -->
  <div class="bg-slate-900/60 rounded-xl p-4 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
    <!-- Action toast feedback -->
    {#if statusMessage}
      <div class="absolute top-2 left-2 right-2 {isErrorMessage ? 'bg-rose-600/95 text-white' : 'bg-emerald-600/95 text-white'} text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-lg z-20 animate-fade">
        {statusMessage}
      </div>
    {/if}

    <!-- Pokemon Artwork & Showdown sprite badge -->
    <div class="relative w-36 h-36 flex items-center justify-center mb-1">
      <div class="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent rounded-full filter blur-xl"></div>
      <img
        src={currentPokemon.sprites.artwork}
        alt={currentPokemon.name}
        class="w-32 h-32 object-contain relative z-10 drop-shadow-2xl"
      />
      <img
        src={currentPokemon.sprites.showdownFront}
        alt="{currentPokemon.name} showdown"
        class="absolute -bottom-1 -right-1 w-10 h-10 object-contain z-10 drop-shadow"
      />
    </div>

    <span class="text-xs font-mono text-slate-500">#{currentPokemon.id.toString().padStart(3, "0")}</span>
    <h3 class="text-lg font-extrabold text-white capitalize mb-0.5">{currentPokemon.name}</h3>
    <p class="text-xs text-slate-400 mb-2">{currentPokemon.species.genus}</p>

    <!-- Types -->
    <div class="flex items-center gap-1.5 mb-3">
      {#each currentPokemon.types as t}
        <span class="type-badge type-{t}">{t}</span>
      {/each}
    </div>

    <!-- Action Buttons Grid with Dynamic Command Availability Badges -->
    <div class="grid grid-cols-2 gap-2 w-full mb-3">
      <button
        on:click={handleAddToTeam}
        class="py-2 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-[11px] font-bold shadow-md shadow-orange-900/30 transition-all transform active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer relative"
        title="Send to Angular Team Builder via SchemaCommand (Available only when Angular tab is active)"
      >
        <span class="flex items-center gap-1">+ Add to Team</span>
        <span class="flex items-center gap-1 text-[9px] font-mono font-medium opacity-90">
          <span class="w-1.5 h-1.5 rounded-full {isAngularAvailable ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}"></span>
          <span>{isAngularAvailable ? 'Angular Ready' : 'Angular Unmounted'}</span>
        </span>
      </button>

      <button
        on:click={handleDeployToBattle}
        class="py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-[11px] font-bold shadow-md shadow-cyan-900/30 transition-all transform active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer relative"
        title="Deploy directly to Solid Battle Arena (Available only when Solid.js tab is active)"
      >
        <span class="flex items-center gap-1">⚔️ Deploy Arena</span>
        <span class="flex items-center gap-1 text-[9px] font-mono font-medium opacity-90">
          <span class="w-1.5 h-1.5 rounded-full {isSolidAvailable ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}"></span>
          <span>{isSolidAvailable ? 'Solid Ready' : 'Solid Unmounted'}</span>
        </span>
      </button>
    </div>

    <!-- Flavor Text -->
    <p class="text-xs text-slate-300 italic bg-slate-950/50 p-2.5 rounded-lg border border-white/5 text-left w-full mb-3">
      "{currentPokemon.species.flavorText}"
    </p>

    <!-- Stats Section -->
    <div class="w-full space-y-1.5 text-left font-mono text-[11px]">
      <div class="flex justify-between text-slate-400">
        <span>HP</span>
        <span class="font-bold text-white">{currentPokemon.stats.hp}</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div class="bg-emerald-400 h-full rounded-full transition-all duration-500" style="width: {Math.min(100, (currentPokemon.stats.hp / 150) * 100)}%"></div>
      </div>

      <div class="flex justify-between text-slate-400 pt-1">
        <span>Attack</span>
        <span class="font-bold text-white">{currentPokemon.stats.attack}</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div class="bg-rose-400 h-full rounded-full transition-all duration-500" style="width: {Math.min(100, (currentPokemon.stats.attack / 150) * 100)}%"></div>
      </div>

      <div class="flex justify-between text-slate-400 pt-1">
        <span>Defense</span>
        <span class="font-bold text-white">{currentPokemon.stats.defense}</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div class="bg-blue-400 h-full rounded-full transition-all duration-500" style="width: {Math.min(100, (currentPokemon.stats.defense / 150) * 100)}%"></div>
      </div>

      <div class="flex justify-between text-slate-400 pt-1">
        <span>Speed</span>
        <span class="font-bold text-white">{currentPokemon.stats.speed}</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div class="bg-amber-400 h-full rounded-full transition-all duration-500" style="width: {Math.min(100, (currentPokemon.stats.speed / 150) * 100)}%"></div>
      </div>
    </div>

    <!-- Moves List preview -->
    <div class="w-full mt-3 text-left">
      <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">Combat Moves</span>
      <div class="flex flex-wrap gap-1">
        {#each currentPokemon.moves.slice(0, 4) as m}
          <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
            {m.name}
          </span>
        {/each}
      </div>
    </div>
  </div>
</div>
