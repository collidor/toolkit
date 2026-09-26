import { Event } from "@collidor/event";
import {
  BattleRoundLog,
  BattleState,
  PokemonDetail,
  PokemonSummary,
  PokemonType,
  Team,
  TeamMember,
  TelemetryEntry,
} from "./schemas";

// ==========================================
// Pokédex Navigation & Selection Events
// ==========================================

export class PokemonSelectedEvent extends Event<PokemonSummary | PokemonDetail> {}
Object.defineProperty(PokemonSelectedEvent, "name", {
  value: "PokemonSelectedEvent",
  configurable: true,
});

export class PokemonInspectedEvent extends Event<PokemonSummary | PokemonDetail> {}
Object.defineProperty(PokemonInspectedEvent, "name", {
  value: "PokemonInspectedEvent",
  configurable: true,
});

export class FilterChangedEvent extends Event<{
  search: string;
  selectedType?: PokemonType;
}> {}
Object.defineProperty(FilterChangedEvent, "name", {
  value: "FilterChangedEvent",
  configurable: true,
});

// ==========================================
// Team Builder Events (Cross-Iframe Broadcast)
// ==========================================

export class TeamUpdatedEvent extends Event<{
  team: Team;
  action: "added" | "removed" | "cleared";
  affectedMember?: TeamMember;
}> {}
Object.defineProperty(TeamUpdatedEvent, "name", {
  value: "TeamUpdatedEvent",
  configurable: true,
});

// ==========================================
// Battle Simulator Events (Solid.js Streams)
// ==========================================

export class BattleStateChangedEvent extends Event<BattleState> {}
Object.defineProperty(BattleStateChangedEvent, "name", {
  value: "BattleStateChangedEvent",
  configurable: true,
});

export class BattleRoundEmittedEvent extends Event<BattleRoundLog> {}
Object.defineProperty(BattleRoundEmittedEvent, "name", {
  value: "BattleRoundEmittedEvent",
  configurable: true,
});

// ==========================================
// Telemetry & DevTools Real-Time Event Feed
// ==========================================

export class TelemetryLoggedEvent extends Event<TelemetryEntry> {}
Object.defineProperty(TelemetryLoggedEvent, "name", {
  value: "TelemetryLoggedEvent",
  configurable: true,
});

// ==========================================
// View Coordination Events (Cross-Frame UI Focus)
// ==========================================

export class FocusViewEvent extends Event<{
  tab: "angular" | "solid";
  reason?: string;
}> {}
Object.defineProperty(FocusViewEvent, "name", {
  value: "FocusViewEvent",
  configurable: true,
});

// ==========================================
// Global Theme Coordination Events
// ==========================================

export class ThemeChangedEvent extends Event<{
  theme: "dark" | "light";
}> {}
Object.defineProperty(ThemeChangedEvent, "name", {
  value: "ThemeChangedEvent",
  configurable: true,
});

