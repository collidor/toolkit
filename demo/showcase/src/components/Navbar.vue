<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    currentTab?: "docs" | "demo" | "architecture";
  }>(),
  {
    currentTab: "docs",
  }
);

const emit = defineEmits<{
  (e: "tabChange", tab: "docs" | "demo" | "architecture"): void;
  (e: "themeChange", theme: string): void;
}>();

const version = typeof __TOOLKIT_VERSION__ !== "undefined" ? __TOOLKIT_VERSION__ : "1.1.3";
const currentTheme = ref("dark");

const themes = [
  { id: "dark", label: "Dark Matte" },
  { id: "neumorphic", label: "Neumorphic" },
  { id: "jewel", label: "Jewel Nouveau" },
  { id: "troy-strategy", label: "Troy Strategy" },
  { id: "rpg-parchment", label: "RPG Parchment" },
];

function setTheme(theme: string) {
  currentTheme.value = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("collidor-theme", theme);
  emit("themeChange", theme);
}

function selectTab(tab: "docs" | "demo" | "architecture") {
  emit("tabChange", tab);
  window.location.hash = tab;
}

onMounted(() => {
  const saved = localStorage.getItem("collidor-theme");
  if (saved) {
    currentTheme.value = saved;
    document.documentElement.setAttribute("data-theme", saved);
  }
});
</script>

<template>
  <header class="docs-header">
    <div class="header-left">
      <a href="#docs" class="brand" @click.prevent="selectTab('docs')">
        <svg class="brand-logo" viewBox="0 0 32 32" width="28" height="28">
          <defs>
            <linearGradient id="toolkit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f43f5e" />
              <stop offset="50%" stop-color="#fb923c" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="#0f172a" />
          <path d="M7 11h18v3H10v2h14a3 3 0 0 1 0 6H7v-3h15a1 1 0 0 0 0-2H10a3 3 0 0 1-3-3V11z" fill="url(#toolkit-grad)" />
        </svg>
        <span class="brand-name">@collidor/toolkit</span>
      </a>
      <span class="ui-badge ui-badge--sm ui-badge--primary">v{{ version }}</span>
      <span class="ui-badge ui-badge--sm ui-badge--accent">Multi-Framework IPC</span>
    </div>

    <!-- Center Navigation Tabs -->
    <div class="header-center">
      <div class="tab-pill-group">
        <button
          :class="['tab-pill', { active: currentTab === 'docs' }]"
          @click="selectTab('docs')"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Documentation</span>
        </button>

        <button
          :class="['tab-pill', { active: currentTab === 'demo' }]"
          @click="selectTab('demo')"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Pokédex Demo</span>
          <span class="pill-badge">Live</span>
        </button>

        <button
          :class="['tab-pill', { active: currentTab === 'architecture' }]"
          @click="selectTab('architecture')"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Architecture & IPC</span>
        </button>
      </div>
    </div>

    <!-- Right: Links & Theme Picker -->
    <div class="header-right">
      <nav class="nav-links">
        <a href="https://jsr.io/@collidor/toolkit" target="_blank" rel="noopener noreferrer" class="nav-link">
          JSR
        </a>
        <a href="https://github.com/collidor/toolkit" target="_blank" rel="noopener noreferrer" class="nav-link github-btn" title="View Source on GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>GitHub</span>
        </a>
      </nav>

      <div class="theme-picker">
        <label for="theme-select" class="theme-label">Theme</label>
        <select
          id="theme-select"
          :value="currentTheme"
          @change="setTheme(($event.target as HTMLSelectElement).value)"
          class="theme-select"
        >
          <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.label }}</option>
        </select>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 1em;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.618em;
  text-decoration: none;
}

.brand-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--ui-color-text, #ffffff);
  letter-spacing: -0.02em;
}

/* Center Tab Pills */
.header-center {
  display: flex;
  align-items: center;
}

.tab-pill-group {
  display: flex;
  background: var(--ui-color-surface, oklch(0.12 0.02 260));
  border: 1px solid var(--ui-color-border-subtle, oklch(0.24 0.02 260));
  border-radius: var(--ui-radius-full, 9999px);
  padding: 3px;
  gap: 2px;
}

.tab-pill {
  background: transparent;
  border: none;
  color: var(--ui-color-text-muted, oklch(0.72 0.02 260));
  padding: 0.382em 0.9em;
  border-radius: var(--ui-radius-full, 9999px);
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  transition: all 0.146s ease;
}

.tab-pill:hover {
  color: var(--ui-color-text, #ffffff);
}

.tab-pill.active {
  background: var(--ui-color-surface-hover, oklch(0.24 0.025 260));
  color: var(--ui-color-text, #ffffff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.pill-badge {
  background: var(--ui-color-accent-subtle, oklch(0.68 0.18 160 / 0.2));
  color: var(--ui-color-accent, oklch(0.78 0.18 160));
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--ui-radius-full, 9999px);
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.236em;
}

.nav-link {
  color: var(--ui-color-text-muted, oklch(0.75 0.02 260));
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.146s ease;
}

.nav-link:hover {
  color: var(--ui-color-text, #ffffff);
  text-decoration: none;
}

.github-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.382em;
}

.theme-picker {
  display: flex;
  align-items: center;
  gap: 0.382em;
  margin-left: 0.618em;
}

.theme-label {
  font-size: 0.75rem;
  color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
  text-transform: uppercase;
}

.theme-select {
  background: var(--ui-color-surface, oklch(0.12 0.02 260));
  color: var(--ui-color-text, #ffffff);
  border: 1px solid var(--ui-color-border, oklch(0.28 0.025 260));
  border-radius: var(--ui-radius-sm, 4px);
  padding: 0.236em 0.618em;
  font-size: 0.825rem;
  cursor: pointer;
  outline: none;
}
.theme-select:focus {
  border-color: var(--ui-color-primary, oklch(0.62 0.2 260));
}

@media (max-width: 900px) {
  .header-center {
    display: none;
  }
}
</style>
