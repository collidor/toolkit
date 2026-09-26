import {
  AddTeamMemberSchemaCommand,
  FetchPokemonDetailCommand,
  FetchPokemonListCommand,
  FilterChangedEvent,
  PokemonSelectedEvent,
  pokedexClient,
  SEED_POKEMON_LIST,
  TeamUpdatedEvent,
} from "./index.ts";
import { CommandBus } from "@collidor/command";
import { EventBus } from "@collidor/event";
import { Result } from "@collidor/result";

async function runTests() {
  console.log("Running shared contracts test...");

  // 1. Test CommandBus with FetchPokemonDetailCommand
  const commandBus = new CommandBus();
  commandBus.register(FetchPokemonDetailCommand, async (cmd) => {
    return await pokedexClient.getPokemonDetail(cmd.data.idOrName);
  });

  const pikachuResult = await commandBus.execute(new FetchPokemonDetailCommand({ idOrName: 25 }));
  if (!pikachuResult.success || pikachuResult.value.name !== "pikachu") {
    throw new Error(`Failed FetchPokemonDetailCommand for Pikachu: ${JSON.stringify(pikachuResult)}`);
  }
  console.log("✓ CommandBus + FetchPokemonDetailCommand succeeded:", pikachuResult.value.name);

  // 2. Test EventBus with PokemonSelectedEvent
  const eventBus = new EventBus();
  let receivedPokemonName = "";
  eventBus.on(PokemonSelectedEvent, (data: any) => {
    receivedPokemonName = data.name;
  });

  eventBus.emit(new PokemonSelectedEvent(pikachuResult.value));
  if (receivedPokemonName !== "pikachu") {
    throw new Error(`EventBus did not receive PokemonSelectedEvent: ${receivedPokemonName}`);
  }
  console.log("✓ EventBus + PokemonSelectedEvent succeeded:", receivedPokemonName);

  // 3. Test SchemaCommand input validation
  const validCmd = new AddTeamMemberSchemaCommand({
    pokemon: SEED_POKEMON_LIST[0],
    level: 50,
  });
  if (validCmd.data.pokemon.name !== "bulbasaur") {
    throw new Error("SchemaCommand failed to parse valid input");
  }
  console.log("✓ SchemaCommand validated input:", validCmd.data.pokemon.name);

  // 4. Test PokedexClient pagination & search
  const listResult = await pokedexClient.getPokemonList({ search: "char" });
  if (!listResult.success || listResult.value.length === 0 || listResult.value[0].name !== "charmander") {
    throw new Error(`Failed search: ${JSON.stringify(listResult)}`);
  }
  console.log("✓ PokedexClient search succeeded:", listResult.value[0].name);

  // 5. Test Result Monad boundary safety
  const okRes = Result.ok({ id: 1 });
  if (!Result.isResult(okRes) || !okRes.success) {
    throw new Error("Result.isResult failed");
  }
  console.log("✓ Result Monad cross-boundary check succeeded");

  console.log("ALL TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  if (typeof Deno !== "undefined") {
    Deno.exit(1);
  }
});
