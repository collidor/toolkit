import React, { useState } from "react";
import { busService } from "../services/busService";
import {
  FetchPokemonDetailCommand,
  PokemonSelectedEvent,
  SEED_POKEMON_LIST,
} from "@demo/shared";
import { Result } from "@collidor/result";
import { EventBus } from "@collidor/event";
import { CodeBlock } from "./CodeBlock";

interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  actionLabel?: string;
  onAction?: () => Promise<string> | string;
}

interface DocSection {
  id: string;
  name: string;
  package: string;
  summary: string;
  examples: CodeExample[];
  apiTable: Array<{ item: string; type: string; description: string }>;
}

export const DocViewer: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState("result");
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [exampleOutputs, setExampleOutputs] = useState<Record<string, string>>({});

  const setOutput = (exampleId: string, output: string) => {
    setExampleOutputs((prev) => ({ ...prev, [exampleId]: output }));
  };

  const sections: DocSection[] = [
    {
      id: "result",
      name: "Result Monad & Composition",
      package: "@collidor/result",
      summary:
        "High-performance, realm-safe Result monad designed specifically for cross-context architectures. Eliminates cross-iframe instanceof bugs, preserves remote stack traces across Web Workers, and provides functional pipelines (pipe/pipeAsync) and monadic operations.",
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
console.log("Sync Pipeline Output:", Result.unwrap(syncResult)); // 115

// 2. Asynchronous pipeline with mixed sync/async transforms
const pipelinePromise = await Result.pipeAsync(
  Result.ok({ pokemonId: 25, level: 50 }),
  async (data) => {
    // Simulated async stats calculation
    return { ...data, hp: data.level * 2 + 10 };
  },
  (data) => {
    return data.hp > 0 ? Result.ok(data) : Result.err("Fainted");
  }
);

console.log("Async Pipeline Output:", Result.unwrap(pipelinePromise));`,
          actionLabel: "Run Pipelines",
          onAction: async () => {
            const syncRes = Result.pipe(
              Result.ok(90),
              (power) => (power > 0 ? power : Result.err("Invalid power")),
              (power) => power * 1.5,
              (power) => Math.round(power * 0.85)
            );
            const asyncRes = await Result.pipeAsync(
              Result.ok({ pokemonId: 25, level: 50 }),
              async (data) => ({ ...data, hp: data.level * 2 + 10 }),
              (data) => Result.ok({ ...data, ready: true })
            );

            const out = `Sync: ${JSON.stringify(syncRes)} | Async: ${JSON.stringify(asyncRes)}`;
            setOutput("result-pipeline", out);
            busService.logTelemetry("result", "ResultPipelineExecuted", "DocViewer", { sync: syncRes, async: asyncRes });
            return out;
          },
        },
        {
          id: "result-monadic",
          title: "Monadic Operations (map & chain)",
          description:
            "Transform inner values with `map()` or compose Result-returning functions with `chain()` (monadic flatMap). Use `getOrElse()` to supply safe fallbacks.",
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
const battleRound = findCombatant(25)
  .pipe((res) => Result.chain(res, (c) => applyDamage(c, 30)));

// Functor mapping: Result<B> -> (B -> C) -> Result<C>
const logMessage = Result.map(battleRound, (c) => \`\${c.name} remaining HP: \${c.hp}\`);

// Safe fallback: value or default
const finalStatus = Result.getOrElse(logMessage, "Battle error occurred");
console.log(finalStatus); // "Pikachu remaining HP: 70"`,
          actionLabel: "Test Monadic Chain",
          onAction: () => {
            const combatant = { name: "Pikachu", hp: 100 };
            const damaged = Result.chain(Result.ok<any, any>(combatant), (c: any) =>
              c.hp > 30 ? Result.ok({ ...c, hp: c.hp - 30 }) : Result.err({ message: "Fainted" })
            );
            const mapped = Result.map(damaged, (c: any) => `${c.name} has ${c.hp} HP`);
            const out = `Result.chain -> Result.map: "${Result.unwrap(mapped)}"`;
            setOutput("result-monadic", out);
            busService.logTelemetry("result", "ResultMonadicExecuted", "DocViewer", mapped);
            return out;
          },
        },
        {
          id: "result-crossframe",
          title: "Cross-Frame Error Hydration",
          description:
            "Standard `instanceof Error` fails across iframes and workers because Error prototypes reside in different execution realms. Result solves this structurally.",
          code: `import { Result } from "@collidor/result";

// 1. In Worker / Iframe: Error is serialized over MessagePort as a plain object
const serializedError = {
  message: "Remote database query timed out after 5000ms",
  stack: "Error: Remote database query timed out\\n    at queryWorker (worker.js:42:15)"
};

// 2. In Host Realm: Result.from() detects ErrorLike shape structurally
const res = Result.from(serializedError);
console.log(res.success); // false
console.log(Result.isResult(res)); // true (boundary-safe duck typing)

// 3. Result.unwrap() re-hydrates plain object into a true native Error instance
try {
  Result.unwrap(res);
} catch (nativeError) {
  console.log(nativeError instanceof Error); // true!
  console.log(nativeError.message); // "Remote database query timed out after 5000ms"
  console.log(nativeError.stack); // Includes "From Remote: ... worker.js:42"
}`,
          actionLabel: "Test Error Hydration",
          onAction: () => {
            const fakeRemoteError = {
              message: "Iframe worker calculation failed",
              stack: "RemoteStack: worker.js:89",
            };
            const res = Result.from(fakeRemoteError);
            let hydratedInfo = "";
            try {
              Result.unwrap(res);
            } catch (err: any) {
              hydratedInfo = `Hydrated Error: "${err.message}" (instanceof Error: ${err instanceof Error})`;
            }
            setOutput("result-crossframe", hydratedInfo);
            busService.logTelemetry("result", "ResultErrorHydrationTested", "DocViewer", { hydratedInfo });
            return hydratedInfo;
          },
        },
        {
          id: "result-batch",
          title: "Batch Aggregation (combine & try)",
          description:
            "Combine multiple Results into a single Result with `combine()` (like Promise.all for Results), and safely wrap throwing third-party calls with `Result.try()`.",
          code: `import { Result } from "@collidor/result";

// 1. combine() aggregates an array of Results; fails fast on first error
const teamChecks = [
  Result.ok({ slot: 1, name: "Pikachu", valid: true }),
  Result.ok({ slot: 2, name: "Charizard", valid: true }),
  Result.ok({ slot: 3, name: "Blastoise", valid: true }),
];

const batchResult = Result.combine(teamChecks);
if (batchResult.success) {
  console.log(\`All \${batchResult.value.length} members validated!\`);
}

// 2. Result.try() encapsulates throwing sync operations
const jsonResult = Result.try(() => JSON.parse('{ "invalid": json }'));
console.log(jsonResult.success); // false
console.log(jsonResult.error.message); // SyntaxError message without crashing app!

// 3. Result.fromPromise() converts async rejections
const apiResult = await Result.fromPromise(fetch("/api/non-existent"));`,
          actionLabel: "Test Batch & Try",
          onAction: () => {
            const r1 = Result.ok("Slot 1 Ready");
            const r2 = Result.ok("Slot 2 Ready");
            const combined = Result.combine([r1, r2]);
            const safeTry = Result.try(() => {
              throw new Error("Simulated controlled parse exception");
            });
            const out = `combine: [${combined.value?.join(", ")}] | try caught: "${safeTry.error?.message}"`;
            setOutput("result-batch", out);
            busService.logTelemetry("result", "ResultBatchTested", "DocViewer", { combined, safeTry });
            return out;
          },
        },
      ],
      apiTable: [
        { item: "Result.ok(value)", type: "Static", description: "Constructs an Ok<T> result with success: true and value." },
        { item: "Result.err(error)", type: "Static", description: "Constructs an Err<E> result with success: false and error payload." },
        { item: "Result.none()", type: "Static", description: "Creates a failure Result with null error ({ success: false, error: null })." },
        { item: "Result.isResult(val)", type: "Static", description: "Boundary-safe structural duck-typing check (cross-realm safe)." },
        { item: "Result.from(valOrError)", type: "Static", description: "Converts value or ErrorLike object into Ok or Err automatically." },
        { item: "Result.fromPromise(p)", type: "Static", description: "Wraps a Promise, resolving to Ok or catching rejection into Err." },
        { item: "Result.try(fn)", type: "Static", description: "Executes a throwing sync function, wrapping throws in Result.err." },
        { item: "Result.unwrap(result)", type: "Static", description: "Returns value or throws error re-hydrated with remote stack trace." },
        { item: "Result.map(result, fn)", type: "Static", description: "Transforms value if successful; leaves error untouched." },
        { item: "Result.chain(result, fn)", type: "Static", description: "Monadic bind/flatMap: chains another Result-returning function." },
        { item: "Result.getOrElse(res, def)", type: "Static", description: "Returns result value or fallback default if failed." },
        { item: "Result.pipe(res, ...ops)", type: "Static", description: "Synchronous functional pipeline with short-circuiting on failure." },
        { item: "Result.pipeAsync(res, ...ops)", type: "Static", description: "Asynchronous pipeline supporting mixed sync/async transforms." },
        { item: "Result.combine([r1, r2, ...])", type: "Static", description: "Combines an array of Results into a Result of values array." },
      ],
    },
    {
      id: "command",
      name: "Command Bus",
      package: "@collidor/command",
      summary:
        "Type-safe, synchronous and asynchronous command routing with streaming, plugins, and HTTP / PortChannel extensions.",
      examples: [
        {
          id: "command-basic",
          title: "Command Bus Dispatch & Handlers",
          description: "Define strongly typed input/output commands and register handlers with full inference.",
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
            const out = res.success ? `Loaded ${res.value.name} (#${res.value.id})` : `Error: ${res.error}`;
            setOutput("command-basic", out);
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
});

const bus = new AsyncCommandBus({ plugin });

// Await remote iframe readiness before executing
await bus.waitFor(GetTeamCommand, { timeout: 5000 });
const team = await bus.execute(new GetTeamCommand());`,
          actionLabel: "Test Remote Bus",
          onAction: async () => {
            const out = `PortChannelPlugin active on Host. Connected iframes: Angular (team) & Solid (battle).`;
            setOutput("command-portchannel", out);
            return out;
          },
        },
      ],
      apiTable: [
        { item: "register(Command, handler)", type: "Method", description: "Registers a synchronous or asynchronous command handler." },
        { item: "execute(command, context?)", type: "Method", description: "Executes a command instance with typed return inference." },
        { item: "stream(command, callback)", type: "Method", description: "Executes a generator or stream handler with callback events." },
        { item: "waitFor(Command, options?)", type: "Method", description: "Awaits remote command availability across PortChannel." },
        { item: "PortChannelPlugin", type: "Class", description: "Plugin bridging command dispatch over MessagePort interfaces." },
      ],
    },
    {
      id: "event",
      name: "Event Bus & PortChannel",
      package: "@collidor/event",
      summary:
        "High-performance publish/subscribe messaging system with cross-context PortChannel routing over MessagePort, BroadcastChannel, and Workers.",
      examples: [
        {
          id: "event-basic",
          title: "Typed Pub/Sub Event Broadcast",
          description: "Publish strongly typed events to local and remote subscribers with optional AbortSignal teardown.",
          code: `import { Event, EventBus, PortChannel } from "@collidor/event";

class PokemonSelectedEvent extends Event<{ id: number; name: string }> {}

const channel = new PortChannel({ bufferTimeout: 5000 });
const bus = new EventBus({ channel });

bus.on(PokemonSelectedEvent, (data) => {
  console.log(\`Selected: \${data.name} (#\${data.id})\`);
});

bus.emit(new PokemonSelectedEvent({ id: 25, name: "pikachu" }));`,
          actionLabel: "Emit Selection",
          onAction: () => {
            const char = SEED_POKEMON_LIST.find((p) => p.name === "charmander")!;
            busService.eventBus.emit(new PokemonSelectedEvent(char));
            const out = `Emitted PokemonSelectedEvent for Charmander (#4)`;
            setOutput("event-basic", out);
            return out;
          },
        },
      ],
      apiTable: [
        { item: "on(Event, callback, signal?)", type: "Method", description: "Subscribes to an event with optional AbortSignal teardown." },
        { item: "emit(eventInstance, context?)", type: "Method", description: "Broadcasts an event instance to all local & remote subscribers." },
        { item: "addPort(port)", type: "Method", description: "Connects a MessagePortLike interface to the PortChannel bridge." },
        { item: "bufferTimeout", type: "Option", description: "Max ms events stay buffered waiting for a subscriber (default: 5000ms)." },
      ],
    },
    {
      id: "injector",
      name: "Dependency Injector",
      package: "@collidor/injector",
      summary:
        "Lightweight, hierarchical dependency injection container with class providers, factory providers, and token injection.",
      examples: [
        {
          id: "injector-basic",
          title: "Container & Token Resolution",
          description: "Register and resolve singletons, factories, and bus instances cleanly.",
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
      ],
      apiTable: [
        { item: "register(token, valueOrFactory)", type: "Method", description: "Binds a token to an instance or factory provider." },
        { item: "get(token)", type: "Method", description: "Resolves a registered dependency or throws if missing." },
        { item: "safeInject(token)", type: "Method", description: "Returns undefined instead of throwing if token is unregistered." },
      ],
    },
    {
      id: "schema-command",
      name: "Schema-Validated Commands",
      package: "@collidor/schema-command",
      summary:
        "Binds Zod runtime schemas to Command inputs and outputs, ensuring data crossing framework or network boundaries is guaranteed valid.",
      examples: [
        {
          id: "schema-basic",
          title: "Zod Contract Enforcement",
          description: "Enforce contract validation across iframe boundaries at runtime.",
          code: `import { schemaCommand } from "@collidor/schema-command";
import { z } from "zod";

const AddTeamMemberCommand = schemaCommand(
  z.object({
    pokemonId: z.number().int().positive(),
    nickname: z.string().max(12).optional(),
  }),
  z.object({
    success: z.boolean(),
    teamCount: z.number(),
  })
);`,
          actionLabel: "Verify Schemas",
          onAction: () => {
            const out = `AddTeamMemberSchemaCommand is active and validated by Zod schema across Angular and Solid.`;
            setOutput("schema-basic", out);
            return out;
          },
        },
      ],
      apiTable: [
        { item: "schemaCommand(inputSchema, outputSchema)", type: "Function", description: "Creates a strongly-typed Command class with Zod validation." },
        { item: "validateInput(data)", type: "Method", description: "Validates input payload against Zod schema prior to execution." },
      ],
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const currentExample = currentSection.examples[activeExampleIndex] || currentSection.examples[0];

  const handleSectionChange = (id: string) => {
    setActiveSectionId(id);
    setActiveExampleIndex(0);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
          Toolkit Modules
        </h3>
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => handleSectionChange(sec.id)}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
              activeSectionId === sec.id
                ? "bg-rose-500 text-white shadow-md font-bold"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-900"
            }`}
          >
            <span>{sec.name}</span>
            <span className={`text-[10px] font-mono ${activeSectionId === sec.id ? "text-rose-100 font-bold" : "text-slate-500"}`}>
              {sec.package.replace("@collidor/", "")}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="glass-panel p-6 border-l-4 border-rose-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {currentSection.name}
            </h2>
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
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2.5 overflow-x-auto">
            {currentSection.examples.map((ex, idx) => (
              <button
                key={ex.id}
                onClick={() => setActiveExampleIndex(idx)}
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
        )}

        {/* Active Example CodeBlock with Prism Highlight */}
        <div>
          <div className="mb-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{currentExample.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{currentExample.description}</p>
          </div>

          <CodeBlock
            code={currentExample.code}
            language="typescript"
            title={`${currentSection.package} - ${currentExample.title}`}
            actionLabel={currentExample.actionLabel}
            onAction={currentExample.onAction}
            outputLog={exampleOutputs[currentExample.id]}
          />
        </div>

        {/* API Reference Table */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">API Reference</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-bold">Symbol</th>
                  <th className="py-2.5 px-3 font-bold">Kind</th>
                  <th className="py-2.5 px-3 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                {currentSection.apiTable.map((api, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-bold">{api.item}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-medium">{api.type}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">{api.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
