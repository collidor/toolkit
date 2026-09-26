<template>
  <div class="vue-catalog-root flex flex-col h-full space-y-2">
    <!-- Header with badge and count -->
    <div class="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-white/10">
      <span class="font-bold text-emerald-400 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Vue 3 Gen 1 Catalog
      </span>
      <span class="font-mono text-[10px] bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
        {{ filteredList.length }} / 151 Pokémon
      </span>
    </div>

    <!-- Local Filter / Search Bar -->
    <div class="flex items-center gap-1.5 text-xs">
      <div class="relative flex-1">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Filter 151 Pokémon..."
          class="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />
        <button
          v-if="searchTerm"
          @click="searchTerm = ''"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px]"
        >
          ✕
        </button>
      </div>

      <select
        v-model="selectedType"
        class="bg-slate-900/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition capitalize"
      >
        <option :value="undefined">All Types</option>
        <option v-for="t in allTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Scrollable Pokémon Grid -->
    <div class="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
      <div
        v-for="pokemon in paginatedList"
        :key="pokemon.id"
        @click="selectPokemon(pokemon)"
        :class="[
          'p-2 rounded-xl border cursor-pointer transition flex items-center justify-between select-none group',
          selectedId === pokemon.id
            ? 'bg-rose-500/20 border-rose-500/50 shadow-md shadow-rose-900/20'
            : 'bg-slate-900/50 hover:bg-slate-900/90 border-white/5 hover:border-emerald-500/30'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-lg bg-slate-950/60 p-0.5 border border-white/5 flex items-center justify-center shrink-0">
            <img
              :src="pokemon.sprites.thumbnail"
              :alt="pokemon.name"
              class="w-9 h-9 object-contain drop-shadow group-hover:scale-110 transition-transform"
              loading="lazy"
            />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-white capitalize">{{ pokemon.name }}</span>
              <span class="text-[10px] font-mono text-slate-500">
                #{{ pokemon.id.toString().padStart(3, '0') }}
              </span>
            </div>
            <div class="flex items-center gap-1 mt-0.5">
              <span
                v-for="t in pokemon.types"
                :key="t"
                :class="['type-badge text-[9px] px-1.5 py-0.2 rounded font-semibold capitalize', `type-${t}`]"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </div>
        <span
          :class="[
            'text-xs font-bold transition-transform group-hover:translate-x-1',
            selectedId === pokemon.id ? 'text-rose-400' : 'text-slate-600 group-hover:text-emerald-400'
          ]"
        >
          →
        </span>
      </div>

      <div
        v-if="filteredList.length === 0"
        class="py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center"
      >
        <span>No Pokémon matched your search.</span>
        <button
          @click="resetFilters"
          class="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Pagination Controls Footer -->
    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs select-none">
      <div class="flex items-center gap-1 text-[11px] text-slate-400">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <span class="text-slate-600">({{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredList.length) }})</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
          title="Previous Page"
        >
          ◀
        </button>

        <div class="flex items-center gap-0.5">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'w-6 h-6 rounded flex items-center justify-center font-mono text-[11px] transition',
              currentPage === page
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
          title="Next Page"
        >
          ▶
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  ALL_GEN1_SUMMARY_LIST,
  FetchPokemonListCommand,
  FilterChangedEvent,
  PokemonSelectedEvent,
  PokemonInspectedEvent,
  PokemonSummary,
  PokemonType,
} from '@demo/shared';

const props = defineProps<{
  busService: any;
}>();

const allTypes: PokemonType[] = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "steel", "fairy"
];

// All 151 Pokémon
const pokemonList = ref<PokemonSummary[]>(ALL_GEN1_SUMMARY_LIST);
const selectedId = ref<number>(25); // Pikachu default
const searchTerm = ref<string>('');
const selectedType = ref<PokemonType | undefined>();

// Pagination state
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);

// Filtered list based on search and type
const filteredList = computed(() => {
  const query = searchTerm.value.toLowerCase().trim();
  const type = selectedType.value;

  return pokemonList.value.filter((p) => {
    const matchName = !query || p.name.toLowerCase().includes(query) || p.id.toString() === query;
    const matchType = !type || p.types.includes(type);
    return matchName && matchType;
  });
});

// Total pages calculation
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredList.value.length / pageSize.value));
});

// Paginated subset of Pokémon for the active page
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

// Reset page when search or type filter changes
watch([searchTerm, selectedType], () => {
  currentPage.value = 1;
});

// Calculate visible page buttons (max 5 buttons around current page)
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  return pages;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const resetFilters = () => {
  searchTerm.value = '';
  selectedType.value = undefined;
  currentPage.value = 1;
};

// Select a Pokémon: emits Event on shared in-memory EventBus
const selectPokemon = (pokemon: PokemonSummary) => {
  selectedId.value = pokemon.id;
  props.busService.eventBus.emit(new PokemonSelectedEvent(pokemon));
  props.busService.logTelemetry(
    'event',
    'PokemonSelectedEvent',
    'Vue-Catalog',
    { id: pokemon.id, name: pokemon.name }
  );
};

let unsubFilter: (() => void) | null = null;
let unsubSelect: (() => void) | null = null;
let unsubInspect: (() => void) | null = null;

const focusPokemonInCatalog = (pokemon: any) => {
  if (!pokemon?.id) return;
  selectedId.value = pokemon.id;

  // Check if Pokémon is in current filtered list
  let index = filteredList.value.findIndex((p) => p.id === pokemon.id);
  if (index === -1) {
    // If filtered out by active search or type filter, reset filters to show it
    searchTerm.value = '';
    selectedType.value = undefined;
    index = pokemonList.value.findIndex((p) => p.id === pokemon.id);
  }

  if (index !== -1) {
    const targetPage = Math.floor(index / pageSize.value) + 1;
    if (targetPage !== currentPage.value) {
      currentPage.value = targetPage;
    }
  }
};

onMounted(async () => {
  // Load full 151 Gen 1 list via CommandBus
  const res = await props.busService.commandBus.execute(new FetchPokemonListCommand({ limit: 151 }));
  if (res && res.success && res.value.length > 0) {
    pokemonList.value = res.value;
  }

  // Listen to filter updates from host Search bar
  unsubFilter = props.busService.eventBus.on(FilterChangedEvent, (filterData: any) => {
    searchTerm.value = filterData.search ?? '';
    selectedType.value = filterData.selectedType;
  });

  // Listen to selection & inspection updates from other widgets
  unsubSelect = props.busService.eventBus.on(PokemonSelectedEvent, focusPokemonInCatalog);
  unsubInspect = props.busService.eventBus.on(PokemonInspectedEvent, focusPokemonInCatalog);
});

onUnmounted(() => {
  if (unsubFilter) unsubFilter();
  if (unsubSelect) unsubSelect();
  if (unsubInspect) unsubInspect();
});
</script>

<style scoped>
.vue-catalog-root {
  min-height: 100%;
}
</style>
