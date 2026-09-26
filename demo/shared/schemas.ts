import { z } from "zod";

// ==========================================
// Pokémon Core Schemas
// ==========================================

export const PokemonTypeSchema = z.enum([
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "steel", "dark", "fairy",
]);
export type PokemonType = z.infer<typeof PokemonTypeSchema>;

export const PokemonStatsSchema = z.object({
  hp: z.number().int().min(1),
  attack: z.number().int().min(1),
  defense: z.number().int().min(1),
  specialAttack: z.number().int().min(1),
  specialDefense: z.number().int().min(1),
  speed: z.number().int().min(1),
});
export type PokemonStats = z.infer<typeof PokemonStatsSchema>;

export const PokemonSpritesSchema = z.object({
  thumbnail: z.string().url(),
  artwork: z.string().url(),
  showdownFront: z.string().url(),
  showdownBack: z.string().url(),
});
export type PokemonSprites = z.infer<typeof PokemonSpritesSchema>;

export const PokemonSummarySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  types: z.array(PokemonTypeSchema),
  sprites: PokemonSpritesSchema,
  baseExperience: z.number().optional().default(64),
});
export type PokemonSummary = z.infer<typeof PokemonSummarySchema>;

export const PokemonMoveSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  type: PokemonTypeSchema,
  power: z.number().nullable().default(50),
  accuracy: z.number().nullable().default(100),
  pp: z.number().int().default(20),
  priority: z.number().int().default(0),
  damageClass: z.enum(["physical", "special", "status"]).default("physical"),
});
export type PokemonMove = z.infer<typeof PokemonMoveSchema>;

export const PokemonSpeciesSchema = z.object({
  genus: z.string().default("Seed Pokémon"),
  flavorText: z.string().default("A strange seed was planted on its back at birth."),
  color: z.string().default("green"),
  evolutionChainId: z.number().nullable().default(null),
});
export type PokemonSpecies = z.infer<typeof PokemonSpeciesSchema>;

export const PokemonDetailSchema = PokemonSummarySchema.extend({
  height: z.number().default(7), // decimeters
  weight: z.number().default(69), // hectograms
  stats: PokemonStatsSchema,
  abilities: z.array(z.string()).default(["Overgrow"]),
  moves: z.array(PokemonMoveSchema).default([]),
  species: PokemonSpeciesSchema,
});
export type PokemonDetail = z.infer<typeof PokemonDetailSchema>;

// ==========================================
// Team Builder Schemas (Used by Angular + Analog)
// ==========================================

export const TeamMemberSchema = z.object({
  instanceId: z.string().uuid().or(z.string().min(1)),
  pokemon: PokemonDetailSchema,
  nickname: z.string().max(20).optional(),
  level: z.number().int().min(1).max(100).default(50),
  selectedMoves: z.array(PokemonMoveSchema).max(4).default([]),
  currentHp: z.number().int().min(0).optional(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const TeamSchema = z.object({
  id: z.string().default("default-team"),
  name: z.string().min(1).max(30).default("Champions"),
  members: z.array(TeamMemberSchema).max(6).default([]),
});
export type Team = z.infer<typeof TeamSchema>;

export const AddTeamMemberInputSchema = z.object({
  pokemon: PokemonDetailSchema,
  nickname: z.string().max(20).optional(),
  level: z.number().int().min(1).max(100).optional().default(50),
  selectedMoves: z.array(PokemonMoveSchema).max(4).optional(),
});
export type AddTeamMemberInput = z.infer<typeof AddTeamMemberInputSchema>;

// ==========================================
// Battle Simulator Schemas (Used by Solid.js)
// ==========================================

export const BattleActionSchema = z.object({
  type: z.enum(["move", "switch", "forfeit"]),
  move: PokemonMoveSchema.optional(),
  targetPokemonInstanceId: z.string().optional(),
});
export type BattleAction = z.infer<typeof BattleActionSchema>;

export const BattleCombatantSchema = z.object({
  instanceId: z.string(),
  pokemon: PokemonDetailSchema,
  currentHp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  isFainted: z.boolean().default(false),
  activeMove: PokemonMoveSchema.optional(),
});
export type BattleCombatant = z.infer<typeof BattleCombatantSchema>;

export const BattleRoundLogSchema = z.object({
  roundNumber: z.number().int().positive(),
  attackerName: z.string(),
  defenderName: z.string(),
  moveName: z.string(),
  damage: z.number().int().min(0),
  isCritical: z.boolean().default(false),
  effectiveness: z.number().default(1),
  defenderRemainingHp: z.number().int().min(0),
  message: z.string(),
});
export type BattleRoundLog = z.infer<typeof BattleRoundLogSchema>;

export const BattleStateSchema = z.object({
  id: z.string(),
  status: z.enum(["idle", "ready", "battling", "finished"]),
  roundNumber: z.number().int().min(0).default(0),
  player: BattleCombatantSchema.nullable(),
  opponent: BattleCombatantSchema.nullable(),
  logs: z.array(BattleRoundLogSchema).default([]),
  winner: z.enum(["player", "opponent"]).nullable().default(null),
});
export type BattleState = z.infer<typeof BattleStateSchema>;

// ==========================================
// Telemetry & DevTools Schemas (Used by React DevTools)
// ==========================================

export const TelemetryCategorySchema = z.enum(["command", "event", "port", "result"]);
export type TelemetryCategory = z.infer<typeof TelemetryCategorySchema>;

export const TelemetryEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  category: TelemetryCategorySchema,
  name: z.string(),
  origin: z.string(), // e.g. 'React-Shell', 'Vue-Catalog', 'Angular-Iframe'
  payload: z.any(),
  result: z.any().optional(),
  durationMs: z.number().optional(),
  success: z.boolean().default(true),
});
export type TelemetryEntry = z.infer<typeof TelemetryEntrySchema>;
