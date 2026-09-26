import { EventBus } from "@collidor/event";
import { AsyncCommandBus, PortChannelPlugin } from "@collidor/command";
import { Injector } from "@collidor/injector";
import { Result } from "@collidor/result";
import {
  AddTeamMemberInput,
  AddTeamMemberSchemaCommand,
  BattleRoundEmittedEvent,
  ClearTeamCommand,
  connectIframePort,
  DeployToBattleCommand,
  FetchPokemonDetailCommand,
  FetchPokemonListCommand,
  FocusViewEvent,
  GetTeamCommand,
  PokemonDetail,
  PokemonInspectedEvent,
  PokemonSelectedEvent,
  pokedexClient,
  RemoveTeamMemberCommand,
  SEED_POKEMON_LIST,
  Team,
  TeamMember,
  TeamUpdatedEvent,
  TelemetryEntry,
  TelemetryLoggedEvent,
} from "@demo/shared";

class BusService {
  public portPlugin: PortChannelPlugin;
  public eventBus: EventBus;
  public commandBus: AsyncCommandBus<any, any>;
  public injector: Injector;

  private currentTeam: Team = {
    id: "showcase-team",
    name: "Kanto All-Stars",
    members: [
      {
        instanceId: "initial-pikachu",
        pokemon: SEED_POKEMON_LIST.find((p) => p.name === "pikachu")!,
        level: 50,
        selectedMoves: SEED_POKEMON_LIST.find((p) => p.name === "pikachu")!.moves,
      },
      {
        instanceId: "initial-charizard",
        pokemon: SEED_POKEMON_LIST.find((p) => p.name === "charmander")!,
        level: 48,
        selectedMoves: SEED_POKEMON_LIST.find((p) => p.name === "charmander")!.moves,
      },
    ],
  };

  private telemetryListeners: Array<(entry: TelemetryEntry) => void> = [];
  private telemetryLogs: TelemetryEntry[] = [];
  private availabilityListeners: Map<string, Set<(avail: boolean) => void>> = new Map();

  public isCommandAvailable(cmd: any): boolean {
    const name = typeof cmd === "string" ? cmd : cmd?.name;
    return !!(name && this.commandBus.handlers.has(name));
  }

  public onAvailabilityChange(cmd: any, listener: (avail: boolean) => void): () => void {
    const name = typeof cmd === "string" ? cmd : cmd?.name;
    if (!name) return () => {};

    if (!this.availabilityListeners.has(name)) {
      this.availabilityListeners.set(name, new Set());
    }
    const set = this.availabilityListeners.get(name)!;
    set.add(listener);

    // Initial notification
    listener(this.isCommandAvailable(name));

    return () => {
      set.delete(listener);
    };
  }

  private notifyAvailability(name: string, isAvailable: boolean): void {
    const listeners = this.availabilityListeners.get(name);
    if (listeners) {
      for (const listener of listeners) {
        listener(isAvailable);
      }
    }
  }

  public unregisterCommand(cmd: any): void {
    const name = typeof cmd === "string" ? cmd : cmd?.name;
    if (!name) return;
    this.commandBus.handlers.delete(name);
    this.commandBus.commandConstructor.delete(name);
    this.notifyAvailability(name, false);
  }

  constructor() {
    // 1. Initialize Cross-Context IPC Plugin
    this.portPlugin = new PortChannelPlugin({
      commandTimeout: 15000,
      ackTimeout: 5000,
      bufferTimeout: 10000,
    });

    // 2. Initialize Core Buses
    this.eventBus = new EventBus({
      channel: this.portPlugin,
    });

    this.commandBus = new AsyncCommandBus({
      plugin: this.portPlugin,
    });

    this.injector = new Injector();
    this.injector.register(EventBus, this.eventBus);
    this.injector.register(AsyncCommandBus, this.commandBus);

    // 3. Register Core Domain Handlers
    this.registerHandlers();

    // 4. Register Internal Telemetry Listener
    this.eventBus.on(TelemetryLoggedEvent, (entry) => {
      this.recordTelemetry(entry);
    });

    // Intercept selections & inspections to log telemetry
    this.eventBus.on(PokemonSelectedEvent, (pokemon) => {
      this.logTelemetry("event", "PokemonSelectedEvent", "Host/SameWindow", {
        id: pokemon.id,
        name: pokemon.name,
      });
    });

    this.eventBus.on(PokemonInspectedEvent, (pokemon) => {
      this.logTelemetry("event", "PokemonInspectedEvent", "CrossContext/Inspect", {
        id: pokemon.id,
        name: pokemon.name,
      });
    });

    this.eventBus.on(TeamUpdatedEvent, (update) => {
      this.logTelemetry("event", "TeamUpdatedEvent", "Angular-Iframe/Host", {
        action: update.action,
        teamSize: update.team.members.length,
      });
    });

    this.eventBus.on(BattleRoundEmittedEvent, (log) => {
      this.logTelemetry("event", "BattleRoundEmittedEvent", "Solid-Arena", {
        round: log.roundNumber,
        attacker: log.attackerName,
        defender: log.defenderName,
        damage: log.damage,
        isCrit: log.isCritical,
        summary: log.message,
      });
    });

    this.eventBus.on(FocusViewEvent, (event) => {
      this.logTelemetry("event", "FocusViewEvent", "CrossFrame", {
        targetTab: event.tab,
        reason: event.reason,
      });
    });
  }

  private registerHandlers(): void {
    // Fetch Pokemon List (Host always available)
    this.commandBus.register(FetchPokemonListCommand, async (cmd) => {
      const start = performance.now();
      const res = await pokedexClient.getPokemonList(cmd.data);
      this.logTelemetry(
        "command",
        "FetchPokemonListCommand",
        "Host",
        cmd.data,
        res.success ? `${res.value.length} items` : res.error,
        performance.now() - start,
        res.success,
      );
      return res;
    });

    // Fetch Pokemon Detail (Host always available)
    this.commandBus.register(FetchPokemonDetailCommand, async (cmd) => {
      const start = performance.now();
      const res = await pokedexClient.getPokemonDetail(cmd.data.idOrName);
      this.logTelemetry(
        "command",
        "FetchPokemonDetailCommand",
        "Host",
        cmd.data,
        res.success ? res.value.name : res.error,
        performance.now() - start,
        res.success,
      );
      return res;
    });

    // Initially register Angular handlers (default active tab is Angular)
    this.registerAngularHandlers();
  }

  public registerAngularHandlers(): void {
    if (this.isCommandAvailable(AddTeamMemberSchemaCommand)) {
      return;
    }

    // Add Team Member (Schema-Validated Command)
    this.commandBus.register(AddTeamMemberSchemaCommand, (cmd: any) => {
      const data = cmd.data as AddTeamMemberInput;
      const start = performance.now();
      if (this.currentTeam.members.length >= 6) {
        const err = "Team is full! Maximum 6 Pokémon allowed.";
        this.logTelemetry("command", "AddTeamMemberSchemaCommand", "Angular-Iframe", data, err, performance.now() - start, false);
        return {
          success: false,
          team: this.currentTeam,
          addedMember: null as any,
          message: err,
        };
      }

      const newMember: TeamMember = {
        instanceId: `member-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        pokemon: data.pokemon,
        nickname: data.nickname || data.pokemon.name,
        level: data.level ?? 50,
        selectedMoves: data.selectedMoves ?? data.pokemon.moves.slice(0, 4),
      };

      this.currentTeam = {
        ...this.currentTeam,
        members: [...this.currentTeam.members, newMember],
      };

      this.eventBus.emit(new TeamUpdatedEvent({
        team: this.currentTeam,
        action: "added",
        affectedMember: newMember,
      }));

      this.logTelemetry(
        "command",
        "AddTeamMemberSchemaCommand",
        "Angular-Iframe",
        data,
        `Added ${newMember.pokemon.name} (Total: ${this.currentTeam.members.length})`,
        performance.now() - start,
        true,
      );

      return {
        success: true,
        team: this.currentTeam,
        addedMember: newMember,
        message: `Successfully added ${newMember.pokemon.name}!`,
      };
    });

    // Get Team
    this.commandBus.register(GetTeamCommand, () => {
      return Result.ok(this.currentTeam);
    });

    // Remove Team Member
    this.commandBus.register(RemoveTeamMemberCommand, (cmd) => {
      const initialCount = this.currentTeam.members.length;
      this.currentTeam = {
        ...this.currentTeam,
        members: this.currentTeam.members.filter((m) => m.instanceId !== cmd.data.instanceId),
      };

      if (this.currentTeam.members.length < initialCount) {
        this.eventBus.emit(new TeamUpdatedEvent({
          team: this.currentTeam,
          action: "removed",
        }));
      }

      return Result.ok({ team: this.currentTeam, removedId: cmd.data.instanceId });
    });

    // Clear Team
    this.commandBus.register(ClearTeamCommand, () => {
      this.currentTeam = { ...this.currentTeam, members: [] };
      this.eventBus.emit(new TeamUpdatedEvent({ team: this.currentTeam, action: "cleared" }));
      return Result.ok({ team: this.currentTeam });
    });

    this.notifyAvailability(AddTeamMemberSchemaCommand.name, true);
    this.notifyAvailability(GetTeamCommand.name, true);
    this.notifyAvailability(RemoveTeamMemberCommand.name, true);
    this.notifyAvailability(ClearTeamCommand.name, true);

    this.logTelemetry("command", "HandlersRegistered", "Angular-Team", {
      handlers: ["AddTeamMemberSchemaCommand", "GetTeamCommand", "RemoveTeamMemberCommand", "ClearTeamCommand"],
      status: "active",
    });
  }

  public unregisterAngularHandlers(): void {
    if (!this.isCommandAvailable(AddTeamMemberSchemaCommand)) {
      return;
    }
    this.unregisterCommand(AddTeamMemberSchemaCommand);
    this.unregisterCommand(GetTeamCommand);
    this.unregisterCommand(RemoveTeamMemberCommand);
    this.unregisterCommand(ClearTeamCommand);

    this.logTelemetry(
      "command",
      "HandlersCleared",
      "Host",
      {
        target: "Angular-Team",
        cleared: ["AddTeamMemberSchemaCommand", "GetTeamCommand", "RemoveTeamMemberCommand", "ClearTeamCommand"],
        reason: "Angular view unmounted",
      },
      "Handlers unregistered from CommandBus",
      0,
      false,
    );
  }

  public registerSolidHandlers(): void {
    if (this.isCommandAvailable(DeployToBattleCommand)) {
      return;
    }

    this.commandBus.register(DeployToBattleCommand, (cmd) => {
      const start = performance.now();
      this.eventBus.emit(new PokemonSelectedEvent(cmd.data.pokemon));
      this.logTelemetry(
        "command",
        "DeployToBattleCommand",
        "Solid-Arena",
        cmd.data.pokemon.name,
        `Deployed ${cmd.data.pokemon.name.toUpperCase()} to Arena`,
        performance.now() - start,
        true,
      );
      return Result.ok({ deployed: true, pokemonName: cmd.data.pokemon.name });
    });

    this.notifyAvailability(DeployToBattleCommand.name, true);

    this.logTelemetry("command", "HandlersRegistered", "Solid-Arena", {
      handlers: ["DeployToBattleCommand"],
      status: "active",
    });
  }

  public unregisterSolidHandlers(): void {
    if (!this.isCommandAvailable(DeployToBattleCommand)) {
      return;
    }
    this.unregisterCommand(DeployToBattleCommand);

    this.logTelemetry(
      "command",
      "HandlersCleared",
      "Host",
      {
        target: "Solid-Arena",
        cleared: ["DeployToBattleCommand"],
        reason: "Solid view unmounted",
      },
      "Handler unregistered from CommandBus",
      0,
      false,
    );
  }

  public attachIframe(iframe: HTMLIFrameElement, name: string): () => void {
    this.logTelemetry("port", "PortConnectInitiated", "Host", { iframe: name });
    return connectIframePort({
      iframe,
      channel: this.portPlugin,
      name,
      onConnected: () => {
        this.logTelemetry("port", "PortHandshakeComplete", name, { status: "connected" });
      },
      onDisconnected: () => {
        this.logTelemetry("port", "PortDisconnected", name, { status: "disconnected" });
      },
    });
  }

  public logTelemetry(
    category: TelemetryEntry["category"],
    name: string,
    origin: string,
    payload: any,
    result?: any,
    durationMs?: number,
    success = true,
  ): void {
    const entry: TelemetryEntry = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      category,
      name,
      origin,
      payload,
      result,
      durationMs,
      success,
    };
    this.recordTelemetry(entry);
  }

  private recordTelemetry(entry: TelemetryEntry): void {
    this.telemetryLogs = [entry, ...this.telemetryLogs.slice(0, 99)];
    for (const listener of this.telemetryListeners) {
      listener(entry);
    }
  }

  public subscribeTelemetry(listener: (entry: TelemetryEntry) => void): () => void {
    this.telemetryListeners.push(listener);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter((l) => l !== listener);
    };
  }

  public getTelemetryLogs(): TelemetryEntry[] {
    return [...this.telemetryLogs];
  }

  public clearTelemetry(): void {
    this.telemetryLogs = [];
  }
}

export const busService = new BusService();
