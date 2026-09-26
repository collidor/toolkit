import { Result } from "@collidor/result";
import {
  PokemonDetail,
  PokemonDetailSchema,
  PokemonMove,
  PokemonStats,
  PokemonSummary,
  PokemonType,
} from "./schemas";
import {
  getArtworkUrl,
  getShowdownUrl,
  getThumbnailUrl,
  SEED_POKEMON_LIST,
} from "./seed";
import { ALL_GEN1_SUMMARY_LIST, GEN1_RAW_LIST } from "./gen1Data";

export interface PokemonPageResult {
  items: PokemonSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class PokedexClient {
  private memoryCache = new Map<number | string, PokemonDetail>();
  private inFlightRequests = new Map<string, Promise<Result<PokemonDetail, string>>>();

  constructor() {
    // Populate in-memory cache with instant seed data
    for (const p of SEED_POKEMON_LIST) {
      this.memoryCache.set(p.id, p);
      this.memoryCache.set(p.name.toLowerCase(), p);
    }
  }

  /**
   * Fetches Pokémon summaries with search and type filtering across all 151 original Pokémon.
   */
  async getPokemonList(filter?: {
    offset?: number;
    limit?: number;
    search?: string;
    type?: PokemonType;
  }): Promise<Result<PokemonSummary[], string>> {
    try {
      const search = filter?.search?.toLowerCase().trim() ?? "";
      const selectedType = filter?.type;

      let results: PokemonSummary[] = ALL_GEN1_SUMMARY_LIST;

      if (search) {
        results = results.filter((p) =>
          p.name.toLowerCase().includes(search) || p.id.toString() === search
        );
      }

      if (selectedType) {
        results = results.filter((p) => p.types.includes(selectedType));
      }

      const offset = filter?.offset ?? 0;
      const limit = filter?.limit ?? 151;
      const paginated = results.slice(offset, offset + limit);

      return Result.ok(paginated);
    } catch (err) {
      return Result.err(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Fetches paginated Pokémon summaries with total counts and pagination metadata.
   */
  async getPokemonPage(filter?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: PokemonType;
  }): Promise<Result<PokemonPageResult, string>> {
    try {
      const page = Math.max(1, filter?.page ?? 1);
      const pageSize = Math.max(1, filter?.pageSize ?? 12);
      const search = filter?.search?.toLowerCase().trim() ?? "";
      const selectedType = filter?.type;

      let filtered: PokemonSummary[] = ALL_GEN1_SUMMARY_LIST;

      if (search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(search) || p.id.toString() === search
        );
      }

      if (selectedType) {
        filtered = filtered.filter((p) => p.types.includes(selectedType));
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const validPage = Math.min(page, totalPages);
      const offset = (validPage - 1) * pageSize;
      const items = filtered.slice(offset, offset + pageSize);

      return Result.ok({
        items,
        total,
        page: validPage,
        pageSize,
        totalPages,
      });
    } catch (err) {
      return Result.err(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Fetches full Pokémon detail with 4-tier cache (RAM -> localStorage -> PokéAPI -> Offline Synthesizer).
   */
  async getPokemonDetail(idOrName: string | number): Promise<Result<PokemonDetail, string>> {
    const key = typeof idOrName === "string" ? idOrName.toLowerCase().trim() : idOrName;

    // 1. Tier 1: In-Memory Cache
    const inMem = this.memoryCache.get(key);
    if (inMem) {
      return Result.ok(inMem);
    }

    // 2. Tier 2: LocalStorage Cache
    const localKey = `collidor:pokedex:v1:${key}`;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem(localKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const validation = PokemonDetailSchema.safeParse(parsed);
          if (validation.success) {
            this.memoryCache.set(validation.data.id, validation.data);
            this.memoryCache.set(validation.data.name.toLowerCase(), validation.data);
            return Result.ok(validation.data);
          }
        }
      }
    } catch {
      // localStorage may fail in sandboxed iframes with opaque origin; safe to ignore
    }

    // 3. Request Coalescing: Join in-flight Promise if already running
    const flightKey = String(key);
    const existingFlight = this.inFlightRequests.get(flightKey);
    if (existingFlight) {
      return await existingFlight;
    }

    // 4. Tier 3: Fetch from PokéAPI REST with offline fallback
    const fetchPromise = (async (): Promise<Result<PokemonDetail, string>> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const url = `https://pokeapi.co/api/v2/pokemon/${key}`;
        const res = await fetch(url, { signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);

        if (res && res.ok) {
          const raw = await res.json();
          const id = raw.id as number;

          // Extract normalized stats
          const stats: PokemonStats = {
            hp: raw.stats.find((s: any) => s.stat.name === "hp")?.base_stat ?? 50,
            attack: raw.stats.find((s: any) => s.stat.name === "attack")?.base_stat ?? 50,
            defense: raw.stats.find((s: any) => s.stat.name === "defense")?.base_stat ?? 50,
            specialAttack: raw.stats.find((s: any) => s.stat.name === "special-attack")?.base_stat ?? 50,
            specialDefense: raw.stats.find((s: any) => s.stat.name === "special-defense")?.base_stat ?? 50,
            speed: raw.stats.find((s: any) => s.stat.name === "speed")?.base_stat ?? 50,
          };

          // Extract moves
          const moves: PokemonMove[] = (raw.moves ?? []).slice(0, 8).map((m: any, idx: number) => ({
            id: idx + 1,
            name: m.move.name,
            type: "normal",
            power: 50,
            accuracy: 100,
            pp: 20,
            priority: 0,
            damageClass: "physical" as const,
          }));

          const detail: PokemonDetail = {
            id,
            name: raw.name,
            types: raw.types.map((t: any) => t.type.name as PokemonType),
            baseExperience: raw.base_experience ?? 64,
            height: raw.height ?? 10,
            weight: raw.weight ?? 100,
            sprites: {
              thumbnail: getThumbnailUrl(id),
              artwork: getArtworkUrl(id),
              showdownFront: getShowdownUrl(id),
              showdownBack: getShowdownUrl(id, true),
            },
            stats,
            abilities: raw.abilities.map((a: any) => a.ability.name),
            moves: moves.length > 0 ? moves : [
              { id: 1, name: "tackle", type: "normal", power: 40, accuracy: 100, pp: 35, priority: 0, damageClass: "physical" },
            ],
            species: {
              genus: "Pokémon",
              flavorText: `A wild ${raw.name} observed in its natural habitat.`,
              color: "blue",
              evolutionChainId: null,
            },
          };

          this.memoryCache.set(detail.id, detail);
          this.memoryCache.set(detail.name.toLowerCase(), detail);
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem(localKey, JSON.stringify(detail));
            }
          } catch {
            // ignore
          }

          return Result.ok(detail);
        }

        // Tier 4: Offline Fallback Synthesis for Gen 1 Pokémon
        const entry = GEN1_RAW_LIST.find(
          (p) => p.id === Number(key) || p.name.toLowerCase() === String(key).toLowerCase()
        );

        if (entry) {
          const fallbackDetail: PokemonDetail = {
            id: entry.id,
            name: entry.name,
            types: entry.types,
            baseExperience: entry.baseExperience,
            height: 10,
            weight: 150,
            sprites: {
              thumbnail: getThumbnailUrl(entry.id),
              artwork: getArtworkUrl(entry.id),
              showdownFront: getShowdownUrl(entry.id),
              showdownBack: getShowdownUrl(entry.id, true),
            },
            stats: {
              hp: 55,
              attack: 60,
              defense: 50,
              specialAttack: 65,
              specialDefense: 55,
              speed: 60,
            },
            abilities: ["Standard Ability"],
            moves: [
              { id: 1, name: "tackle", type: "normal", power: 40, accuracy: 100, pp: 35, priority: 0, damageClass: "physical" },
              { id: 2, name: `${entry.types[0]}-strike`, type: entry.types[0], power: 65, accuracy: 100, pp: 20, priority: 0, damageClass: "special" },
            ],
            species: {
              genus: "Original Kanto Pokémon",
              flavorText: `A classic Generation 1 Pokémon originating from the Kanto region.`,
              color: "red",
              evolutionChainId: null,
            },
          };

          this.memoryCache.set(fallbackDetail.id, fallbackDetail);
          this.memoryCache.set(fallbackDetail.name.toLowerCase(), fallbackDetail);
          return Result.ok(fallbackDetail);
        }

        return Result.err(`Pokémon "${key}" could not be resolved.`);
      } catch (err) {
        return Result.err(err instanceof Error ? err.message : String(err));
      } finally {
        this.inFlightRequests.delete(flightKey);
      }
    })();

    this.inFlightRequests.set(flightKey, fetchPromise);
    return await fetchPromise;
  }
}

export const pokedexClient = new PokedexClient();
