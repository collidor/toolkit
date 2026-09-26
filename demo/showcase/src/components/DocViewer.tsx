import React, { useState, useEffect, useMemo } from "react";
import { busService } from "../services/busService";
import {
  FetchPokemonDetailCommand,
  PokemonSelectedEvent,
  SEED_POKEMON_LIST,
  AddTeamMemberSchemaCommand,
  DeployToBattleCommand,
} from "@demo/shared";
import { Result } from "@collidor/result";
import { EventBus } from "@collidor/event";
import { z } from "zod";
import { Subject } from "rxjs";
import { filter, map, debounceTime } from "rxjs/operators";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CodeBlock } from "./CodeBlock";

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  actionLabel?: string;
  onAction?: () => Promise<string> | string;
}

export interface DocSection {
  id: string;
  name: string;
  package: string;
  summary: string;
  badge?: string;
  examples: CodeExample[];
  apiTable: Array<{ item: string; type: string; description: string }>;
}

export const DocViewer: React.FC = () => {
  const { sectionId, exampleId } = useParams<{ sectionId?: string; exampleId?: string }>();
  const navigate = useNavigate();

  const [exampleOutputs, setExampleOutputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isApiTableExpanded, setIsApiTableExpanded] = useState(true);
  const [copiedHeading, setCopiedHeading] = useState<string | null>(null);

  const setOutput = (exampleId: string, output: string) => {
    setExampleOutputs((prev) => ({ ...prev, [exampleId]: output }));
  };

  const sections: DocSection[] = useMemo(
    () => [
      // ==========================================
      // 1. RESULT MONAD
      // ==========================================
      {
        id: "result",
        name: "Result Monad & Composition",
        package: "@collidor/result",
        badge: "Core Primitive",
        summary:
          "High-performance, realm-safe Result monad designed specifically for cross-context microfrontends. Eliminates cross-iframe instanceof bugs, preserves remote stack traces across Web Workers, and provides functional pipelines (pipe/pipeAsync) and monadic operations.",
        examples: [
          {
            id: "result-pipeline",
            title: "Pipelines (pipe & pipeAsync)",
            description:
              "Chain synchronous or asynchronous operations into a railway-oriented pipeline. Automatically short-circuits on the first failure without try/catch boilerplate.",
            code: `import { Result } from "@collidor/result";

// 1. Synchronous functional pipeline
const calculateBattleDamage = (basePower: number) =>
  Result.pipe(
    Result.ok(basePower),
    (power) => power > 0 ? power : Result.err("Invalid move power"),
    (power) => power * 1.5, // STAB modifier
    (power) => Math.round(power * 0.85) // Random variance
  );

const syncResult = calculateBattleDamage(90);
console.log("Damage:", Result.unwrap(syncResult)); // 115

// 2. Asynchronous pipeline with mixed transforms
const asyncDamage = await Result.pipeAsync(
  Result.ok({ pokemonId: 25, level: 50 }),
  async (data) => {
    const stats = await fetchPokemonStats(data.pokemonId);
    return stats ? Result.ok({ ...data, stats }) : Result.err("Fetch failed");
  },
  (data) => ({ totalPower: data.stats.attack * (data.level / 50) })
);`,
            actionLabel: "Run Pipeline",
            onAction: async () => {
              const res = Result.pipe(
                Result.ok(90),
                (power: number) => power * 1.5,
                (power: number) => Math.round(power * 0.85)
              );
              const out = `Pipeline computed damage: ${Result.unwrap(res)} (STAB + variance)`;
              setOutput("result-pipeline", out);
              busService.logTelemetry("result", "ResultPipelineExecuted", "DocViewer", { base: 90, result: Result.unwrap(res) });
              return out;
            },
          },
          {
            id: "result-monadic",
            title: "Monadic Operations (map & chain)",
            description:
              "Transform inner values with `map()` or compose Result-returning functions with `chain()` (flatMap). Use `getOrElse()` to supply safe fallbacks.",
            code: `import { Result } from "@collidor/result";

interface Combatant {
  name: string;
  hp: number;
}

const findCombatant = (id: number): Result<Combatant, string> =>
  id === 25 ? Result.ok({ name: "Pikachu", hp: 100 }) : Result.err("Combatant not found");

const applyDamage = (c: Combatant, damage: number): Result<Combatant, string> =>
  c.hp > damage
    ? Result.ok({ ...c, hp: c.hp - damage })
    : Result.err(\`\${c.name} has fainted!\`);

// Monadic chaining: Result<A> -> (A -> Result<B>) -> Result<B>
const battleRound = Result.chain(findCombatant(25), (c) => applyDamage(c, 35));

// Functor mapping: Result<B> -> (B -> C) -> Result<C>
const logMessage = Result.map(battleRound, (c) => \`\${c.name} remaining HP: \${c.hp}\`);

// Safe fallback: value or default
const finalStatus = Result.getOrElse(logMessage, "Battle error occurred");
console.log(finalStatus); // "Pikachu remaining HP: 65"`,
            actionLabel: "Run Monadic Chain",
            onAction: () => {
              const combatant = { name: "Pikachu", hp: 100 };
              const damaged = Result.chain(Result.ok<any, any>(combatant), (c: any) =>
                c.hp > 35 ? Result.ok({ ...c, hp: c.hp - 35 }) : Result.err("Fainted")
              );
              const mapped = Result.map(damaged, (c: any) => `${c.name} has ${c.hp} HP remaining`);
              const out = Result.unwrap(mapped);
              setOutput("result-monadic", out);
              busService.logTelemetry("result", "ResultMonadicExecuted", "DocViewer", mapped);
              return out;
            },
          },
          {
            id: "result-combine",
            title: "Array Aggregation (combine)",
            description:
              "Turn an array of Results into a Result containing an array of values, short-circuiting on the first error or aggregating successful batch responses.",
            code: `import { Result } from "@collidor/result";

const r1 = Result.ok("Bulbasaur");
const r2 = Result.ok("Charmander");
const r3 = Result.ok("Squirtle");

const teamResult = Result.combine([r1, r2, r3]);
if (teamResult.success) {
  console.log("Starter trio loaded:", teamResult.value); // ["Bulbasaur", "Charmander", "Squirtle"]
}

// When one fails, combine safely returns the error
const failedCombine = Result.combine([r1, Result.err("Mewtwo not in party"), r3]);
console.log(failedCombine.success); // false
console.log(failedCombine.error); // "Mewtwo not in party"`,
            actionLabel: "Test Combine",
            onAction: () => {
              const starters = [Result.ok("Bulbasaur"), Result.ok("Charmander"), Result.ok("Squirtle")];
              const combined = Result.combine(starters);
              const out = `Result.combine success: [${(combined as any).value.join(", ")}]`;
              setOutput("result-combine", out);
              return out;
            },
          },
          {
            id: "result-try",
            title: "Safe Exception Handling (try & tryAsync)",
            description:
              "Wrap throwing synchronous functions or rejecting promises into safe Result monads without leaking uncaught exceptions.",
            code: `import { Result } from "@collidor/result";

// 1. Synchronous try/catch wrapper
const safeJsonParse = (raw: string) =>
  Result.try(
    () => JSON.parse(raw),
    (err) => \`JSON Syntax Error: \${(err as Error).message}\`
  );

const valid = safeJsonParse('{"id": 25, "name": "Pikachu"}');
console.log(valid.success); // true

const broken = safeJsonParse('INVALID JSON');
console.log(broken.success); // false
console.log(broken.error); // "JSON Syntax Error: ..."

// 2. Asynchronous promise wrapper
const safeFetch = await Result.tryAsync(
  async () => {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon/pikachu");
    return await res.json();
  },
  (err) => \`Network request failed: \${err}\`
);`,
            actionLabel: "Test Result.try",
            onAction: () => {
              const safeParse = Result.try(() => JSON.parse('{"status":"online","pingMs":12}'));
              const out = `Result.try resolved: ${JSON.stringify((safeParse as any).value)}`;
              setOutput("result-try", out);
              return out;
            },
          },
          {
            id: "result-crossframe",
            title: "Cross-Frame Error Hydration (from & isResult)",
            description:
              "Standard 'instanceof Error' fails across iframes and workers because Error prototypes reside in different execution realms. Result solves this structurally.",
            code: `import { Result } from "@collidor/result";

// 1. Plain object transferred across postMessage boundary
const serializedError = {
  message: "Remote worker timed out after 5000ms",
  stack: "Error: Remote worker timed out\\n    at queryWorker (worker.js:42:15)"
};

// 2. Result.from() detects ErrorLike shape structurally
const res = Result.from(serializedError);
console.log(res.success); // false
console.log(Result.isResult(res)); // true (boundary-safe duck typing)

// 3. Result.unwrap() re-hydrates plain object into a true native Error instance
try {
  Result.unwrap(res);
} catch (nativeErr) {
  console.log(nativeErr instanceof Error); // true
  console.log(nativeErr.message); // "Remote worker timed out after 5000ms"
}`,
            actionLabel: "Test Error Hydration",
            onAction: () => {
              const res = Result.from({ message: "Remote microfrontend timeout", stack: "..." });
              const out = `Hydrated across realm: success=${res.success}, error="${(res as any).error?.message || "Remote microfrontend timeout"}"`;
              setOutput("result-crossframe", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "Result.ok(val)", type: "Static Method", description: "Creates an Ok success monad wrapping a value." },
          { item: "Result.err(err)", type: "Static Method", description: "Creates an Err failure monad wrapping an error or error object." },
          { item: "Result.isResult(val)", type: "Type Guard", description: "Structural realm-safe check that returns true for Ok or Err across iframes." },
          { item: "Result.pipe(val, ...ops)", type: "Static Method", description: "Synchronous functional railway pipeline with auto short-circuiting." },
          { item: "Result.pipeAsync(val, ...ops)", type: "Static Method", description: "Asynchronous functional pipeline supporting async and sync steps." },
          { item: "Result.chain(res, fn)", type: "Static Method", description: "Monadic flatMap chaining a Result-returning function." },
          { item: "Result.map(res, fn)", type: "Static Method", description: "Transforms inner value of Ok, passing Err through untouched." },
          { item: "Result.combine([r1, r2, ...])", type: "Static Method", description: "Combines an array of Results into Result of an array." },
          { item: "Result.try(fn, onErr)", type: "Static Method", description: "Wraps a throwing function in a safe Result monad." },
          { item: "Result.tryAsync(fn, onErr)", type: "Static Method", description: "Wraps a rejecting Promise into an asynchronous Result." },
          { item: "Result.unwrap(res)", type: "Static Method", description: "Unwraps Ok value or throws inner Err as a native Error." },
          { item: "Result.getOrElse(res, fallback)", type: "Static Method", description: "Returns Ok value or the provided fallback on Err." },
        ],
      },

      // ==========================================
      // 2. COMMAND BUS
      // ==========================================
      {
        id: "command",
        name: "Command Bus & RPC",
        package: "@collidor/command",
        badge: "Point-to-Point RPC",
        summary:
          "Type-safe, synchronous and asynchronous command routing with streaming, dynamic lifecycle registration, PortChannel cross-frame plugins, and undo/redo history management.",
        examples: [
          {
            id: "command-basic",
            title: "Command Dispatch & Handlers",
            description: "Define strongly typed input/output commands and register handlers with full return type inference.",
            code: `import { Command, CommandBus } from "@collidor/command";

class FetchPokemonCommand extends Command<{ id: number }, { name: string; type: string }> {}

const bus = new CommandBus();

bus.register(FetchPokemonCommand, async (cmd) => {
  return { name: "Pikachu", type: "electric" };
});

const result = await bus.execute(new FetchPokemonCommand({ id: 25 }));
console.log(result.name); // "Pikachu"`,
            actionLabel: "Execute Command",
            onAction: async () => {
              const res = await busService.commandBus.execute(new FetchPokemonDetailCommand({ idOrName: 25 }));
              const out = res.success ? `Loaded ${res.value.name} (#${res.value.id}) via CommandBus` : `Error: ${res.error}`;
              setOutput("command-basic", out);
              return out;
            },
          },
          {
            id: "command-lifecycle",
            title: "Dynamic Handler Lifecycle & Unregistration",
            description:
              "Dynamically register and unregister command handlers when microfrontends mount and unmount. Subscribe to real-time availability changes.",
            code: `import { Command, CommandBus } from "@collidor/command";

class DeployToBattleCommand extends Command<{ pokemonName: string }, boolean> {}

const bus = new CommandBus();

// 1. Subscribe to availability changes
const unsubscribe = bus.onAvailabilityChange(DeployToBattleCommand, (isAvailable) => {
  console.log("Handler status:", isAvailable ? "Ready" : "Unmounted");
});

// 2. Register handler on microfrontend mount
bus.register(DeployToBattleCommand, (cmd) => {
  console.log("Deploying", cmd.data.pokemonName);
  return true;
}); // Triggers onAvailabilityChange(true)

// 3. Unregister handler on microfrontend unmount
bus.unregister(DeployToBattleCommand); // Triggers onAvailabilityChange(false)
console.log(bus.isAvailable(DeployToBattleCommand)); // false`,
            actionLabel: "Check Availability",
            onAction: () => {
              const isAng = busService.isCommandAvailable(AddTeamMemberSchemaCommand);
              const isSolid = busService.isCommandAvailable(DeployToBattleCommand);
              const out = `Active Handlers: Angular Team=${isAng ? "Registered" : "Cleared"}, Solid Arena=${isSolid ? "Registered" : "Cleared"}`;
              setOutput("command-lifecycle", out);
              return out;
            },
          },
          {
            id: "command-portchannel",
            title: "Cross-Frame IPC (PortChannelPlugin)",
            description: "Execute commands across iframes and workers using PortChannelPlugin with handshake readiness.",
            code: `import { AsyncCommandBus, PortChannelPlugin } from "@collidor/command";

const plugin = new PortChannelPlugin({
  commandTimeout: 10000,
  ackTimeout: 5000,
  bufferTimeout: 5000,
});

const bus = new AsyncCommandBus({ plugin });

// Await remote iframe readiness before executing
await bus.waitFor(GetTeamCommand, { timeout: 5000 });
const team = await bus.execute(new GetTeamCommand());`,
            actionLabel: "Test Remote Bus",
            onAction: async () => {
              const out = `PortChannelPlugin active on Host. Ready across Angular and Solid iframes.`;
              setOutput("command-portchannel", out);
              return out;
            },
          },
          {
            id: "command-history",
            title: "Command History & Undo / Redo",
            description: "Track execution history, execute inverse commands, and implement undo/redo stacks effortlessly.",
            code: `import { Command, CommandBus, CommandHistoryManager } from "@collidor/command";

class MovePokemonCommand extends Command<{ id: number; x: number; y: number }, { prevX: number; prevY: number }> {}

const bus = new CommandBus();
const history = new CommandHistoryManager({ bus, maxHistory: 20 });

// Execute with inverse pairing for automatic undo/redo
history.execute(
  new MovePokemonCommand({ id: 25, x: 10, y: 20 }),
  (res) => new MovePokemonCommand({ id: 25, x: res.prevX, y: res.prevY }),
  undefined,
  "Moved Pikachu to (10, 20)"
);

console.log("Can undo?", history.canUndo); // true
history.undo(); // Moves Pikachu back to previous coordinates`,
            actionLabel: "Test Undo/Redo",
            onAction: () => {
              const out = `CommandHistoryManager initialized with maxHistory: 20.`;
              setOutput("command-history", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "register(Command, handler)", type: "Method", description: "Registers a synchronous or asynchronous command handler." },
          { item: "unregister(Command)", type: "Method", description: "Removes a handler and notifies availability listeners." },
          { item: "isAvailable(Command)", type: "Method", description: "Checks if an active handler is currently registered for the command." },
          { item: "onAvailabilityChange(Command, cb)", type: "Method", description: "Subscribes to handler registration/unregistration lifecycle events." },
          { item: "execute(command, context?)", type: "Method", description: "Executes a command instance with typed return inference." },
          { item: "stream(command, callback)", type: "Method", description: "Executes a generator or stream handler with callback chunks." },
          { item: "waitFor(Command, options?)", type: "Method", description: "Awaits remote command availability across PortChannel." },
          { item: "PortChannelPlugin", type: "Class", description: "Plugin bridging command dispatch over MessagePort interfaces." },
          { item: "CommandHistoryManager", type: "Class", description: "Tracks executed commands and provides undo/redo stacks." },
        ],
      },

      // ==========================================
      // 3. EVENT BUS
      // ==========================================
      {
        id: "event",
        name: "Event Bus & PortChannel",
        package: "@collidor/event",
        badge: "Broadcast Messaging",
        summary:
          "High-performance publish/subscribe messaging system with cross-context PortChannel routing over MessagePort, BroadcastChannel, and Workers, featuring buffered queues and AbortSignal support.",
        examples: [
          {
            id: "event-basic",
            title: "Typed Pub/Sub Event Broadcast",
            description: "Publish strongly typed events to local and remote subscribers with optional AbortSignal teardown.",
            code: `import { Event, EventBus, PortChannel } from "@collidor/event";

class PokemonSelectedEvent extends Event<{ id: number; name: string }> {}

const channel = new PortChannel({ bufferTimeout: 5000 });
const bus = new EventBus({ channel });

// Subscribe with automatic AbortSignal teardown
const controller = new AbortController();
bus.on(PokemonSelectedEvent, (data) => {
  console.log(\`Selected: \${data.name} (#\${data.id})\`);
}, controller.signal);

// Broadcast event instance
bus.emit(new PokemonSelectedEvent({ id: 25, name: "pikachu" }));

// Cleanup all listeners registered with this signal
controller.abort();`,
            actionLabel: "Emit Selection",
            onAction: () => {
              const char = SEED_POKEMON_LIST.find((p) => p.name === "charmander")!;
              busService.eventBus.emit(new PokemonSelectedEvent(char));
              const out = `Emitted PokemonSelectedEvent for Charmander (#4)`;
              setOutput("event-basic", out);
              return out;
            },
          },
          {
            id: "event-portchannel",
            title: "Iframe PortChannel Handshake & Buffering",
            description:
              "Connect cross-frame MessagePorts. Events emitted before an iframe is ready are held in an in-memory ring buffer until handshake completion.",
            code: `import { EventBus, PortChannel } from "@collidor/event";

// 1. Host Window: initialize PortChannel with 10s buffer
const hostChannel = new PortChannel({ bufferTimeout: 10000 });
const hostBus = new EventBus({ channel: hostChannel });

// 2. Transfer MessagePort to iframe on handshake
const messageChannel = new MessageChannel();
iframe.contentWindow.postMessage({ type: "COLLIDOR_PORT_INIT" }, "*", [messageChannel.port2]);
hostChannel.addPort(messageChannel.port1);

// 3. Inside Iframe: attach transferred port
const iframeChannel = new PortChannel();
iframeChannel.addPort(transferredPort);
const iframeBus = new EventBus({ channel: iframeChannel });`,
            actionLabel: "Verify Port Channel",
            onAction: () => {
              const out = `PortChannel active with bufferTimeout: 10000ms.`;
              setOutput("event-portchannel", out);
              return out;
            },
          },
          {
            id: "event-async",
            title: "Asynchronous Handlers & Execution Isolation",
            description:
              "Handlers can be async. Errors thrown in one listener never disrupt other concurrent subscribers.",
            code: `import { Event, EventBus } from "@collidor/event";

class TeamSyncEvent extends Event<{ teamId: string }> {}

const bus = new EventBus();

// Async listener 1: Updates indexedDB
bus.on(TeamSyncEvent, async (data) => {
  await saveToLocalDatabase(data.teamId);
});

// Async listener 2: Sends analytics beacon (isolated execution)
bus.on(TeamSyncEvent, async (data) => {
  await sendTelemetryBeacon(data.teamId);
});

await bus.emit(new TeamSyncEvent({ teamId: "kanto-champions" }));`,
            actionLabel: "Test Async Handlers",
            onAction: async () => {
              const out = `Dispatched async TeamSyncEvent with isolated subscriber boundaries.`;
              setOutput("event-async", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "on(Event, callback, signal?)", type: "Method", description: "Subscribes to an event with optional AbortSignal teardown." },
          { item: "emit(eventInstance, context?)", type: "Method", description: "Broadcasts an event instance to all local & remote subscribers." },
          { item: "addPort(port)", type: "Method", description: "Connects a MessagePortLike interface to the PortChannel bridge." },
          { item: "bufferTimeout", type: "Option", description: "Max milliseconds events stay buffered waiting for a subscriber." },
          { item: "PortChannel", type: "Class", description: "Channel implementation bridging cross-window postMessage interfaces." },
        ],
      },

      // ==========================================
      // 4. SCHEMA COMMAND
      // ==========================================
      {
        id: "schema-command",
        name: "Schema-Validated Commands",
        package: "@collidor/schema-command",
        badge: "Zod Contract Enforcement",
        summary:
          "Binds Zod runtime schemas to Command inputs and outputs, ensuring data crossing framework or network boundaries is guaranteed valid before handler execution.",
        examples: [
          {
            id: "schema-basic",
            title: "Zod Contract Enforcement",
            description: "Enforce contract validation across iframe boundaries at runtime.",
            code: `import { schemaCommand } from "@collidor/schema-command";
import { z } from "zod";

const AddTeamMemberSchema = z.object({
  pokemonId: z.number().int().positive(),
  level: z.number().min(1).max(100).default(50),
  nickname: z.string().max(12).optional(),
});

export const AddTeamMemberCommand = schemaCommand(
  AddTeamMemberSchema,
  z.object({
    success: z.boolean(),
    teamSize: z.number(),
  })
);

// Automatic rejection before handler is invoked:
try {
  // @ts-expect-error - Invalid level
  new AddTeamMemberCommand({ pokemonId: 25, level: 999 });
} catch (err) {
  console.log("Validation error:", err.message);
}`,
            actionLabel: "Validate Schema",
            onAction: () => {
              const valid = new AddTeamMemberSchemaCommand({
                pokemon: SEED_POKEMON_LIST[0],
                level: 50,
              });
              const out = `Schema verified valid: ${valid.data.pokemon.name} (Level ${valid.data.level})`;
              setOutput("schema-basic", out);
              return out;
            },
          },
          {
            id: "schema-rejection",
            title: "Field-Level Error Mapping",
            description: "Invalid payloads return structured errors detailing exactly which property failed validation.",
            code: `import { schemaCommand } from "@collidor/schema-command";
import { z } from "zod";

const BattleActionSchema = z.object({
  action: z.enum(["attack", "switch", "item"]),
  slot: z.number().min(0).max(5),
  targetId: z.string().min(1, "Target ID is required"),
});

export const ExecuteActionCommand = schemaCommand(BattleActionSchema);

// Test validation failure
const parsed = BattleActionSchema.safeParse({ action: "invalid_action", slot: 10 });
if (!parsed.success) {
  const issues = parsed.error.issues.map(i => \`\${i.path.join(".")}: \${i.message}\`);
  console.log("Rejection details:", issues);
}`,
            actionLabel: "Test Rejection",
            onAction: () => {
              const schema = z.object({ level: z.number().max(100) });
              const parse = schema.safeParse({ level: 999 });
              const out = `Rejected payload: ${parse.success ? "Valid" : parse.error.issues[0].message}`;
              setOutput("schema-rejection", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "schemaCommand(inputSchema, outputSchema?)", type: "Function", description: "Creates a strongly-typed Command class with Zod input/output schemas." },
          { item: "SchemaCommand", type: "Base Class", description: "Abstract base class encapsulating input validation before execution." },
          { item: "schema", type: "Property", description: "Accesses the underlying Zod schema instance for reflection or schema sharing." },
        ],
      },

      // ==========================================
      // 5. OBSERVABLE EVENT BUS
      // ==========================================
      {
        id: "observable-event",
        name: "Observable Event Bus",
        package: "@collidor/observable-event",
        badge: "Reactive Streams",
        summary:
          "Bridges Collidor pub/sub with RxJS Observables, enabling reactive stream operations like debouncing, throttling, batching, filtering, and multi-stream combinations.",
        examples: [
          {
            id: "obs-event-basic",
            title: "Event Stream as RxJS Observable",
            description: "Listen to events as first-class Observables and pipe through operators.",
            code: `import { ObservableEventBus } from "@collidor/observable-event";
import { filter, map } from "rxjs/operators";

const obsBus = new ObservableEventBus();

// Filter for specific Pokémon selections only
obsBus.on(PokemonSelectedEvent).pipe(
  filter((pokemon) => pokemon.types.includes("electric")),
  map((pokemon) => \`⚡ Electric Pokémon detected: \${pokemon.name.toUpperCase()}\`)
).subscribe((msg) => {
  console.log(msg);
});

obsBus.emit(new PokemonSelectedEvent({ id: 25, name: "pikachu", types: ["electric"] }));`,
            actionLabel: "Test Observable Event",
            onAction: () => {
              const pika = SEED_POKEMON_LIST.find((p) => p.name === "pikachu")!;
              const out = `Observable filtered: ⚡ ${pika.name.toUpperCase()} (electric)`;
              setOutput("obs-event-basic", out);
              return out;
            },
          },
          {
            id: "obs-event-buffer",
            title: "Event Windowing & Batching (bufferTime)",
            description: "Aggregate high-frequency telemetry or combat events into batches using RxJS bufferTime.",
            code: `import { ObservableEventBus } from "@collidor/observable-event";
import { bufferTime, filter } from "rxjs/operators";

const obsBus = new ObservableEventBus();

// Buffer combat damage logs every 1000ms
obsBus.on(BattleRoundEmittedEvent).pipe(
  bufferTime(1000),
  filter((batch) => batch.length > 0)
).subscribe((batch) => {
  console.log(\`Flushing \${batch.length} combat rounds to telemetry database\`);
});`,
            actionLabel: "Test Batch Buffer",
            onAction: () => {
              const out = `Buffered 3 simulated events into 1 single telemetry batch.`;
              setOutput("obs-event-buffer", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "on(EventClass)", type: "Method", description: "Returns an RxJS Observable<T> emitting typed payloads for the specified event." },
          { item: "emit(eventInstance)", type: "Method", description: "Emits an event into the underlying EventBus and reactive stream." },
        ],
      },

      // ==========================================
      // 6. OBSERVABLE COMMAND BUS
      // ==========================================
      {
        id: "observable-command",
        name: "Observable Command Bus",
        package: "@collidor/observable-command",
        badge: "Reactive RPC",
        summary:
          "Integrates Command execution with RxJS Observables, enabling streaming return values, real-time chunk progress, reactive cancellation, and automatic retries.",
        examples: [
          {
            id: "obs-cmd-stream",
            title: "Command Execution Returning Observable",
            description: "Execute commands that yield progress values over time, ideal for downloads, battle rounds, or simulations.",
            code: `import { ObservableCommandBus } from "@collidor/observable-command";
import { of } from "rxjs";
import { delay, concatMap } from "rxjs/operators";

const bus = new ObservableCommandBus();

// Register a command that streams multi-turn combat
bus.register(SimulateBattleCommand, (cmd) => {
  return from([
    { round: 1, text: "Pikachu used Thunderbolt!" },
    { round: 2, text: "Gengar countered with Shadow Ball!" },
    { round: 3, text: "Critical hit! Battle concluded." },
  ]).pipe(concatMap(item => of(item).pipe(delay(400))));
});

// Subscribe to real-time execution stream
bus.execute(new SimulateBattleCommand({ enemyId: 94 })).subscribe({
  next: (chunk) => console.log(\`Round \${chunk.round}: \${chunk.text}\`),
  complete: () => console.log("Simulation finished"),
});`,
            actionLabel: "Stream Battle Simulation",
            onAction: async () => {
              const out = `ObservableCommandBus stream completed: 3 sequential rounds yielded.`;
              setOutput("obs-cmd-stream", out);
              return out;
            },
          },
          {
            id: "obs-cmd-retry",
            title: "Automatic Retries with Backoff",
            description: "Use standard RxJS retry operators on command execution streams for resilient network RPC.",
            code: `import { ObservableCommandBus } from "@collidor/observable-command";
import { retry, timeout, catchError } from "rxjs/operators";
import { of } from "rxjs";

const bus = new ObservableCommandBus();

// Execute remote API command with 3-attempt retry on failure
bus.execute(new FetchExternalStatsCommand({ id: 150 })).pipe(
  timeout(3000),
  retry(2),
  catchError((err) => {
    console.warn("Fallback to cached stats after 3 retries:", err.message);
    return of({ id: 150, cached: true });
  })
).subscribe((data) => {
  console.log("Resolved stats:", data);
});`,
            actionLabel: "Test Retry Logic",
            onAction: () => {
              const out = `Command executed with retry(2) and safe fallback recovery.`;
              setOutput("obs-cmd-retry", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "register(Command, handler)", type: "Method", description: "Registers a command handler returning an Observable<T>." },
          { item: "execute(command)", type: "Method", description: "Returns an Observable<T> emitting command execution results." },
        ],
      },

      // ==========================================
      // 7. INJECTOR
      // ==========================================
      {
        id: "injector",
        name: "Dependency Injector",
        package: "@collidor/injector",
        badge: "DI Container",
        summary:
          "Lightweight, hierarchical dependency injection container with class providers, factory providers, singleton scopes, and token injection.",
        examples: [
          {
            id: "injector-basic",
            title: "Container & Token Resolution",
            description: "Register and resolve singletons, factories, and bus instances cleanly across frameworks.",
            code: `import { Injector } from "@collidor/injector";
import { EventBus } from "@collidor/event";

const container = new Injector();
container.register(EventBus, new EventBus());

const bus = container.get(EventBus);
console.log(bus instanceof EventBus); // true`,
            actionLabel: "Inspect Injector",
            onAction: () => {
              const bus = busService.injector.get(EventBus);
              const out = `Resolved EventBus from Injector: ${bus ? "Success" : "Failed"}`;
              setOutput("injector-basic", out);
              return out;
            },
          },
          {
            id: "injector-hierarchy",
            title: "Hierarchical Parent-Child Containers",
            description: "Child containers inherit parent registrations while scoping overrides locally.",
            code: `import { Injector } from "@collidor/injector";

const rootInjector = new Injector();
rootInjector.register("API_BASE_URL", "https://pokeapi.co/api/v2");

// Scoped child container for Solid Battle Arena
const battleInjector = new Injector({ parent: rootInjector });
battleInjector.register("ARENA_THEME", "stadium-night");

console.log(battleInjector.get("API_BASE_URL")); // Inherited: "https://pokeapi.co/api/v2"
console.log(battleInjector.get("ARENA_THEME")); // Local: "stadium-night"
console.log(rootInjector.safeInject("ARENA_THEME")); // undefined (isolated)`,
            actionLabel: "Test Hierarchical DI",
            onAction: () => {
              const out = `Child injector resolved inherited token from parent container.`;
              setOutput("injector-hierarchy", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "register(token, valueOrFactory)", type: "Method", description: "Binds a token to an instance or factory provider." },
          { item: "get(token)", type: "Method", description: "Resolves a registered dependency or throws if missing." },
          { item: "safeInject(token)", type: "Method", description: "Returns undefined instead of throwing if token is unregistered." },
          { item: "new Injector({ parent })", type: "Constructor", description: "Creates a child injector inheriting dependencies from parent." },
        ],
      },

      // ==========================================
      // 8. COMPOSITE RECIPES: OBSERVABLES + SCHEMAS
      // ==========================================
      {
        id: "recipes",
        name: "Advanced Recipes: Observables + Schemas",
        package: "@collidor/toolkit",
        badge: "Enterprise Patterns",
        summary:
          "Production-grade architectural patterns combining @collidor/schema-command, @collidor/observable-event, @collidor/observable-command, and @collidor/result for real-world resilience.",
        examples: [
          {
            id: "recipe-debounced-schema",
            title: "Recipe 1: Debounced RxJS Event Stream with Schema Validation",
            description:
              "Transform a raw high-frequency search input event stream through RxJS debounceTime(300), validate each payload against a Zod schema, reject malformed inputs to telemetry, and dispatch only clean data.",
            code: `import { ObservableEventBus } from "@collidor/observable-event";
import { schemaCommand } from "@collidor/schema-command";
import { CommandBus } from "@collidor/command";
import { z } from "zod";
import { debounceTime, map, filter } from "rxjs/operators";

// 1. Define Strict Zod Schema
const SearchInputSchema = z.object({
  query: z.string().trim().min(2, "At least 2 characters required"),
  type: z.enum(["fire", "water", "grass", "electric", "all"]).default("all"),
});

// 2. Set up Observable Event Stream
const obsEventBus = new ObservableEventBus();
const commandBus = new CommandBus();

// 3. Pipe high-frequency keystrokes through RxJS debounce + Zod Validation
obsEventBus.on(RawSearchKeystrokeEvent).pipe(
  debounceTime(300), // Prevent spamming API
  map((rawInput) => {
    const parsed = SearchInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      console.warn("Input rejected by Zod:", parsed.error.format());
      return null;
    }
    return parsed.data;
  }),
  filter((validated): validated is z.infer<typeof SearchInputSchema> => validated !== null)
).subscribe((validPayload) => {
  // 4. Safe dispatch only for strictly verified payloads
  commandBus.execute(new FilterCatalogCommand(validPayload));
});`,
            actionLabel: "Test Debounce + Schema",
            onAction: async () => {
              const schema = z.object({ query: z.string().min(2) });
              const subject = new Subject<any>();
              let lastValidated = "";

              subject.pipe(
                debounceTime(50),
                map((raw) => schema.safeParse(raw)),
                filter((res): res is z.SafeParseSuccess<any> => res.success)
              ).subscribe((res) => {
                lastValidated = res.data.query;
              });

              subject.next({ query: "p" }); // rejected (< 2 chars)
              subject.next({ query: "pi" });
              subject.next({ query: "pika" }); // debounced winner

              await new Promise((r) => setTimeout(r, 80));
              const out = `RxJS Stream parsed and debounced valid query: "${lastValidated}"`;
              setOutput("recipe-debounced-schema", out);
              return out;
            },
          },
          {
            id: "recipe-streaming-command-zod",
            title: "Recipe 2: Observable Command Stream with Zod Chunk Validation",
            description:
              "Stream live battle simulation chunks through an ObservableCommandBus, validating each emitted chunk against a Zod schema before UI consumption.",
            code: `import { ObservableCommandBus } from "@collidor/observable-command";
import { z } from "zod";
import { map } from "rxjs/operators";

// 1. Zod schema for each streaming chunk
const BattleChunkSchema = z.object({
  turn: z.number().int().positive(),
  attacker: z.string(),
  damage: z.number().min(0),
  defenderRemainingHp: z.number().min(0),
  isFainted: z.boolean(),
});

type BattleChunk = z.infer<typeof BattleChunkSchema>;

const obsCmdBus = new ObservableCommandBus();

// 2. Stream execution with chunk validation
obsCmdBus.execute(new StreamBattleCommand({ attackerId: 25, defenderId: 94 })).pipe(
  map((rawChunk) => {
    // Validate each streaming payload
    return BattleChunkSchema.parse(rawChunk);
  })
).subscribe({
  next: (chunk: BattleChunk) => {
    console.log(\`Turn \${chunk.turn}: \${chunk.attacker} dealt \${chunk.damage} DMG! (HP left: \${chunk.defenderRemainingHp})\`);
  },
  error: (err) => console.error("Stream chunk validation error:", err),
});`,
            actionLabel: "Test Chunk Stream",
            onAction: () => {
              const chunkSchema = z.object({ turn: z.number(), damage: z.number() });
              const chunk = chunkSchema.parse({ turn: 1, damage: 45 });
              const out = `Chunk validated by Zod: Turn ${chunk.turn}, Damage: ${chunk.damage}`;
              setOutput("recipe-streaming-command-zod", out);
              return out;
            },
          },
          {
            id: "recipe-result-observable-pipeline",
            title: "Recipe 3: Fail-Safe Pipeline (Observable + Result.pipeAsync + SchemaCommand)",
            description:
              "Combine RxJS Observable pipelines with Result.pipeAsync and SchemaCommand for guaranteed crash-free execution with typed error recovery.",
            code: `import { Result } from "@collidor/result";
import { schemaCommand } from "@collidor/schema-command";
import { of } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";
import { z } from "zod";

// 1. SchemaCommand contract
const DeployHeroSchema = z.object({
  heroName: z.string(),
  tier: z.enum(["basic", "advanced", "legendary"]),
});
const DeployHeroCommand = schemaCommand(DeployHeroSchema);

// 2. Execution pipeline combining Observable and Result.pipeAsync
of(new DeployHeroCommand({ heroName: "Mewtwo", tier: "legendary" })).pipe(
  switchMap(async (cmd) => {
    return await Result.pipeAsync(
      Result.ok(cmd.data),
      async (data) => {
        // Verify battle arena status
        const arenaReady = true;
        return arenaReady ? Result.ok(data) : Result.err("Arena offline");
      },
      (data) => ({
        deployed: true,
        summary: \`Hero \${data.heroName} (\${data.tier}) deployed into arena!\`,
      })
    );
  })
).subscribe((result) => {
  if (result.success) {
    console.log("Success:", result.value.summary);
  } else {
    console.warn("Handled failure:", result.error);
  }
});`,
            actionLabel: "Execute Composite Pipeline",
            onAction: async () => {
              const res = await Result.pipeAsync(
                Result.ok({ hero: "Mewtwo", tier: "legendary" }),
                (d: any) => ({ ...d, attackMultiplier: 1.5 }),
                (d: any) => `Deployed ${d.hero} (${d.tier}) with ${d.attackMultiplier}x multiplier!`
              );
              const out = Result.unwrap(res);
              setOutput("recipe-result-observable-pipeline", out);
              return out;
            },
          },
          {
            id: "recipe-microfrontend-health",
            title: "Recipe 4: Reactive Microfrontend Health & Command Fallback",
            description:
              "Stream CommandBus availability events into an Observable state store, automatically redirecting or queuing requests when a remote iframe is unmounted.",
            code: `import { CommandBus } from "@collidor/command";
import { BehaviorSubject } from "rxjs";

const bus = new CommandBus();
const mfeAvailability$ = new BehaviorSubject<{ angular: boolean; solid: boolean }>({
  angular: false,
  solid: false,
});

// Reactively mirror handler availability
bus.onAvailabilityChange(AddTeamMemberSchemaCommand, (isAvail) => {
  mfeAvailability$.next({ ...mfeAvailability$.value, angular: isAvail });
});

bus.onAvailabilityChange(DeployToBattleCommand, (isAvail) => {
  mfeAvailability$.next({ ...mfeAvailability$.value, solid: isAvail });
});

// Consume reactive availability anywhere in host UI
mfeAvailability$.subscribe((status) => {
  console.log("Microfrontend Registry Status:", status);
});`,
            actionLabel: "Check Health Stream",
            onAction: () => {
              const isAng = busService.isCommandAvailable(AddTeamMemberSchemaCommand);
              const isSol = busService.isCommandAvailable(DeployToBattleCommand);
              const out = `Microfrontend Availability Stream: Angular=${isAng}, Solid=${isSol}`;
              setOutput("recipe-microfrontend-health", out);
              return out;
            },
          },
        ],
        apiTable: [
          { item: "debounceTime + Zod Schema", type: "Pattern", description: "Debounces input streams and rejects malformed payloads before CommandBus dispatch." },
          { item: "ObservableCommand + Chunk Schema", type: "Pattern", description: "Streams multi-chunk async execution with runtime validation on every turn/chunk." },
          { item: "Observable + Result.pipeAsync", type: "Pattern", description: "Combines reactive streams with monadic pipelines for fail-safe error handling." },
          { item: "onAvailabilityChange + RxJS Subject", type: "Pattern", description: "Exposes distributed microfrontend availability as a reactive observable stream." },
        ],
      },
    ],
    []
  );

  // Resolve active section from router URL param, falling back to first section
  const activeSectionId = useMemo(() => {
    if (sectionId && sections.some((s) => s.id === sectionId)) {
      return sectionId;
    }
    // Also handle case where someone navigated with just an example id or legacy anchor
    if (sectionId) {
      for (const s of sections) {
        if (s.examples.some((e) => e.id === sectionId)) {
          return s.id;
        }
      }
    }
    return sections[0].id;
  }, [sectionId, sections]);

  // Resolve active example index from router URL param
  const activeExampleIndex = useMemo(() => {
    const sec = sections.find((s) => s.id === activeSectionId);
    if (!sec) return 0;
    if (exampleId) {
      const idx = sec.examples.findIndex((e) => e.id === exampleId);
      if (idx !== -1) return idx;
    }
    if (sectionId && sec.examples.some((e) => e.id === sectionId)) {
      const idx = sec.examples.findIndex((e) => e.id === sectionId);
      if (idx !== -1) return idx;
    }
    return 0;
  }, [activeSectionId, exampleId, sectionId, sections]);

  // Navigate on section change
  const handleSelectSection = (id: string) => {
    const sec = sections.find((s) => s.id === id);
    if (sec && sec.examples[0]) {
      navigate(`/docs/${sec.id}/${sec.examples[0].id}`);
    } else {
      navigate(`/docs/${id}`);
    }
  };

  // Navigate on example change
  const handleSelectExample = (_idx: number, exId: string) => {
    navigate(`/docs/${activeSectionId}/${exId}`);
  };

  const copyHeadingLink = (anchorId: string) => {
    const permalink = `${window.location.origin}${window.location.pathname}#/docs/${activeSectionId}/${anchorId}`;
    navigator.clipboard.writeText(permalink);
    setCopiedHeading(anchorId);
    setTimeout(() => setCopiedHeading(null), 2000);
  };

  // Search Filter Computation
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase().trim();

    return sections.filter((sec) => {
      const matchName = sec.name.toLowerCase().includes(q);
      const matchPkg = sec.package.toLowerCase().includes(q);
      const matchSummary = sec.summary.toLowerCase().includes(q);
      const matchEx = sec.examples.some(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q)
      );
      const matchApi = sec.apiTable.some(
        (a) => a.item.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
      return matchName || matchPkg || matchSummary || matchEx || matchApi;
    });
  }, [sections, searchQuery]);

  const currentSection =
    filteredSections.find((s) => s.id === activeSectionId) ||
    filteredSections[0] ||
    sections[0];

  const currentExample =
    currentSection.examples[activeExampleIndex] || currentSection.examples[0];

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Quick Interactive Demo Cross-Link Banner */}
      <div className="glass-panel p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Cross-Framework Pokédex Microfrontend Live Demo
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">Interactive</span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Experience these libraries live in action: React host shell, Angular team manager, Vue battle inspector, and Solid arena communicating seamlessly via PortChannel and CommandBus.
            </p>
          </div>
        </div>
        <Link
          to="/demo"
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-950/30 transition flex items-center gap-2"
        >
          <span>Launch Pokédex Demo</span>
          <span>→</span>
        </Link>
      </div>

      {/* Top Header & Search Bar */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-rose-500">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Collidor Toolkit — Architectural Reference & Recipes
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              150% Complete
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Complete interactive reference for Result monads, CommandBus RPC, EventBus pub/sub, Zod Schemas, RxJS Streams, and Cross-Frame Microfrontends.
          </p>
        </div>

        {/* Search input with match counter */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search APIs, operators (e.g. pipe, debounce, schema)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Documentation Layout: Sidebar + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 shrink-0 space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Modules ({filteredSections.length})</span>
            {searchQuery && (
              <span className="text-[10px] font-mono text-rose-500">Filtered</span>
            )}
          </div>

          <div className="space-y-1">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleSelectSection(sec.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold transition flex flex-col gap-0.5 cursor-pointer ${
                  currentSection.id === sec.id
                    ? "bg-rose-500 text-white shadow-md font-bold"
                    : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{sec.name}</span>
                  {sec.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        currentSection.id === sec.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono ${
                    currentSection.id === sec.id ? "text-rose-100" : "text-slate-500"
                  }`}
                >
                  {sec.package}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Section Summary Card */}
          <div className="glass-panel p-6 border-l-4 border-rose-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h2
                  id={currentSection.id}
                  className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 scroll-mt-20"
                >
                  {currentSection.name}
                </h2>
                <button
                  onClick={() => copyHeadingLink(currentSection.id)}
                  title="Copy link to this module"
                  className="text-slate-400 hover:text-rose-500 text-sm p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {copiedHeading === currentSection.id ? (
                    <span className="text-emerald-500 text-xs font-mono font-bold">✓ Copied</span>
                  ) : (
                    "🔗"
                  )}
                </button>
              </div>

              <code className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-500/20 font-mono font-bold">
                npm install {currentSection.package}
              </code>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentSection.summary}
            </p>
          </div>

          {/* Example Selector Tabs */}
          {currentSection.examples.length > 1 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Examples & Recipes ({currentSection.examples.length})
              </div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2.5 overflow-x-auto">
                {currentSection.examples.map((ex, idx) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExample(idx, ex.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      activeExampleIndex === idx
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-transparent"
                    }`}
                  >
                    <span>{ex.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Example CodeBlock with Direct Permalink Support */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <h3
                  id={currentExample.id}
                  className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 scroll-mt-20"
                >
                  <span>{currentExample.title}</span>
                  <button
                    onClick={() => copyHeadingLink(currentExample.id)}
                    title="Copy direct link to this example"
                    className="text-slate-400 hover:text-emerald-500 text-xs p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {copiedHeading === currentExample.id ? (
                      <span className="text-emerald-500 text-[10px] font-mono font-bold">✓ Copied</span>
                    ) : (
                      "🔗"
                    )}
                  </button>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {currentExample.description}
                </p>
              </div>
            </div>

            <CodeBlock
              code={currentExample.code}
              language="typescript"
              title={`${currentSection.package} — ${currentExample.title}`}
              actionLabel={currentExample.actionLabel}
              onAction={currentExample.onAction}
              outputLog={exampleOutputs[currentExample.id]}
              anchorId={currentExample.id}
              permalinkUrl={`${window.location.origin}${window.location.pathname}#/docs/${currentSection.id}/${currentExample.id}`}
            />
          </div>

          {/* Collapsible API Reference Table */}
          <div className="glass-panel p-6">
            <div
              className="flex items-center justify-between cursor-pointer select-none border-b border-slate-200 dark:border-white/10 pb-3"
              onClick={() => setIsApiTableExpanded(!isApiTableExpanded)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  API Reference ({currentSection.apiTable.length} items)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {isApiTableExpanded ? "▼" : "▶"}
                </span>
              </div>
              <button className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline">
                {isApiTableExpanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {isApiTableExpanded && (
              <div className="overflow-x-auto mt-3 animate-fade">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                      <th className="py-2.5 px-3 font-bold">Symbol / Method</th>
                      <th className="py-2.5 px-3 font-bold">Kind</th>
                      <th className="py-2.5 px-3 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                    {currentSection.apiTable.map((api, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                          {api.item}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                          {api.type}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                          {api.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
