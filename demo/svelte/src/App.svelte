<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    FetchPokemonDetailCommand,
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
  let unsubs: Array<() => void> = [];

  onMount(() => {
    const handleLoadPokemon = async (pokemon: any) => {
      if (!pokemon?.id) return;
      isLoading = true;
      try {
        const res = await busService.commandBus.execute(
          new FetchPokemonDetailCommand({ idOrName: pokemon.id })
        );

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

    const unsubSelect = busService.eventBus.on(PokemonSelectedEvent, handleLoadPokemon);
    const unsubInspect = busService.eventBus.on(PokemonInspectedEvent, handleLoadPokemon);

    unsubs.push(unsubSelect, unsubInspect);
  });

  onDestroy(() => {
    unsubs.forEach((u) => u());
  });

  async function handleAddToTeam() {
    isErrorMessage = false;
    statusMessage = "Adding to Angular Team via SchemaCommand...";
    try {
      const res = await busService.commandBus.execute(
        new AddTeamMemberSchemaCommand({
          pokemon: currentPokemon,
          level: 50,
        })
      );

      if (res && res.success) {
        statusMessage = `✓ ${currentPokemon.name} added to party!`;
      } else {
        isErrorMessage = true;
        statusMessage = `⚠ ${res?.message || "Failed to add to team"}`;
      }
    } catch (err: any) {
      isErrorMessage = true;
      statusMessage = `⚠ Command Error: ${err.message || String(err)}`;
    }

    setTimeout(() => {
      statusMessage = null;
      isErrorMessage = false;
    }, 3500);
  }

  async function handleDeployToBattle() {
    isErrorMessage = false;
    statusMessage = `Deploying ${currentPokemon.name} to Battle Arena...`;
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
    }, 3500);
  }
</script>

<div class="svelte-root">
  <!-- Top bar -->
  <div class="header-bar">
    <span class="title">
      <span class="dot"></span>
      Svelte 5 Reactive Inspector
    </span>
    {#if isLoading}
      <span class="loading-tag">Loading via CommandBus...</span>
    {/if}
  </div>

  <!-- Hero Card -->
  <div class="hero-card">
    {#if statusMessage}
      <div class="toast {isErrorMessage ? 'toast-err' : 'toast-ok'}">
        {statusMessage}
      </div>
    {/if}

    <div class="art-container">
      <div class="glow"></div>
      <img
        src={currentPokemon.sprites.artwork}
        alt={currentPokemon.name}
        class="artwork"
      />
      <img
        src={currentPokemon.sprites.showdownFront}
        alt="{currentPokemon.name} showdown"
        class="showdown"
      />
    </div>

    <span class="id-tag">#{currentPokemon.id.toString().padStart(3, "0")}</span>
    <h3 class="name">{currentPokemon.name}</h3>
    <p class="genus">{currentPokemon.species.genus}</p>

    <!-- Type Pills -->
    <div class="types-row">
      {#each currentPokemon.types as t}
        <span class="type-badge type-{t}">{t}</span>
      {/each}
    </div>

    <!-- Action Buttons -->
    <div class="actions-grid">
      <button on:click={handleAddToTeam} class="btn-team" title="Send to Angular Team Builder via SchemaCommand">
        <span>+ Add to Team</span>
        <span class="subtext">Angular Microfrontend</span>
      </button>

      <button on:click={handleDeployToBattle} class="btn-battle" title="Deploy directly to Solid Battle Arena">
        <span>⚔️ Deploy Arena</span>
        <span class="subtext">Solid.js Microfrontend</span>
      </button>
    </div>

    <!-- Flavor Text -->
    <p class="flavor-text">
      "{currentPokemon.species.flavorText}"
    </p>

    <!-- Stats Bars -->
    <div class="stats-box">
      <div class="stat-line">
        <span>HP</span>
        <span class="val">{currentPokemon.stats.hp}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill hp" style="width: {Math.min(100, (currentPokemon.stats.hp / 150) * 100)}%"></div>
      </div>

      <div class="stat-line pt">
        <span>Attack</span>
        <span class="val">{currentPokemon.stats.attack}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill atk" style="width: {Math.min(100, (currentPokemon.stats.attack / 150) * 100)}%"></div>
      </div>

      <div class="stat-line pt">
        <span>Defense</span>
        <span class="val">{currentPokemon.stats.defense}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill def" style="width: {Math.min(100, (currentPokemon.stats.defense / 150) * 100)}%"></div>
      </div>

      <div class="stat-line pt">
        <span>Speed</span>
        <span class="val">{currentPokemon.stats.speed}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill spd" style="width: {Math.min(100, (currentPokemon.stats.speed / 150) * 100)}%"></div>
      </div>
    </div>

    <!-- Moves List preview -->
    <div class="moves-box">
      <span class="moves-label">Combat Moves</span>
      <div class="moves-row">
        {#each currentPokemon.moves.slice(0, 4) as m}
          <span class="move-pill">{m.name}</span>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(:root) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color-scheme: dark;
  }
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #090d16;
    color: #f1f5f9;
    font-size: 13px;
    overflow-x: hidden;
  }
  :global(body.light), :global(html.light body) {
    background: #f8fafc;
    color: #0f172a;
  }
  * { box-sizing: border-box; }

  .svelte-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    overflow-y: auto;
  }
  .header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 8px;
    font-size: 11px;
  }
  .title {
    font-weight: 700;
    color: #fb923c;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fb923c;
    box-shadow: 0 0 8px #fb923c;
  }
  .loading-tag {
    font-size: 10px;
    color: #f43f5e;
    animation: pulse 1.5s infinite;
  }

  .hero-card {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .toast {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    z-index: 20;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .toast-ok { background: #059669; color: #ffffff; }
  .toast-err { background: #e11d48; color: #ffffff; }

  .art-container {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }
  .glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
  .artwork {
    width: 110px;
    height: 110px;
    object-fit: contain;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
  }
  .showdown {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 38px;
    height: 38px;
    object-fit: contain;
    z-index: 3;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }

  .id-tag {
    font-size: 10px;
    font-family: monospace;
    color: #64748b;
  }
  .name {
    margin: 2px 0;
    font-size: 16px;
    font-weight: 800;
    text-transform: capitalize;
    color: #ffffff;
  }
  .genus {
    margin: 0 0 6px 0;
    font-size: 11px;
    color: #94a3b8;
  }

  .types-row {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
  }

  /* Badges */
  :global(.type-badge) {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 7px;
    border-radius: 9999px;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  :global(.type-normal) { background: #9fa19f; }
  :global(.type-fire) { background: #e62829; }
  :global(.type-water) { background: #2980ef; }
  :global(.type-grass) { background: #3fa129; }
  :global(.type-electric) { background: #fac000; color: #1e293b; text-shadow: none; }
  :global(.type-ice) { background: #3dcef3; color: #0f172a; text-shadow: none; }
  :global(.type-fighting) { background: #ff8000; }
  :global(.type-poison) { background: #9141cb; }
  :global(.type-ground) { background: #915121; }
  :global(.type-flying) { background: #81b9ef; color: #0f172a; text-shadow: none; }
  :global(.type-psychic) { background: #ef4179; }
  :global(.type-bug) { background: #91a119; }
  :global(.type-rock) { background: #afa981; }
  :global(.type-ghost) { background: #704170; }
  :global(.type-dragon) { background: #5060e1; }
  :global(.type-steel) { background: #60a1b8; }
  :global(.type-fairy) { background: #ef70ef; }

  .actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
    margin-bottom: 10px;
  }
  .btn-team, .btn-battle {
    padding: 8px 6px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    transition: transform 0.1s ease, filter 0.1s ease;
  }
  .btn-team {
    background: linear-gradient(135deg, #f97316, #e11d48);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
  }
  .btn-battle {
    background: linear-gradient(135deg, #06b6d4, #2563eb);
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
  }
  .btn-team:hover, .btn-battle:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-team:active, .btn-battle:active { transform: translateY(0); }
  .subtext {
    font-size: 9px;
    opacity: 0.85;
    font-weight: 500;
  }

  .flavor-text {
    font-size: 11px;
    color: #cbd5e1;
    font-style: italic;
    background: rgba(0, 0, 0, 0.25);
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    text-align: left;
    width: 100%;
    margin: 0 0 10px 0;
  }

  .stats-box {
    width: 100%;
    font-family: monospace;
    font-size: 10px;
    text-align: left;
    margin-bottom: 10px;
  }
  .stat-line {
    display: flex;
    justify-content: space-between;
    color: #94a3b8;
    margin-bottom: 2px;
  }
  .stat-line.pt { margin-top: 4px; }
  .val { font-weight: 700; color: #ffffff; }
  .bar-track {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    overflow: hidden;
  }
  .bar-fill { height: 100%; border-radius: 9999px; transition: width 0.4s ease; }
  .bar-fill.hp { background: #34d399; }
  .bar-fill.atk { background: #f43f5e; }
  .bar-fill.def { background: #38bdf8; }
  .bar-fill.spd { background: #fbbf24; }

  .moves-box {
    width: 100%;
    text-align: left;
  }
  .moves-label {
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 700;
    color: #64748b;
    display: block;
    margin-bottom: 4px;
  }
  .moves-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .move-pill {
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 10px;
    font-family: monospace;
    color: #cbd5e1;
    text-transform: capitalize;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
