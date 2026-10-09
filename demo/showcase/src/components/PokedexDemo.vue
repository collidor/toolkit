<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { busService } from "../services/busService";
import {
  FilterChangedEvent,
  FocusViewEvent,
  PokemonType,
  PokemonTypeSchema,
} from "@demo/shared";

const searchTerm = ref("");
const selectedType = ref<PokemonType | undefined>();
const rightPanelTab = ref<"angular" | "solid">("angular");

const reactIframeRef = ref<HTMLIFrameElement | null>(null);
const svelteIframeRef = ref<HTMLIFrameElement | null>(null);
const angularIframeRef = ref<HTMLIFrameElement | null>(null);
const solidIframeRef = ref<HTMLIFrameElement | null>(null);

let cleanupReact: (() => void) | undefined;
let cleanupSvelte: (() => void) | undefined;
let cleanupAngular: (() => void) | undefined;
let cleanupSolid: (() => void) | undefined;
let unsubFocus: (() => void) | undefined;

const allTypes = PokemonTypeSchema.options;

function handleSearchChange(text: string) {
  searchTerm.value = text;
  busService.eventBus.emit(
    new FilterChangedEvent({
      search: text,
      selectedType: selectedType.value,
    })
  );
}

function handleTypeSelect(type?: PokemonType) {
  selectedType.value = type;
  busService.eventBus.emit(
    new FilterChangedEvent({
      search: searchTerm.value,
      selectedType: type,
    })
  );
}

function switchRightTab(tab: "angular" | "solid") {
  rightPanelTab.value = tab;
}

function reloadIframe(target: "react" | "svelte" | "right") {
  if (target === "react" && reactIframeRef.value) {
    reactIframeRef.value.src = "./react/index.html";
  } else if (target === "svelte" && svelteIframeRef.value) {
    svelteIframeRef.value.src = "./svelte/index.html";
  } else if (target === "right") {
    if (rightPanelTab.value === "angular" && angularIframeRef.value) {
      angularIframeRef.value.src = "./angular/index.html";
    } else if (rightPanelTab.value === "solid" && solidIframeRef.value) {
      solidIframeRef.value.src = "./solid/index.html";
    }
  }
}

watch(rightPanelTab, (newTab) => {
  if (newTab === "angular") {
    busService.registerAngularHandlers();
    busService.unregisterSolidHandlers();
    if (angularIframeRef.value) {
      cleanupAngular?.();
      cleanupAngular = busService.attachIframe(angularIframeRef.value, "Angular-Analog");
    }
  } else {
    busService.registerSolidHandlers();
    busService.unregisterAngularHandlers();
    if (solidIframeRef.value) {
      cleanupSolid?.();
      cleanupSolid = busService.attachIframe(solidIframeRef.value, "Solid-Battle");
    }
  }
});

onMounted(() => {
  // 1. Subscribe to FocusViewEvent from child frames
  unsubFocus = busService.eventBus.on(FocusViewEvent, (event: any) => {
    if (event?.tab === "angular" || event?.tab === "solid") {
      rightPanelTab.value = event.tab;
    }
  });

  // 2. Attach React and Svelte persistent iframes
  if (reactIframeRef.value) {
    cleanupReact = busService.attachIframe(reactIframeRef.value, "React-Catalog");
  }
  if (svelteIframeRef.value) {
    cleanupSvelte = busService.attachIframe(svelteIframeRef.value, "Svelte-Inspector");
  }

  // 3. Attach initial right-panel iframe (Angular default)
  if (rightPanelTab.value === "angular" && angularIframeRef.value) {
    busService.registerAngularHandlers();
    cleanupAngular = busService.attachIframe(angularIframeRef.value, "Angular-Analog");
  }
});

onUnmounted(() => {
  cleanupReact?.();
  cleanupSvelte?.();
  cleanupAngular?.();
  cleanupSolid?.();
  unsubFocus?.();
});
</script>

<template>
  <div class="pokedex-demo-page">
    <!-- Top Hero Banner -->
    <div class="demo-hero-banner">
      <div class="hero-left">
        <div class="hero-icon-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <div class="hero-title">5-Framework Microfrontend Architecture</div>
          <div class="hero-desc">
            Vue 3 Host Shell routes zero-copy HTML5 <code>PortChannel</code> streams between sandboxed React 18, Svelte 5, Angular 18, and Solid.js iframes.
          </div>
        </div>
      </div>

      <div class="hero-stats">
        <div class="ipc-status-pill">
          <span class="pulse-dot"></span>
          <span>PortChannel IPC Active</span>
        </div>
        <div class="frame-pills">
          <span class="pill pill-vue">Vue 3 Shell</span>
          <span class="pill pill-react">React 18</span>
          <span class="pill pill-svelte">Svelte 5</span>
          <span class="pill pill-angular">Angular 18</span>
          <span class="pill pill-solid">Solid.js</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="filter-bar">
      <div class="search-input-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search Pokémon by name or #id across all microfrontends..."
          :value="searchTerm"
          @input="handleSearchChange(($event.target as HTMLInputElement).value)"
          class="demo-search-input"
        />
        <button v-if="searchTerm" @click="handleSearchChange('')" class="clear-btn" title="Clear Search">✕</button>
      </div>

      <div class="type-filter-list">
        <button
          @click="handleTypeSelect(undefined)"
          :class="['type-pill', { active: !selectedType }]"
        >
          All Types
        </button>
        <button
          v-for="t in allTypes"
          :key="t"
          @click="handleTypeSelect(t)"
          :class="['type-pill type-badge', `type-${t}`, { active: selectedType === t }]"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <!-- 3-Panel Main Layout -->
    <div class="panels-grid">
      <!-- Panel 1: React 18 Catalog (Iframe) -->
      <div class="panel-card border-react">
        <div class="panel-window-bar">
          <div class="window-controls">
            <span class="win-dot dot-close"></span>
            <span class="win-dot dot-min"></span>
            <span class="win-dot dot-max"></span>
          </div>
          <div class="panel-title text-react">
            <!-- React Atom Icon -->
            <svg class="framework-icon" width="16" height="16" viewBox="0 0 115.3 100" fill="#38bdf8">
              <ellipse cx="57.65" cy="50" rx="16.7" ry="46.7" transform="rotate(30 57.65 50)" fill="none" stroke="#38bdf8" stroke-width="7" />
              <ellipse cx="57.65" cy="50" rx="16.7" ry="46.7" transform="rotate(90 57.65 50)" fill="none" stroke="#38bdf8" stroke-width="7" />
              <ellipse cx="57.65" cy="50" rx="16.7" ry="46.7" transform="rotate(150 57.65 50)" fill="none" stroke="#38bdf8" stroke-width="7" />
              <circle cx="57.65" cy="50" r="10.5" fill="#38bdf8" />
            </svg>
            <span>React 18 Catalog</span>
          </div>
          <div class="panel-actions">
            <span class="panel-tag tag-react">PortChannel 1</span>
            <button class="win-btn" @click="reloadIframe('react')" title="Reload React Frame">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <a href="./react/index.html" target="_blank" rel="noopener noreferrer" class="win-btn" title="Open React in New Tab">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>
        <div class="iframe-container">
          <iframe
            ref="reactIframeRef"
            src="./react/index.html"
            title="React 18 Catalog Sub-App"
            class="demo-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      <!-- Panel 2: Svelte 5 Inspector (Iframe) -->
      <div class="panel-card border-svelte">
        <div class="panel-window-bar">
          <div class="window-controls">
            <span class="win-dot dot-close"></span>
            <span class="win-dot dot-min"></span>
            <span class="win-dot dot-max"></span>
          </div>
          <div class="panel-title text-svelte">
            <!-- Svelte Flame Icon -->
            <svg class="framework-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2.5">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            <span>Svelte 5 Inspector</span>
          </div>
          <div class="panel-actions">
            <span class="panel-tag tag-svelte">PortChannel 2</span>
            <button class="win-btn" @click="reloadIframe('svelte')" title="Reload Svelte Frame">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <a href="./svelte/index.html" target="_blank" rel="noopener noreferrer" class="win-btn" title="Open Svelte in New Tab">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>
        <div class="iframe-container">
          <iframe
            ref="svelteIframeRef"
            src="./svelte/index.html"
            title="Svelte 5 Inspector Sub-App"
            class="demo-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      <!-- Panel 3: Angular & Solid (Switchable Iframe) -->
      <div class="panel-card border-purple">
        <div class="panel-window-bar">
          <div class="window-controls">
            <span class="win-dot dot-close"></span>
            <span class="win-dot dot-min"></span>
            <span class="win-dot dot-max"></span>
          </div>
          <div class="tab-switch">
            <button
              :class="['sub-tab-btn', { active: rightPanelTab === 'angular' }]"
              @click="switchRightTab('angular')"
            >
              <span class="btn-dot bg-angular"></span>
              Angular 18 Team
            </button>
            <button
              :class="['sub-tab-btn', { active: rightPanelTab === 'solid' }]"
              @click="switchRightTab('solid')"
            >
              <span class="btn-dot bg-solid"></span>
              Solid.js Arena
            </button>
          </div>
          <div class="panel-actions">
            <span class="panel-tag tag-purple">
              {{ rightPanelTab === 'angular' ? 'PortChannel 3' : 'PortChannel 4' }}
            </span>
            <button class="win-btn" @click="reloadIframe('right')" title="Reload Active Frame">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <a
              :href="rightPanelTab === 'angular' ? './angular/index.html' : './solid/index.html'"
              target="_blank"
              rel="noopener noreferrer"
              class="win-btn"
              title="Open Sub-App in New Tab"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>
        <div class="iframe-container">
          <iframe
            v-if="rightPanelTab === 'angular'"
            key="angular-frame"
            ref="angularIframeRef"
            src="./angular/index.html"
            title="Angular Team Builder Sub-App"
            class="demo-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
          <iframe
            v-else
            key="solid-frame"
            ref="solidIframeRef"
            src="./solid/index.html"
            title="Solid Battle Arena Sub-App"
            class="demo-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pokedex-demo-page {
  max-width: 1680px;
  margin: 0 auto;
  padding: 1.236em 1.618em 5em 1.618em;
  display: flex;
  flex-direction: column;
  gap: 1.236em;
}

/* Hero Banner */
.demo-hero-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.236em;
  padding: 1.236em 1.618em;
  border-radius: var(--ui-radius-lg, 12px);
  background: linear-gradient(135deg, var(--ui-color-surface-elevated, oklch(0.16 0.02 260)) 0%, oklch(0.18 0.03 260) 100%);
  border: 1px solid var(--ui-color-border, oklch(0.25 0.02 260));
  box-shadow: var(--ui-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.1));
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 1em;
  flex: 1;
  min-width: 320px;
}

.hero-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--ui-radius-md, 8px);
  background: var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.18));
  color: var(--ui-color-primary, oklch(0.72 0.2 230));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--ui-color-primary-border, oklch(0.65 0.19 230 / 0.35));
}

.hero-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ui-color-text, #ffffff);
  letter-spacing: -0.01em;
}

.hero-desc {
  font-size: 0.85rem;
  color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
  margin-top: 2px;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 1em;
  flex-wrap: wrap;
}

.ipc-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.35em 0.85em;
  border-radius: var(--ui-radius-full, 9999px);
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 0.75rem;
  font-weight: 600;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.frame-pills {
  display: flex;
  align-items: center;
  gap: 0.382em;
  flex-wrap: wrap;
}

.pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--ui-radius-full, 9999px);
  border: 1px solid;
}
.pill-vue { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #34d399; }
.pill-react { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.3); color: #38bdf8; }
.pill-svelte { background: rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.3); color: #fb923c; }
.pill-angular { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
.pill-solid { background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.3); color: #22d3ee; }

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 0.8em;
  padding: 0.9em 1.236em;
  background: var(--ui-color-surface, oklch(0.14 0.02 260));
  border: 1px solid var(--ui-color-border-subtle, oklch(0.22 0.02 260));
  border-radius: var(--ui-radius-md, 8px);
}

@media (min-width: 900px) {
  .filter-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-input-wrap {
  position: relative;
  width: 100%;
  max-width: 440px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--ui-color-text-muted, oklch(0.6 0.02 260));
  pointer-events: none;
}

.demo-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55em 2.2em 0.55em 2.2em;
  border-radius: var(--ui-radius-sm, 6px);
  border: 1px solid var(--ui-color-border, oklch(0.28 0.02 260));
  background: var(--ui-color-surface-elevated, oklch(0.11 0.015 260));
  color: var(--ui-color-text, #ffffff);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.146s ease, box-shadow 0.146s ease;
}
.demo-search-input:focus {
  border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
  box-shadow: 0 0 0 2px var(--ui-color-primary-subtle, rgba(56, 189, 248, 0.15));
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--ui-color-text-muted, oklch(0.6 0.02 260));
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px;
}
.clear-btn:hover {
  color: var(--ui-color-text, #ffffff);
}

.type-filter-list {
  display: flex;
  align-items: center;
  gap: 0.382em;
  overflow-x: auto;
  padding-bottom: 2px;
}

.type-pill {
  background: var(--ui-color-surface-elevated, oklch(0.18 0.02 260));
  border: 1px solid var(--ui-color-border, oklch(0.28 0.02 260));
  color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
  border-radius: var(--ui-radius-full, 9999px);
  padding: 0.32em 0.85em;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.146s ease;
}
.type-pill.active {
  background: var(--ui-color-primary, oklch(0.62 0.2 260));
  color: #ffffff;
  border-color: var(--ui-color-primary, oklch(0.62 0.2 260));
}

/* 3-Panel Main Layout */
.panels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.236em;
}

@media (min-width: 1080px) {
  .panels-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.panel-card {
  display: flex;
  flex-direction: column;
  height: max(720px, calc(100vh - 230px));
  background: var(--ui-color-surface, oklch(0.14 0.02 260));
  border: 1px solid var(--ui-color-border, oklch(0.24 0.02 260));
  border-radius: var(--ui-radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--ui-shadow-md, 0 6px 18px rgba(0, 0, 0, 0.15));
  transition: border-color 0.146s ease;
}

.border-react { border-color: rgba(56, 189, 248, 0.3); }
.border-svelte { border-color: rgba(249, 115, 22, 0.3); }
.border-purple { border-color: rgba(168, 85, 247, 0.3); }

/* Window Bar Chrome */
.panel-window-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55em 0.9em;
  background: var(--ui-card-header-bg, oklch(0.18 0.02 260));
  border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.22 0.02 260));
  gap: 0.6em;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.win-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.dot-close { background: #ff5f56; }
.dot-min { background: #ffbd2e; }
.dot-max { background: #27c93f; }

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.825rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.framework-icon {
  flex-shrink: 0;
}
.text-react { color: #38bdf8; }
.text-svelte { color: #fb923c; }

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.382em;
}

.win-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--ui-color-text-muted, oklch(0.65 0.02 260));
  border-radius: var(--ui-radius-sm, 4px);
  padding: 3px 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.146s ease;
  text-decoration: none;
}
.win-btn:hover {
  background: var(--ui-color-surface-hover, oklch(0.22 0.02 260));
  color: var(--ui-color-text, #ffffff);
  border-color: var(--ui-color-border, oklch(0.3 0.02 260));
}

.panel-tag {
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--ui-radius-sm, 4px);
  border: 1px solid;
}
.tag-react { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.25); color: #38bdf8; }
.tag-svelte { background: rgba(249, 115, 22, 0.1); border-color: rgba(249, 115, 22, 0.25); color: #fb923c; }
.tag-purple { background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.25); color: #c084fc; }

.tab-switch {
  display: flex;
  gap: 2px;
  background: var(--ui-color-surface, oklch(0.12 0.02 260));
  padding: 2px;
  border-radius: var(--ui-radius-sm, 6px);
  border: 1px solid var(--ui-color-border-subtle, oklch(0.24 0.02 260));
}

.sub-tab-btn {
  background: transparent;
  border: none;
  color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.146s ease;
}
.sub-tab-btn.active {
  background: var(--ui-color-primary, oklch(0.62 0.2 260));
  color: #ffffff;
}
.btn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.bg-angular { background: #f87171; }
.bg-solid { background: #22d3ee; }

.iframe-container {
  flex: 1;
  background: #090d16;
  position: relative;
  overflow: hidden;
}

.demo-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
