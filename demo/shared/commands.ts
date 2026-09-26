import { Command } from "@collidor/command";
import { schemaCommand } from "@collidor/schema-command";
import { Result } from "@collidor/result";
import { z } from "zod";
import { AddTeamMemberInputSchema } from "./schemas";
import type {
  BattleAction,
  BattleRoundLog,
  BattleState,
  PokemonDetail,
  PokemonSummary,
  PokemonType,
  Team,
  TeamMember,
} from "./schemas";

// ==========================================
// Catalog & Details Commands
// ==========================================

export interface FetchPokemonListInput {
  offset?: number;
  limit?: number;
  search?: string;
  type?: PokemonType;
}

export class FetchPokemonListCommand extends Command<
  FetchPokemonListInput,
  Result<PokemonSummary[], string>
> {}
Object.defineProperty(FetchPokemonListCommand, "name", {
  value: "FetchPokemonListCommand",
  configurable: true,
});

export class FetchPokemonDetailCommand extends Command<
  { idOrName: string | number },
  Result<PokemonDetail, string>
> {}
Object.defineProperty(FetchPokemonDetailCommand, "name", {
  value: "FetchPokemonDetailCommand",
  configurable: true,
});

// ==========================================
// Schema-Validated Commands (Angular Team Builder)
// ==========================================

export const AddTeamMemberSchemaCommand = schemaCommand(
  AddTeamMemberInputSchema,
  z.object({
    success: z.boolean(),
    team: z.custom<Team>(),
    addedMember: z.custom<TeamMember>(),
    message: z.string(),
  }),
);
Object.defineProperty(AddTeamMemberSchemaCommand, "name", {
  value: "AddTeamMemberSchemaCommand",
  configurable: true,
});

export class RemoveTeamMemberCommand extends Command<
  { instanceId: string },
  Result<{ team: Team; removedId: string }, string>
> {}
Object.defineProperty(RemoveTeamMemberCommand, "name", {
  value: "RemoveTeamMemberCommand",
  configurable: true,
});

export class ClearTeamCommand extends Command<
  void,
  Result<{ team: Team }, string>
> {}
Object.defineProperty(ClearTeamCommand, "name", {
  value: "ClearTeamCommand",
  configurable: true,
});

export class GetTeamCommand extends Command<
  void,
  Result<Team, string>
> {}
Object.defineProperty(GetTeamCommand, "name", {
  value: "GetTeamCommand",
  configurable: true,
});

// ==========================================
// Battle Simulator Commands (Solid.js Iframe)
// ==========================================

export class StartBattleCommand extends Command<
  { playerPokemon: PokemonDetail; opponentPokemon?: PokemonDetail },
  Result<BattleState, string>
> {}
Object.defineProperty(StartBattleCommand, "name", {
  value: "StartBattleCommand",
  configurable: true,
});

export class SimulateBattleRoundCommand extends Command<
  { action: BattleAction; battleId: string },
  Result<{ state: BattleState; log: BattleRoundLog }, string>
> {}
Object.defineProperty(SimulateBattleRoundCommand, "name", {
  value: "SimulateBattleRoundCommand",
  configurable: true,
});

export class ForfeitBattleCommand extends Command<
  { battleId: string },
  Result<BattleState, string>
> {}
Object.defineProperty(ForfeitBattleCommand, "name", {
  value: "ForfeitBattleCommand",
  configurable: true,
});

export class DeployToBattleCommand extends Command<
  { pokemon: PokemonDetail },
  Result<{ deployed: boolean; pokemonName: string }, string>
> {}
Object.defineProperty(DeployToBattleCommand, "name", {
  value: "DeployToBattleCommand",
  configurable: true,
});
