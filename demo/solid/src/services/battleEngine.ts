import { ObservableEventBus } from "@collidor/observable-event";
import { ObservableCommandBus } from "@collidor/observable-command";
import { AsyncCommandBus, PortChannelPlugin } from "@collidor/command";
import { EventBus } from "@collidor/event";
import { Subject, Observable } from "rxjs";
import {
  AddTeamMemberSchemaCommand,
  BattleRoundEmittedEvent,
  BattleStateChangedEvent,
  GetTeamCommand,
  initializeIframePort,
  PokemonInspectedEvent,
  SEED_POKEMON_LIST,
  ThemeChangedEvent,
} from "@demo/shared";
import type {
  BattleCombatant,
  BattleRoundLog,
  BattleState,
  PokemonDetail,
  PokemonMove,
  Team,
} from "@demo/shared";

export class BattleEngine {
  public portPlugin: PortChannelPlugin;
  public eventBus: EventBus;
  public observableEventBus: ObservableEventBus;
  public commandBus: ObservableCommandBus;
  public asyncCommandBus: AsyncCommandBus<any, any>;

  // RxJS Stream for battle animation events
  private roundSubject = new Subject<BattleRoundLog>();
  public roundStream$: Observable<BattleRoundLog> = this.roundSubject.asObservable();

  public isConnected = false;
  private onConnectListeners: Array<(connected: boolean) => void> = [];

  constructor() {
    this.portPlugin = new PortChannelPlugin({
      commandTimeout: 15000,
      ackTimeout: 5000,
      bufferTimeout: 10000,
    });

    this.eventBus = new EventBus({
      channel: this.portPlugin,
    });

    this.observableEventBus = new ObservableEventBus(this.eventBus);
    this.commandBus = new ObservableCommandBus();
    this.asyncCommandBus = new AsyncCommandBus({
      plugin: this.portPlugin,
    });

    this.eventBus.on(ThemeChangedEvent, (event: any) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("light", event.theme === "light");
        document.documentElement.classList.toggle("dark", event.theme === "dark");
        document.body.style.backgroundColor = event.theme === "light" ? "#f8fafc" : "#090d16";
        document.body.style.color = event.theme === "light" ? "#0f172a" : "#f8fafc";
      }
    });

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("collidor:theme");
        if (saved === "light") {
          document.documentElement.classList.add("light");
          document.body.style.backgroundColor = "#f8fafc";
          document.body.style.color = "#0f172a";
        }
      }
    } catch {
      // ignore
    }

    this.connectToHost();
  }

  public inspectPokemon(pokemon: PokemonDetail): void {
    this.eventBus.emit(new PokemonInspectedEvent(pokemon));
  }

  public async catchOpponent(pokemon: PokemonDetail): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.asyncCommandBus.execute(
        new AddTeamMemberSchemaCommand({
          pokemon,
          nickname: `Wild ${pokemon.name}`,
          level: 50,
        })
      );
      if (res.success) {
        return { success: true, message: `Caught ${pokemon.name}! Added to Angular party.` };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }

  public async fetchTeam(): Promise<Team | null> {
    try {
      const res = await this.asyncCommandBus.execute(new GetTeamCommand());
      if (res.success) {
        return res.value;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async connectToHost(): Promise<void> {
    try {
      await initializeIframePort(this.portPlugin);
      this.isConnected = true;
      this.onConnectListeners.forEach((l) => l(true));
    } catch (err) {
      console.error("Solid battle arena failed to connect to host:", err);
    }
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.onConnectListeners.push(listener);
    listener(this.isConnected);
    return () => {
      this.onConnectListeners = this.onConnectListeners.filter((l) => l !== listener);
    };
  }

  public createInitialState(player?: PokemonDetail, opponent?: PokemonDetail): BattleState {
    const p = player || SEED_POKEMON_LIST.find((x) => x.name === "pikachu") || SEED_POKEMON_LIST[0];
    const opp = opponent || SEED_POKEMON_LIST.find((x) => x.name === "gengar") || SEED_POKEMON_LIST[1];

    const playerCombatant: BattleCombatant = {
      instanceId: `player-${p.id}`,
      pokemon: p,
      currentHp: p.stats.hp,
      maxHp: p.stats.hp,
      isFainted: false,
    };

    const opponentCombatant: BattleCombatant = {
      instanceId: `opponent-${opp.id}`,
      pokemon: opp,
      currentHp: opp.stats.hp,
      maxHp: opp.stats.hp,
      isFainted: false,
    };

    return {
      id: `battle-${Date.now()}`,
      status: "ready",
      roundNumber: 0,
      player: playerCombatant,
      opponent: opponentCombatant,
      logs: [],
      winner: null,
    };
  }

  public calculateDamage(attacker: BattleCombatant, defender: BattleCombatant, move: PokemonMove): { damage: number; isCritical: boolean } {
    const power = move.power || 40;
    const isCritical = Math.random() < 0.15;
    const critMultiplier = isCritical ? 1.5 : 1.0;

    const base = Math.floor(
      ((2 * 50 / 5 + 2) * power * (attacker.pokemon.stats.attack / defender.pokemon.stats.defense)) / 50 + 2
    );

    const variation = 0.85 + Math.random() * 0.15;
    const damage = Math.max(5, Math.floor(base * critMultiplier * variation));

    return { damage, isCritical };
  }

  public executeTurn(state: BattleState, playerMove: PokemonMove): BattleState {
    if (!state.player || !state.opponent || state.status === "finished") {
      return state;
    }

    const roundNum = state.roundNumber + 1;
    const player = { ...state.player };
    const opponent = { ...state.opponent };
    const newLogs: BattleRoundLog[] = [...state.logs];

    // 1. Player Attack
    const playerHit = this.calculateDamage(player, opponent, playerMove);
    opponent.currentHp = Math.max(0, opponent.currentHp - playerHit.damage);
    opponent.isFainted = opponent.currentHp === 0;

    const playerLog: BattleRoundLog = {
      roundNumber: roundNum,
      attackerName: player.pokemon.name,
      defenderName: opponent.pokemon.name,
      moveName: playerMove.name,
      damage: playerHit.damage,
      isCritical: playerHit.isCritical,
      effectiveness: 1.0,
      defenderRemainingHp: opponent.currentHp,
      message: `${player.pokemon.name.toUpperCase()} used ${playerMove.name.toUpperCase()}! ${
        playerHit.isCritical ? "A critical hit! " : ""
      }Dealt ${playerHit.damage} DMG.`,
    };

    newLogs.unshift(playerLog);
    this.roundSubject.next(playerLog);
    this.eventBus.emit(new BattleRoundEmittedEvent(playerLog));

    // Check if opponent fainted
    if (opponent.isFainted) {
      const finishedState: BattleState = {
        ...state,
        roundNumber: roundNum,
        status: "finished",
        player,
        opponent,
        logs: newLogs,
        winner: "player",
      };
      this.eventBus.emit(new BattleStateChangedEvent(finishedState));
      return finishedState;
    }

    // 2. Opponent AI Counter-Attack
    const oppMoves = opponent.pokemon.moves.length > 0 ? opponent.pokemon.moves : [playerMove];
    const opponentMove = oppMoves[Math.floor(Math.random() * oppMoves.length)];

    const oppHit = this.calculateDamage(opponent, player, opponentMove);
    player.currentHp = Math.max(0, player.currentHp - oppHit.damage);
    player.isFainted = player.currentHp === 0;

    const oppLog: BattleRoundLog = {
      roundNumber: roundNum,
      attackerName: opponent.pokemon.name,
      defenderName: player.pokemon.name,
      moveName: opponentMove.name,
      damage: oppHit.damage,
      isCritical: oppHit.isCritical,
      effectiveness: 1.0,
      defenderRemainingHp: player.currentHp,
      message: `Opponent ${opponent.pokemon.name.toUpperCase()} countered with ${opponentMove.name.toUpperCase()}! Dealt ${
        oppHit.damage
      } DMG.`,
    };

    newLogs.unshift(oppLog);
    this.roundSubject.next(oppLog);
    this.eventBus.emit(new BattleRoundEmittedEvent(oppLog));

    const nextStatus = player.isFainted ? "finished" : "battling";
    const winner = player.isFainted ? "opponent" : null;

    const nextState: BattleState = {
      ...state,
      roundNumber: roundNum,
      status: nextStatus,
      player,
      opponent,
      logs: newLogs,
      winner,
    };

    this.eventBus.emit(new BattleStateChangedEvent(nextState));
    return nextState;
  }
}

export const battleEngine = new BattleEngine();
