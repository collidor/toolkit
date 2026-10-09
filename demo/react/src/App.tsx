import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ALL_GEN1_SUMMARY_LIST,
  FetchPokemonListCommand,
  FilterChangedEvent,
  PokemonSelectedEvent,
  PokemonInspectedEvent,
  PokemonSummary,
  PokemonType,
} from "@demo/shared";
import type { EventBus } from "@collidor/event";
import type { AsyncCommandBus } from "@collidor/command";

interface AppProps {
  eventBus: EventBus;
  commandBus: AsyncCommandBus<any, any>;
}

const ALL_TYPES: PokemonType[] = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "steel", "fairy"
];

export const App: React.FC<AppProps> = ({ eventBus, commandBus }) => {
  const [pokemonList, setPokemonList] = useState<PokemonSummary[]>(ALL_GEN1_SUMMARY_LIST);
  const [selectedId, setSelectedId] = useState<number>(25); // Pikachu
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<PokemonType | undefined>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter list
  const filteredList = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return pokemonList.filter((p) => {
      const matchName = !query || p.name.toLowerCase().includes(query) || p.id.toString() === query;
      const matchType = !selectedType || p.types.includes(selectedType);
      return matchName && matchType;
    });
  }, [pokemonList, searchTerm, selectedType]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));

  // Paginated slice
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  // Select Pokemon & emit over EventBus across PortChannel
  const handleSelect = useCallback((pokemon: PokemonSummary) => {
    setSelectedId(pokemon.id);
    eventBus.emit(new PokemonSelectedEvent(pokemon));
  }, [eventBus]);

  // Subscribe to external events
  useEffect(() => {
    // 1. Fetch live 151 list via CommandBus
    commandBus.execute(new FetchPokemonListCommand({ limit: 151 }))
      .then((res) => {
        if (res?.success && res.value?.length > 0) {
          setPokemonList(res.value);
        }
      })
      .catch(() => {});

    // 2. Listen to filter events from host search bar
    const unsubFilter = eventBus.on(FilterChangedEvent, (data: any) => {
      if (typeof data.search === "string") setSearchTerm(data.search);
      setSelectedType(data.selectedType);
    });

    // 3. Listen to selection & inspection updates from Svelte, Angular, Solid
    const syncSelection = (data: any) => {
      if (data?.id) {
        setSelectedId(data.id);
      }
    };

    const unsubSelect = eventBus.on(PokemonSelectedEvent, syncSelection);
    const unsubInspect = eventBus.on(PokemonInspectedEvent, syncSelection);

    return () => {
      unsubFilter();
      unsubSelect();
      unsubInspect();
    };
  }, [eventBus, commandBus]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "8px", boxSizing: "border-box" }}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "#38bdf8" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }}></span>
          React 18 Catalog
        </div>
        <div style={{ fontSize: "10px", fontFamily: "monospace", padding: "2px 8px", borderRadius: "4px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#7dd3fc" }}>
          {filteredList.length} / 151 Pokémon
        </div>
      </div>

      {/* Local Filter Bar */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "6px 24px 6px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "#ffffff",
              fontSize: "12px",
              outline: "none",
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={selectedType || ""}
          onChange={(e) => setSelectedType(e.target.value ? (e.target.value as PokemonType) : undefined)}
          style={{
            padding: "6px 8px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(15, 23, 42, 0.8)",
            color: "#e2e8f0",
            fontSize: "11px",
            outline: "none",
            textTransform: "capitalize",
          }}
        >
          <option value="">All Types</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Scrollable Pokemon List */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "4px" }}>
        {paginatedList.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: isSelected ? "rgba(244, 63, 94, 0.18)" : "rgba(15, 23, 42, 0.4)",
                border: isSelected ? "1px solid rgba(244, 63, 94, 0.5)" : "1px solid rgba(255, 255, 255, 0.05)",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  background: "rgba(0, 0, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}>
                  <img
                    src={p.sprites.thumbnail}
                    alt={p.name}
                    style={{ width: "32px", height: "32px", objectFit: "contain" }}
                    loading="lazy"
                  />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: "700", textTransform: "capitalize", fontSize: "12px", color: isSelected ? "#f43f5e" : "#f1f5f9" }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>
                      #{p.id.toString().padStart(3, "0")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
                    {p.types.map((t) => (
                      <span key={t} className={`type-badge type-${t}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <span style={{
                fontWeight: "700",
                fontSize: "12px",
                color: isSelected ? "#f43f5e" : "#475569",
              }}>
                →
              </span>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: "12px" }}>
            No Pokémon match your search.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", userSelect: "none" }}>
        <span style={{ color: "#94a3b8" }}>
          Page {currentPage} of {totalPages}
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#cbd5e1",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              opacity: currentPage <= 1 ? 0.3 : 1,
            }}
          >
            ◀
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#cbd5e1",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages ? 0.3 : 1,
            }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
