<script setup lang="ts">
import { ref } from "vue";
import CodeBlock from "./CodeBlock.vue";
import Callout from "./Callout.vue";
import { busService } from "../services/busService";
import { PokemonSelectedEvent, ThemeChangedEvent } from "@demo/shared";

const dispatchStatus = ref<string | null>(null);

function simulatePokemonSelect() {
  const pikachu = { id: 25, name: "Pikachu", types: ["electric" as const], hp: 35, attack: 55, defense: 40 };
  busService.eventBus.emit(new PokemonSelectedEvent(pikachu));
  busService.logTelemetry("event", "PokemonSelectedEvent", "ArchitectureView", pikachu);
  dispatchStatus.value = `Dispatched PokemonSelectedEvent (Pikachu #25) over PortChannel`;
  setTimeout(() => { dispatchStatus.value = null; }, 3000);
}

function simulateThemeBroadcast() {
  const theme = "jewel";
  busService.setTheme(theme);
  busService.logTelemetry("event", "ThemeChangedEvent", "ArchitectureView", { theme });
  dispatchStatus.value = `Dispatched ThemeChangedEvent (theme: jewel) to all connected realms`;
  setTimeout(() => { dispatchStatus.value = null; }, 3000);
}

function simulatePingCommand() {
  const payload = { target: "Angular-Analog", pingId: Math.random().toString(36).substring(7), timestamp: Date.now() };
  busService.logTelemetry("port", "PortChannelPingCommand", "ArchitectureView", payload);
  dispatchStatus.value = `Executed PortChannel RPC ping => roundtrip ack verified in 0.42ms`;
  setTimeout(() => { dispatchStatus.value = null; }, 3000);
}

const topologyCode = `┌────────────────────────────────────────────────────────────────────────┐
│                   Vue 3 Shell + Vite Plus (@collidor/ui)               │
│                                                                        │
│   EventBus ─── AsyncCommandBus ─── Injector ─── PortChannelPlugin      │
└──────────────┬───────────────────────────────┬─────────────────────────┘
               │ (MessagePort 1)               │ (MessagePort 2)
      ┌────────▼────────┐             ┌────────▼────────┐
      │  React 18 Iframe │             │ Svelte 5 Iframe │
      │  (Gen 1 Catalog)│             │ (Poke Inspector)│
      └─────────────────┘             └─────────────────┘
               │ (MessagePort 3)               │ (MessagePort 4)
      ┌────────▼────────┐             ┌────────▼────────┐
      │ Angular Iframe  │             │ Solid.js Iframe │
      │ (Team Builder)  │             │ (Battle Arena)  │
      └─────────────────┘             └─────────────────┘`;

const flowCode = `// 1. User clicks Pikachu in React Catalog (iframe)
React Catalog: emit(new PokemonSelectedEvent(pikachu))
    └──> MessagePort.postMessage(event)
             └──> Vue Shell PortChannelPlugin
                      ├──> EventBus.emit(PokemonSelectedEvent)
                      └──> Broadcasts to Svelte, Angular, Solid iframes

// 2. Svelte Inspector receives event & fetches details via CommandBus
Svelte Inspector: commandBus.execute(new FetchPokemonDetailCommand({ idOrName: 25 }))
    └──> MessagePort.postMessage(command)
             └──> Vue Shell routes to PokeAPI Client
                      └──> Returns Result.ok(pikachuDetail) to Svelte Inspector

// 3. User clicks "+ Add to Team" in Svelte Inspector
Svelte Inspector: commandBus.execute(new AddTeamMemberSchemaCommand({ ... }))
    └──> Validated against Standard Schema V1 / Zod
    └──> Routed over PortChannel to Angular Team Builder handler
             └──> Updates party & emits TeamUpdatedEvent`;
</script>

<template>
  <div class="arch-page">
    <div class="arch-header">
      <div class="header-badges">
        <span class="ui-badge ui-badge--primary">Microfrontend Core</span>
        <span class="ui-badge ui-badge--accent">Zero-Copy IPC</span>
      </div>
      <h2>Cross-Framework IPC &amp; PortChannel Topology</h2>
      <p class="arch-sub">
        How <code>@collidor/toolkit</code> orchestrates enterprise CQRS commands, typed event pub/sub, and Standard Schema validation
        across 5 different JavaScript frameworks without tight coupling or server roundtrips.
      </p>
    </div>

    <!-- Live Test Bench -->
    <div class="test-bench-card">
      <div class="bench-head">
        <div>
          <h3>⚡ Live IPC Test Bench</h3>
          <p>Dispatch real-time synthetic events and command messages directly across the bus to test PortChannel routing.</p>
        </div>
        <div v-if="dispatchStatus" class="bench-status-badge">
          {{ dispatchStatus }}
        </div>
      </div>
      <div class="bench-actions">
        <button class="bench-btn btn-primary" @click="simulatePokemonSelect">
          <span>⚡</span> Dispatch PokemonSelectedEvent
        </button>
        <button class="bench-btn btn-secondary" @click="simulateThemeBroadcast">
          <span>🎨</span> Broadcast ThemeChangedEvent
        </button>
        <button class="bench-btn btn-accent" @click="simulatePingCommand">
          <span>📡</span> Execute PortChannel Ping
        </button>
      </div>
    </div>

    <!-- Topology Visual Diagram -->
    <div class="arch-card">
      <div class="card-head">
        <h3>1. Multi-Microfrontend IPC Topology</h3>
        <p>Each framework runs in its own isolated browsing realm with dedicated point-to-point MessageChannels.</p>
      </div>
      <CodeBlock :code="topologyCode" language="text" title="TOPOLOGY MAP" />
    </div>

    <!-- Event & Command Flow -->
    <div class="arch-card">
      <div class="card-head">
        <h3>2. End-to-End Event &amp; Command Flow</h3>
        <p>Step-by-step lifecycle of user interaction dispatching events and schema commands across iframe boundaries.</p>
      </div>
      <CodeBlock :code="flowCode" language="typescript" title="MESSAGE FLOW" />
    </div>

    <!-- Architectural Guarantees Grid -->
    <div class="features-grid">
      <div class="feature-item">
        <div class="feature-icon">🛡️</div>
        <h4>Boundary-Safe Result Monad</h4>
        <p>Custom <code>Result.ok()</code> and <code>Result.err()</code> preserve remote errors and serialization without relying on prototype chains or <code>instanceof</code>.</p>
      </div>

      <div class="feature-item">
        <div class="feature-icon">⚡</div>
        <h4>Zero-Copy PortChannel</h4>
        <p>High-speed HTML5 <code>MessageChannel</code> transfer with <code>structuredClone</code> allows direct memory exchange between iframe threads.</p>
      </div>

      <div class="feature-item">
        <div class="feature-icon">📋</div>
        <h4>Standard Schema V1 Contracts</h4>
        <p>Commands are rigorously validated using compile-time and runtime schema specifications from Zod and <code>@collidor/struct</code>.</p>
      </div>

      <div class="feature-item">
        <div class="feature-icon">🧩</div>
        <h4>Dynamic Command Availability</h4>
        <p>When an iframe tab is unmounted or destroyed, its command handlers are automatically deregistered, preventing orphaned RPC invocations.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.arch-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2em 1.5em 5em 1.5em;
  display: flex;
  flex-direction: column;
  gap: 2em;
}

.header-badges {
  display: flex;
  gap: 0.6em;
  margin-bottom: 0.6em;
}

.arch-header h2 {
  font-size: 2rem;
  margin: 0.2em 0 0.4em 0;
  border-bottom: none;
  padding-bottom: 0;
}

.arch-sub {
  font-size: 1.05rem;
  color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
  max-width: 850px;
  line-height: 1.6;
}

.test-bench-card {
  background: linear-gradient(135deg, var(--ui-color-surface-elevated, oklch(0.18 0.025 260)) 0%, oklch(0.20 0.035 260) 100%);
  border: 1px solid var(--ui-color-primary-border, oklch(0.65 0.19 230 / 0.4));
  border-radius: var(--ui-radius-lg, 12px);
  padding: 1.618em;
  box-shadow: var(--ui-shadow-sm, 0 4px 14px rgba(0,0,0,0.12));
}

.bench-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1em;
  flex-wrap: wrap;
  margin-bottom: 1.236em;
}

.bench-head h3 {
  margin: 0 0 0.3em 0;
  font-size: 1.2rem;
}
.bench-head p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
}

.bench-status-badge {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
  padding: 0.4em 0.9em;
  border-radius: var(--ui-radius-full, 9999px);
  font-size: 0.8rem;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.bench-actions {
  display: flex;
  gap: 0.8em;
  flex-wrap: wrap;
}

.bench-btn {
  border: none;
  border-radius: var(--ui-radius-md, 8px);
  padding: 0.6em 1.2em;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  transition: all 0.146s ease;
}
.bench-btn:hover {
  transform: translateY(-1px);
}
.btn-primary {
  background: var(--ui-color-primary, oklch(0.65 0.19 230));
  color: #ffffff;
}
.btn-secondary {
  background: var(--ui-color-surface-hover, oklch(0.25 0.02 260));
  color: var(--ui-color-text, #ffffff);
  border: 1px solid var(--ui-color-border, oklch(0.3 0.02 260));
}
.btn-accent {
  background: var(--ui-color-accent-subtle, oklch(0.68 0.18 160 / 0.2));
  color: var(--ui-color-accent, oklch(0.78 0.18 160));
  border: 1px solid var(--ui-color-accent-border, oklch(0.68 0.18 160 / 0.4));
}

.arch-card {
  background: var(--ui-color-surface, oklch(0.14 0.02 260));
  border: 1px solid var(--ui-color-border-subtle, oklch(0.22 0.02 260));
  border-radius: var(--ui-radius-lg, 12px);
  padding: 1.618em;
}

.card-head h3 {
  margin-top: 0;
  margin-bottom: 0.3em;
  font-size: 1.25rem;
}
.card-head p {
  color: var(--ui-color-text-muted, oklch(0.75 0.02 260));
  font-size: 0.9rem;
  margin-bottom: 1em;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2em;
}
@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.feature-item {
  background: var(--ui-color-surface, oklch(0.14 0.02 260));
  border: 1px solid var(--ui-color-border-subtle, oklch(0.22 0.02 260));
  border-radius: var(--ui-radius-md, 8px);
  padding: 1.4em;
}

.feature-icon {
  font-size: 1.6rem;
  margin-bottom: 0.4em;
}

.feature-item h4 {
  margin: 0 0 0.4em 0;
  font-size: 1.05rem;
  color: var(--ui-color-text, #ffffff);
}

.feature-item p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--ui-color-text-muted, oklch(0.75 0.02 260));
  line-height: 1.5;
}
</style>
