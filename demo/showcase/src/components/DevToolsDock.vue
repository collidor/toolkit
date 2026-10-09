<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { busService } from "../services/busService";
import type { TelemetryEntry } from "@demo/shared";

const isOpen = ref(false);
const logs = ref<TelemetryEntry[]>([]);
const selectedFilter = ref<"all" | "event" | "command" | "port">("all");
const inspectEntry = ref<TelemetryEntry | null>(null);

let unsubTelemetry: (() => void) | undefined;

const filteredLogs = computed(() => {
  if (selectedFilter.value === "all") return logs.value;
  return logs.value.filter((l) => l.category === selectedFilter.value);
});

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function clearLogs() {
  busService.clearTelemetry();
  logs.value = [];
}

function inspect(entry: TelemetryEntry) {
  inspectEntry.value = entry;
}

onMounted(() => {
  logs.value = busService.getTelemetryLogs();
  unsubTelemetry = busService.subscribeTelemetry((entry) => {
    logs.value = [entry, ...logs.value.slice(0, 99)];
  });
});

onUnmounted(() => {
  unsubTelemetry?.();
});
</script>

<template>
  <div :class="['devtools-dock', { open: isOpen }]">
    <!-- Dock Toggle Header -->
    <div class="dock-header" @click="toggleOpen">
      <div class="header-left">
        <span class="dock-icon">⚡</span>
        <span class="dock-title">Collidor IPC DevTools &amp; Event Monitor</span>
        <span class="dock-counter">{{ logs.length }} messages</span>
      </div>

      <div class="header-right">
        <!-- Category Filters (visible when open) -->
        <div v-if="isOpen" class="filter-pills" @click.stop>
          <button
            :class="['filter-btn', { active: selectedFilter === 'all' }]"
            @click="selectedFilter = 'all'"
          >
            All
          </button>
          <button
            :class="['filter-btn', { active: selectedFilter === 'event' }]"
            @click="selectedFilter = 'event'"
          >
            Events
          </button>
          <button
            :class="['filter-btn', { active: selectedFilter === 'command' }]"
            @click="selectedFilter = 'command'"
          >
            Commands
          </button>
          <button
            :class="['filter-btn', { active: selectedFilter === 'port' }]"
            @click="selectedFilter = 'port'"
          >
            Ports
          </button>
          <button class="clear-btn" @click="clearLogs" title="Clear Event Logs">
            Clear
          </button>
        </div>

        <button class="toggle-btn">
          {{ isOpen ? "▼ Collapse" : "▲ Expand Monitor" }}
        </button>
      </div>
    </div>

    <!-- Dock Content Body -->
    <div v-show="isOpen" class="dock-body">
      <!-- Logs List -->
      <div class="logs-pane">
        <div
          v-for="entry in filteredLogs"
          :key="entry.id"
          :class="['log-row', { selected: inspectEntry?.id === entry.id }]"
          @click="inspect(entry)"
        >
          <div class="log-meta">
            <span :class="['cat-badge', `cat-${entry.category}`]">{{ entry.category }}</span>
            <span class="origin-tag">{{ entry.origin }}</span>
            <span class="time-tag">{{ new Date(entry.timestamp).toLocaleTimeString() }}</span>
          </div>

          <div class="log-name">{{ entry.name }}</div>

          <div class="log-status">
            <span v-if="entry.durationMs !== undefined" class="duration-tag">
              {{ entry.durationMs.toFixed(1) }}ms
            </span>
            <span :class="['status-dot', entry.success ? 'ok' : 'err']"></span>
          </div>
        </div>

        <div v-if="filteredLogs.length === 0" class="empty-state">
          No messages recorded in this channel.
        </div>
      </div>

      <!-- Inspector Pane -->
      <div class="inspect-pane">
        <div v-if="inspectEntry" class="inspect-content">
          <div class="inspect-head">
            <h4>{{ inspectEntry.name }}</h4>
            <span :class="['cat-badge', `cat-${inspectEntry.category}`]">{{ inspectEntry.category }}</span>
          </div>
          <div class="inspect-details">
            <div><strong>Origin:</strong> {{ inspectEntry.origin }}</div>
            <div><strong>Time:</strong> {{ new Date(inspectEntry.timestamp).toISOString() }}</div>
            <div v-if="inspectEntry.durationMs !== undefined">
              <strong>Latency:</strong> {{ inspectEntry.durationMs.toFixed(2) }} ms
            </div>
          </div>

          <div class="json-box">
            <div class="json-label">Payload Data</div>
            <pre><code>{{ JSON.stringify(inspectEntry.payload, null, 2) }}</code></pre>
          </div>

          <div v-if="inspectEntry.result" class="json-box">
            <div class="json-label">Execution Result</div>
            <pre><code>{{ JSON.stringify(inspectEntry.result, null, 2) }}</code></pre>
          </div>
        </div>

        <div v-else class="inspect-empty">
          Click any message row on the left to inspect its parameters, payload structure, and execution latency.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.devtools-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--ui-color-surface-elevated, oklch(0.14 0.02 260));
  border-top: 1px solid var(--ui-color-border, oklch(0.28 0.025 260));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.dock-header {
  height: 40px;
  padding: 0 1.2em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: var(--ui-card-header-bg, oklch(0.18 0.02 260));
  user-select: none;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 0.8em;
}

.dock-icon {
  font-size: 1rem;
}

.dock-title {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--ui-color-text, #ffffff);
}

.dock-counter {
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 7px;
  border-radius: var(--ui-radius-full, 9999px);
  color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn {
  background: transparent;
  border: 1px solid var(--ui-color-border, oklch(0.28 0.025 260));
  color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
  border-radius: var(--ui-radius-sm, 4px);
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}
.filter-btn.active {
  background: var(--ui-color-primary, oklch(0.62 0.2 260));
  color: #ffffff;
  border-color: var(--ui-color-primary, oklch(0.62 0.2 260));
}

.clear-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: var(--ui-radius-sm, 4px);
  padding: 2px 7px;
  font-size: 0.72rem;
  cursor: pointer;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.dock-body {
  height: 280px;
  display: flex;
  overflow: hidden;
  border-top: 1px solid var(--ui-color-border-subtle, oklch(0.22 0.02 260));
}

.logs-pane {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid var(--ui-color-border-subtle, oklch(0.22 0.02 260));
}

.log-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.12s ease;
}
.log-row:hover {
  background: var(--ui-color-surface-hover, oklch(0.2 0.02 260));
}
.log-row.selected {
  background: var(--ui-color-primary-subtle, oklch(0.62 0.2 260 / 0.18));
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
}

.cat-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 4px;
}
.cat-event { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.cat-command { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
.cat-port { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
.cat-result { background: rgba(251, 146, 60, 0.2); color: #fb923c; }

.origin-tag {
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.72rem;
  color: var(--ui-color-text-muted, oklch(0.65 0.02 260));
}

.time-tag {
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.68rem;
  color: var(--ui-color-text-muted, oklch(0.5 0.02 260));
}

.log-name {
  flex: 1;
  font-family: var(--ui-font-mono, monospace);
  font-weight: 600;
  color: var(--ui-color-text, #ffffff);
}

.log-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.duration-tag {
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.7rem;
  color: var(--ui-color-text-muted, oklch(0.6 0.02 260));
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-dot.ok { background: #10b981; }
.status-dot.err { background: #ef4444; }

.empty-state {
  padding: 30px;
  text-align: center;
  color: var(--ui-color-text-muted, oklch(0.55 0.02 260));
  font-size: 0.85rem;
}

.inspect-pane {
  width: 380px;
  background: var(--ui-color-surface, oklch(0.12 0.015 260));
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
}

.inspect-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inspect-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.inspect-head h4 {
  margin: 0;
  font-size: 0.95rem;
  font-family: var(--ui-font-mono, monospace);
}

.inspect-details {
  font-size: 0.78rem;
  color: var(--ui-color-text-muted, oklch(0.75 0.02 260));
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.json-box {
  margin-top: 4px;
}
.json-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ui-color-text-muted, oklch(0.6 0.02 260));
  margin-bottom: 2px;
}
.json-box pre {
  margin: 0;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.72rem;
  overflow-x: auto;
  color: var(--ui-color-text, #ffffff);
}

.inspect-empty {
  padding: 30px 15px;
  text-align: center;
  color: var(--ui-color-text-muted, oklch(0.5 0.02 260));
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
