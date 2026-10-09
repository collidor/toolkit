<script setup lang="ts">
import { ref } from "vue";
import CodeBlock from "./CodeBlock.vue";
import Callout from "./Callout.vue";
import { Result } from "@collidor/result";
import { EventBus, Event, createEvent } from "@collidor/event";
import { AsyncCommandBus, Command, createCommand } from "@collidor/command";
import { ObservableEventBus } from "@collidor/observable-event";
import { ObservableCommandBus } from "@collidor/observable-command";
import { Injector } from "@collidor/injector";
import { createSchemaCommand } from "@collidor/schema-command";
import { s, toJSONSchema } from "@collidor/struct";
import { from, of } from "rxjs";
import { switchMap, filter, map } from "rxjs/operators";
import { z } from "zod";
import { busService } from "../services/busService";

const emit = defineEmits<{
  (e: "launchDemo"): void;
}>();

const exampleOutputs = ref<Record<string, string>>({});

function setOutput(exampleId: string, output: string) {
  exampleOutputs.value = { ...exampleOutputs.value, [exampleId]: output };
}

// 1. Result Action
function runResultPipeline() {
  const res = Result.pipe(
    Result.ok(90),
    (power: number) => (power > 0 ? Result.ok(power) : Result.err("Invalid move power")),
    (power: number) => Result.ok(power * 1.5),
    (power: number) => Result.ok(Math.round(power * 0.85))
  );
  const damage = Result.unwrap(res);
  const out = `Pipeline computed damage: ${damage} (STAB 1.5x + variance 0.85x)`;
  setOutput("result-pipeline", out);
  busService.logTelemetry("result", "ResultPipelineExecuted", "DocViewer", { base: 90, result: damage });
  return out;
}

// 2. Result Match Action
function runResultMatch() {
  const outcome = Result.try(() => JSON.parse('{"status":"ok","framework":"@collidor/toolkit"}'));
  const out = Result.match(outcome, {
    ok: (val: any) => `Success match: ${JSON.stringify(val)}`,
    err: (err: any) => `Error match: ${err.message}`,
  });
  setOutput("result-match", out);
  return out;
}

// 3. Command Action with Explicit Result Generic
type DeployPayload = { fighterName: string; level: number };
type DeployResult = Result<{ fighter: string; hp: number; status: string }, string>;

class DocDeployFighterCommand extends Command<DeployPayload, DeployResult> {
  constructor(data: DeployPayload) {
    super(data);
  }
}

async function runCommandExample() {
  const startTime = performance.now();
  const testBus = new AsyncCommandBus();

  testBus.register(DocDeployFighterCommand, async (cmd) => {
    if (cmd.data.level <= 0) {
      return Result.err("Invalid level: must be positive");
    }
    return Result.ok({
      fighter: cmd.data.fighterName,
      hp: cmd.data.level * 25,
      status: "READY_FOR_BATTLE",
    });
  });

  const cmd = new DocDeployFighterCommand({ fighterName: "Charizard", level: 50 });
  const result: DeployResult = await testBus.execute(cmd);
  const duration = (performance.now() - startTime).toFixed(2);

  const text = Result.match(result, {
    ok: (val) => `Success: ${val.fighter} ready (HP: ${val.hp}, Status: ${val.status})`,
    err: (err) => `Failed: ${err}`,
  });

  const out = `Command<Payload, Result<...>> executed in ${duration}ms => ${text}`;
  setOutput("command-dispatch", out);
  if (Result.isOk(result)) {
    busService.logTelemetry("command", "DeployFighterCommand", "DocViewer", result.value);
  }
  return out;
}

// 4. Event Action (Unwrapped Payload Callback)
interface DocPokemonPayload {
  id: number;
  name: string;
  type: string;
}

class DocPokemonSelectedEvent extends Event<DocPokemonPayload> {
  constructor(data: DocPokemonPayload) {
    super(data);
  }
}

function runEventExample() {
  const testBus = new EventBus();
  let received: DocPokemonPayload | null = null;

  // Unwrapped callback receiving payload directly as first argument
  const unsubscribe = testBus.on(DocPokemonSelectedEvent, (data) => {
    received = data;
  });

  const payload: DocPokemonPayload = { id: 25, name: "Pikachu", type: "electric" };
  testBus.emit(new DocPokemonSelectedEvent(payload));
  unsubscribe();

  const out = `Event emitted & received directly: ${JSON.stringify(received)} (listener cleanly unsubscribed)`;
  setOutput("event-bus", out);
  busService.logTelemetry("event", "PokemonSelectedEvent", "DocViewer", payload);
  return out;
}

// 5. Observable Command Action
function runObservableCommand() {
  const obsBus = new ObservableCommandBus();

  type PingPayload = { step: number };
  type PingResult = Result<{ step: number; status: string }, string>;

  class PingCmd extends Command<PingPayload, PingResult> {
    constructor(data: PingPayload) {
      super(data);
    }
  }

  obsBus.register(PingCmd, (cmd) => {
    return of(Result.ok({ step: cmd.data.step, status: "PROCESSED" }));
  });

  const steps: string[] = [];
  from([
    new PingCmd({ step: 1 }),
    new PingCmd({ step: 2 }),
    new PingCmd({ step: 3 }),
  ])
    .pipe(switchMap((cmd) => obsBus.execute(cmd)))
    .subscribe((res) => {
      if (Result.isOk(res)) {
        steps.push(`Step ${res.value.step}: ${res.value.status}`);
      }
    });

  const out = `RxJS Stream executed: 3 commands processed via switchMap => [${steps.join(", ")}]`;
  setOutput("obs-command", out);
  busService.logTelemetry("command", "BatchExecuteStream", "DocViewer", { count: 3 });
  return out;
}

// 6. Observable Event Action
function runObservableEvent() {
  class StatChangeEvent extends Event<{ stat: string; delta: number; pokemon: string }> {
    constructor(data: { stat: string; delta: number; pokemon: string }) {
      super(data);
    }
  }

  const baseBus = new EventBus();
  const obsBus = new ObservableEventBus(baseBus);
  const streamLog: string[] = [];

  const sub = obsBus
    .on(StatChangeEvent)
    .pipe(
      filter((e) => e.stat === "speed"),
      map((e) => `${e.pokemon} speed ${e.delta > 0 ? "+" : ""}${e.delta}`)
    )
    .subscribe((msg) => {
      streamLog.push(msg);
    });

  obsBus.emit(new StatChangeEvent({ stat: "attack", delta: 1, pokemon: "Pikachu" })); // filtered out
  obsBus.emit(new StatChangeEvent({ stat: "speed", delta: 2, pokemon: "Pikachu" }));  // matched!
  sub.unsubscribe();

  const out = `ObservableEventBus stream filtered and mapped: [${streamLog.join(", ")}]`;
  setOutput("obs-event", out);
  busService.logTelemetry("event", "ObservableEventStream", "DocViewer", { log: streamLog });
  return out;
}

// 7. Dependency Injection Action
function runInjectorExample() {
  class PokedexService {
    getTrainer() {
      return "Ash Ketchum";
    }
  }

  class BattleService {
    getArena() {
      return "Indigo Plateau";
    }
  }

  const rootInjector = new Injector();
  rootInjector.register(PokedexService, new PokedexService());

  const childInjector = new Injector(rootInjector);
  childInjector.register(BattleService, new BattleService());

  const pokedex = childInjector.inject(PokedexService);
  const arena = childInjector.inject(BattleService);
  const missing = childInjector.safeInject(class UnknownService {});

  const out = `Hierarchical DI resolved: trainer="${pokedex.getTrainer()}", arena="${arena.getArena()}", missingSafe=${
    missing === null ? "null (safe fallback)" : "found"
  }`;
  setOutput("injector-example", out);
  busService.logTelemetry("injector", "DependencyInjected", "DocViewer", {
    trainer: pokedex.getTrainer(),
    arena: arena.getArena(),
  });
  return out;
}

// 8. Schema Command Action
function runSchemaCommand() {
  const MemberInput = z.object({
    id: z.number().int().positive(),
    name: z.string().min(2),
  });

  const MemberOutput = z.object({
    success: z.boolean(),
    summary: z.string(),
  });

  const AddMemberCmd = createSchemaCommand("AddMemberCommand", MemberInput, MemberOutput);
  const cmd = new AddMemberCmd({ id: 25, name: "Pikachu" });
  const schemaValid = MemberInput.safeParse(cmd.data).success;
  const invalidTest = MemberInput.safeParse({ id: -1, name: "X" }).success;

  const out = `Schema Command created with input & output contracts. Valid payload passed: ${schemaValid}, invalid payload rejected: ${!invalidTest}`;
  setOutput("schema-command", out);
  busService.logTelemetry("command", "SchemaCommandValidated", "DocViewer", { valid: true, id: 25 });
  return out;
}

// 9. Struct Action
function runStructExample() {
  const UserProfile = s.struct({
    username: s.string().trim().toLowerCase().min(3),
    role: s.enum(["admin", "editor", "viewer"]).default("viewer"),
  });

  const validParsed = UserProfile.safeParse({ username: "Red", role: "admin" });
  const jsonSchema = toJSONSchema(UserProfile) as any;

  const out = `Struct compiled: safeParse=${validParsed.success}, JSON Schema type="${
    jsonSchema.type
  }" with properties [${Object.keys(jsonSchema.properties || {}).join(", ")}]`;
  setOutput("struct-example", out);
  return out;
}
</script>

<template>
  <div class="doc-content">
    <!-- 1. OVERVIEW -->
    <section id="overview" class="docs-section">
      <div class="section-badge-row">
        <span class="ui-badge ui-badge--primary">Core Architecture</span>
        <span class="ui-badge ui-badge--accent">v1.2.0</span>
      </div>
      <h1>@collidor/toolkit</h1>
      <p class="lead">
        The unified enterprise architecture toolkit for decoupled, cross-context JavaScript applications.
        Provides high-performance <strong>Result monads</strong>, <strong>CQRS Command Buses</strong>,
        <strong>PortChannel Event Buses</strong>, <strong>RxJS Streams</strong>, <strong>IoC Containers</strong>, and <strong>Standard Schema V1</strong> validation.
      </p>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>🛡️ Boundary-Safe Result Monad</h4>
          <p>Realm-safe functional errors that survive cross-iframe serialization, Web Worker transfers, and eliminate <code>instanceof</code> pitfalls.</p>
        </div>

        <div class="feature-card">
          <h4>⚡ Zero-Copy PortChannels</h4>
          <p>Seamless HTML5 MessageChannel bindings allowing isolated microfrontends in React, Svelte, Angular, and Solid to talk with near-native speed.</p>
        </div>

        <div class="feature-card">
          <h4>📐 Standard Schema V1</h4>
          <p>Native compliance with the universal validation standard. Interoperates seamlessly with Zod, FormKit, and TanStack Form.</p>
        </div>

        <div class="feature-card">
          <h4>🧩 Hierarchical IoC Injector</h4>
          <p>Type-safe token-based dependency injection with scoped singletons, transient providers, and child injectors.</p>
        </div>
      </div>
    </section>

    <!-- 2. INSTALLATION -->
    <section id="installation" class="docs-section">
      <h2>Installation</h2>
      <p>Install <code>@collidor/toolkit</code> using your preferred package manager:</p>

      <div class="install-tabs">
        <CodeBlock title="pnpm" language="bash" code="pnpm add @collidor/toolkit" />
        <CodeBlock title="npm" language="bash" code="npm install @collidor/toolkit" />
        <CodeBlock title="bun" language="bash" code="bun add @collidor/toolkit" />
      </div>

      <Callout type="tip" title="Dedicated Module Subpaths">
        <code>@collidor/toolkit</code> provides tree-shakeable subpath exports (e.g. <code>@collidor/toolkit/command</code>, <code>@collidor/toolkit/result</code>, <code>@collidor/toolkit/struct</code>). Your bundler will only bundle the exact modules your application imports.
      </Callout>
    </section>

    <!-- 3. RESULT MONAD -->
    <section id="result" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/result</span>
        <span class="ui-badge ui-badge--accent">Core Primitive</span>
      </div>
      <h2>Result Monad &amp; Railway Composition</h2>
      <p>
        A realm-safe Result monad designed specifically for microfrontend architectures.
        Eliminates cross-iframe <code>instanceof</code> bugs, preserves remote stack traces across Web Workers, and provides functional pipelines (<code>pipe</code> / <code>pipeAsync</code>).
      </p>

      <div class="example-card">
        <h3>Railway Pipelines (pipe &amp; pipeAsync)</h3>
        <p class="example-desc">Chain synchronous or asynchronous operations into a railway-oriented pipeline that automatically short-circuits on failure without try/catch boilerplate.</p>
        <CodeBlock
          language="typescript"
          title="railway-pipeline.ts"
          code='import { Result } from "@collidor/toolkit/result";

// 1. Synchronous functional pipeline
const calculateBattleDamage = (basePower: number) =>
  Result.pipe(
    Result.ok(basePower),
    (power) => power > 0 ? Result.ok(power) : Result.err("Invalid move power"),
    (power) => Result.ok(power * 1.5),            // Same-Type Attack Bonus (STAB)
    (power) => Result.ok(Math.round(power * 0.85)) // Random variance
  );

const syncResult = calculateBattleDamage(90);
console.log("Damage:", Result.unwrap(syncResult)); // 115'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runResultPipeline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Execute Pipeline
          </button>
          <div v-if="exampleOutputs['result-pipeline']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['result-pipeline'] }}</span>
          </div>
        </div>
      </div>

      <div class="example-card">
        <h3>Pattern Matching &amp; Unwrapping</h3>
        <p class="example-desc">Exhaustive functional pattern matching over Ok and Err branches with zero exception leaks.</p>
        <CodeBlock
          language="typescript"
          title="pattern-match.ts"
          code='import { Result } from "@collidor/toolkit/result";

const outcome = Result.try(() => JSON.parse(\x27{"status":"ok"}\x27));

const message = Result.match(outcome, {
  ok: (val) => `Parsed successfully: ${JSON.stringify(val)}`,
  err: (err) => `Parse failure: ${err.message}`,
});'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runResultMatch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run Pattern Match
          </button>
          <div v-if="exampleOutputs['result-match']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['result-match'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. COMMAND BUS -->
    <section id="command" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/command</span>
        <span class="ui-badge ui-badge--primary">CQRS Engine</span>
      </div>
      <h2>Async Command Bus &amp; CQRS</h2>
      <p>
        Enterprise command dispatching with explicit single-handler contracts, middleware pipelines, and boundary-safe Result monads.
        Works in-memory, across Web Workers, or across iframe boundaries via <code>PortChannelPlugin</code>.
      </p>

      <div class="example-card">
        <h3>Registering &amp; Executing Commands with Result</h3>
        <p class="example-desc">
          When commands return a <code>Result</code>, include the <code>Result&lt;Success, Error&gt;</code> type in the <code>Command&lt;Payload, ReturnType&gt;</code> generic definition to ensure complete type safety across the bus execution boundary.
        </p>
        <CodeBlock
          language="typescript"
          title="command-bus.ts"
          code='import { AsyncCommandBus, Command, createCommand, PortChannelPlugin } from "@collidor/toolkit/command";
import { Result } from "@collidor/toolkit/result";

// 1. Declare payload and Result return types
export interface DeployFighterInput {
  fighterName: string;
  level: number;
}

export interface FighterDeployment {
  fighter: string;
  hp: number;
  status: "READY_FOR_BATTLE" | "FAINTED";
}

export type DeployFighterResult = Result<FighterDeployment, string>;

// Class definition with explicit Result return type in Command generic:
export class DeployFighterCommand extends Command<
  DeployFighterInput,
  DeployFighterResult
> {}

// Or createCommand factory (ensures stable constructor name when minified):
export const DeployFighterCmd = createCommand<
  DeployFighterInput,
  DeployFighterResult
>("DeployFighterCommand");

// 2. Register single handler returning typed Result
const commandBus = new AsyncCommandBus();

commandBus.register(DeployFighterCommand, async (cmd) => {
  if (cmd.data.level <= 0) {
    return Result.err("Invalid level: must be positive");
  }
  return Result.ok({
    fighter: cmd.data.fighterName,
    hp: cmd.data.level * 25,
    status: "READY_FOR_BATTLE",
  });
});

// 3. Dispatch command: execute() returns strictly typed Promise<DeployFighterResult>
const res: DeployFighterResult = await commandBus.execute(
  new DeployFighterCommand({ fighterName: "Charizard", level: 50 })
);

Result.match(res, {
  ok: (val) => console.log(`Deployed ${val.fighter} with ${val.hp} HP`),
  err: (err) => console.error(`Deployment failed: ${err}`),
});'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runCommandExample">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Execute Command
          </button>
          <div v-if="exampleOutputs['command-dispatch']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['command-dispatch'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. EVENT BUS -->
    <section id="event" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/event</span>
        <span class="ui-badge ui-badge--accent">Pub / Sub</span>
      </div>
      <h2>Event Bus &amp; Cross-Context PortChannels</h2>
      <p>
        Decoupled broadcast event pub/sub. Multiple subscribers can listen to strongly-typed event classes.
        Subscriber callbacks receive the unwrapped payload data directly as their first argument.
        With <code>PortChannel</code>, events stream across iframe or worker boundaries via zero-copy HTML5 <code>MessageChannel</code> ports.
      </p>

      <div class="example-card">
        <h3>Event Declaration, Direct Payloads &amp; Teardown</h3>
        <p class="example-desc">
          Subscribe using <code>eventBus.on(Event, (data) => ...)</code>. The listener callback receives the unwrapped data payload directly and returns an unsubscription teardown function.
        </p>
        <CodeBlock
          language="typescript"
          title="event-bus.ts"
          code='import { EventBus, Event, createEvent, PortChannel } from "@collidor/toolkit/event";

// 1. Declare event payload and class
export interface PokemonSelectedPayload {
  id: number;
  name: string;
  type: string;
}

export class PokemonSelectedEvent extends Event<PokemonSelectedPayload> {}

// Or createEvent factory for bundler-safe name preservation:
export const BattleWonEvent = createEvent<{ winner: string; xp: number }>("BattleWonEvent");

const eventBus = new EventBus();

// 2. Subscribe: callback receives unwrapped payload directly
const unsubscribe = eventBus.on(PokemonSelectedEvent, (data) => {
  console.log(`Selected Pokemon: ${data.name} (#${data.id}, Type: ${data.type})`);
});

// 3. Emit event instance
eventBus.emit(new PokemonSelectedEvent({ id: 25, name: "Pikachu", type: "electric" }));

// 4. Teardown listener when unmounting
unsubscribe();'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runEventExample">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Emit Event to Bus
          </button>
          <div v-if="exampleOutputs['event-bus']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['event-bus'] }}</span>
          </div>
        </div>
      </div>

      <div class="example-card">
        <h3>Cross-Context PortChannel Binding</h3>
        <p class="example-desc">Wire EventBus across microfrontend iframe boundaries with zero-copy HTML5 MessagePorts.</p>
        <CodeBlock
          language="typescript"
          title="cross-context-port.ts"
          code='import { EventBus, PortChannel } from "@collidor/toolkit/event";

// 1. Establish native HTML5 MessageChannel
const channel = new MessageChannel();

// 2. Attach PortChannel to EventBus instance
const hostBus = new EventBus({
  channel: new PortChannel(channel.port1, { source: "host-shell" }),
});

// Transfer port2 to sandboxed iframe or Web Worker
iframe.contentWindow.postMessage({ type: "INIT_PORT" }, "*", [channel.port2]);'
        />
      </div>
    </section>

    <!-- 6. OBSERVABLE COMMANDS -->
    <section id="observable-command" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/observable-command</span>
        <span class="ui-badge ui-badge--primary">Reactive RxJS</span>
      </div>
      <h2>Observable Command Streams</h2>
      <p>
        Integrates reactive streams powered by RxJS into the CQRS Command architecture.
        Allows declarative pipelines, debouncing, buffering, retry logic, and cancelable asynchronous pipelines.
      </p>

      <div class="example-card">
        <h3>Reactive Command Execution with RxJS</h3>
        <CodeBlock
          language="typescript"
          title="observable-commands.ts"
          code='import { ObservableCommandBus } from "@collidor/toolkit/observable-command";
import { Command } from "@collidor/toolkit/command";
import { Result } from "@collidor/toolkit/result";
import { from, of } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";

type FetchInput = { pokemonId: number };
type FetchResult = Result<{ name: string; hp: number }, string>;

class FetchPokemonCmd extends Command<FetchInput, FetchResult> {}

const obsBus = new ObservableCommandBus();

// Handlers can return Observable, Promise, or plain value
obsBus.register(FetchPokemonCmd, (cmd) => {
  return of(Result.ok({ name: `Pokemon #${cmd.data.pokemonId}`, hp: 100 }));
});

// Stream commands sequentially with switchMap
from([1, 2, 3]).pipe(
  switchMap(id => obsBus.execute(new FetchPokemonCmd({ pokemonId: id }))),
  catchError(err => of(Result.err(err.message)))
).subscribe(result => {
  Result.match(result, {
    ok: (data) => console.log("Stream fetched:", data.name),
    err: (err) => console.error("Stream failed:", err),
  });
});'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runObservableCommand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run RxJS Stream
          </button>
          <div v-if="exampleOutputs['obs-command']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['obs-command'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. OBSERVABLE EVENTS -->
    <section id="observable-event" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/observable-event</span>
        <span class="ui-badge ui-badge--accent">Reactive Streams</span>
      </div>
      <h2>Observable Event Streams</h2>
      <p>
        Bridges the pub/sub Event Bus with RxJS Observables. Transform event occurrences into reactive continuous streams that can be filtered, mapped, debounced, throttled, or combined with other reactive state.
      </p>

      <div class="example-card">
        <h3>Stream Operations with ObservableEventBus</h3>
        <p class="example-desc">
          Subscribe to typed events using <code>obsBus.on(EventType)</code> and leverage standard RxJS operators like <code>filter</code>, <code>map</code>, and <code>debounceTime</code>.
        </p>
        <CodeBlock
          language="typescript"
          title="observable-event.ts"
          code='import { EventBus, Event } from "@collidor/toolkit/event";
import { ObservableEventBus } from "@collidor/toolkit/observable-event";
import { filter, map, debounceTime } from "rxjs/operators";

export class StatChangeEvent extends Event<{ stat: string; delta: number; pokemon: string }> {}

const eventBus = new EventBus();
const obsEventBus = new ObservableEventBus(eventBus);

// Stream events through RxJS operators:
const subscription = obsEventBus.on(StatChangeEvent).pipe(
  filter((event) => event.stat === "speed"),
  map((event) => `${event.pokemon}\x27s speed changed by ${event.delta > 0 ? "+" : ""}${event.delta}`)
).subscribe((message) => {
  console.log("Reactive Event Stream:", message);
});

// Emit event
obsEventBus.emit(new StatChangeEvent({ stat: "speed", delta: 2, pokemon: "Pikachu" }));

// Clean teardown
subscription.unsubscribe();'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runObservableEvent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run Event Stream
          </button>
          <div v-if="exampleOutputs['obs-event']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['obs-event'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. DEPENDENCY INJECTION -->
    <section id="injector" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/injector</span>
        <span class="ui-badge ui-badge--accent">IoC Container</span>
      </div>
      <h2>Hierarchical Dependency Injector</h2>
      <p>
        Lightweight, decorator-free dependency injection container. Supports class and token registrations, type-safe resolution, safe fallback queries, and parent-child scoping hierarchies.
      </p>

      <div class="example-card">
        <h3>Class Registrations &amp; Child Scopes</h3>
        <p class="example-desc">
          Register instances via <code>register(Type, instance)</code>, inject them type-safely via <code>inject(Type)</code>, or query safely with <code>safeInject(Type)</code>. Child injectors transparently inherit and resolve from parent containers.
        </p>
        <CodeBlock
          language="typescript"
          title="injector.ts"
          code='import { Injector } from "@collidor/toolkit/injector";
import { EventBus } from "@collidor/toolkit/event";

class PokedexService {
  getTrainer() { return "Ash Ketchum"; }
}

class BattleService {
  getArena() { return "Indigo Plateau"; }
}

// 1. Root Injector
const rootInjector = new Injector();
rootInjector.register(PokedexService, new PokedexService());
rootInjector.register(EventBus, new EventBus());

// 2. Type-safe injection
const pokedex = rootInjector.inject(PokedexService); // typed as PokedexService
const safeBus = rootInjector.safeInject(EventBus);     // typed as EventBus | null

// 3. Hierarchical Child Injector
const childInjector = new Injector(rootInjector);
childInjector.register(BattleService, new BattleService());

// Resolves local registrations and delegates up to parent:
const trainer = childInjector.inject(PokedexService).getTrainer();
const arena = childInjector.inject(BattleService).getArena();'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runInjectorExample">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Test Injector Resolution
          </button>
          <div v-if="exampleOutputs['injector-example']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['injector-example'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. SCHEMA COMMANDS -->
    <section id="schema-command" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/schema-command</span>
        <span class="ui-badge ui-badge--primary">Standard Schema V1</span>
      </div>
      <h2>Schema Commands &amp; Contract Validation</h2>
      <p>
        Commands with built-in runtime contract validation against Zod schemas or Standard Schema V1.
        Specify explicit input schemas and output schemas to validate data boundaries before handler execution.
      </p>

      <div class="example-card">
        <h3>Typed Schema Command Definition (Input &amp; Output Schemas)</h3>
        <p class="example-desc">
          <code>createSchemaCommand(name, inputSchema, outputSchema)</code> validates incoming payloads and ensures the handler return type satisfies the output schema.
        </p>
        <CodeBlock
          language="typescript"
          title="schema-command.ts"
          code='import { AsyncCommandBus } from "@collidor/toolkit/command";
import { createSchemaCommand } from "@collidor/toolkit/schema-command";
import { z } from "zod";

// 1. Define input & output validation contracts
const AddMemberInput = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  role: z.enum(["starter", "substitute"]).default("starter"),
});

const AddMemberOutput = z.object({
  success: z.boolean(),
  instanceId: z.string(),
  summary: z.string(),
});

// 2. Create bundler-safe schema command with input AND output schemas
export const AddTeamMemberCommand = createSchemaCommand(
  "AddTeamMemberCommand",
  AddMemberInput,
  AddMemberOutput
);

// 3. Register on CommandBus
const commandBus = new AsyncCommandBus();

commandBus.register(AddTeamMemberCommand, async (cmd) => {
  // cmd.data is strictly inferred from AddMemberInput:
  return {
    success: true,
    instanceId: `member-${cmd.data.id}-${Date.now()}`,
    summary: `Added ${cmd.data.name} as ${cmd.data.role}`,
  };
});

// 4. Dispatch with runtime validation
const result = await commandBus.execute(
  new AddTeamMemberCommand({ id: 25, name: "Pikachu" })
);'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runSchemaCommand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Validate Command Contracts
          </button>
          <div v-if="exampleOutputs['schema-command']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['schema-command'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 10. STRUCT & BRIDGES -->
    <section id="struct" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/struct</span>
        <span class="ui-badge ui-badge--accent">Schema Engine</span>
      </div>
      <h2>Struct Engine &amp; Lossless Bridges</h2>
      <p>
        Universal data modeling with bidirectional bridges to Zod and JSON Schema (Draft 7 / 2020-12), automatic form inspection for <code>&lt;ui-struct-form&gt;</code>, and relational SQL DDL generator.
      </p>

      <div class="example-card">
        <h3>Defining Structures with s.struct() &amp; Schema Bridges</h3>
        <CodeBlock
          language="typescript"
          title="struct-demo.ts"
          code='import { s, toZod, toJSONSchema } from "@collidor/toolkit/struct";

// 1. Universal schema definition
const UserProfile = s.struct({
  id: s.string().uuid(),
  username: s.string().trim().toLowerCase().min(3),
  email: s.string().email(),
  role: s.enum(["admin", "editor", "viewer"]).default("viewer"),
  verified: s.boolean().default(false),
});

// 2. Infer TypeScript type
export type User = s.infer<typeof UserProfile>;

// 3. Native Standard Schema V1 validation
const validation = UserProfile.safeParse({
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "Red",
  email: "red@kanto.org",
});

// 4. Bidirectional Interoperability Bridges
const zodEquivalent = toZod(UserProfile);
const jsonSchemaSpec = toJSONSchema(UserProfile);'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runStructExample">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Compile Struct Schema
          </button>
          <div v-if="exampleOutputs['struct-example']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['struct-example'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Promo Banner -->
    <div class="playground-promo-card">
      <div class="promo-text">
        <h3>⚡ Full-Screen 5-Framework Pokédex Demo</h3>
        <p>
          Experience <code>@collidor/toolkit</code> in action across 5 frameworks!
          Watch Vue 3 Shell orchestrate real-time PortChannel streams between sandboxed React 18, Svelte 5, Angular 18, and Solid.js iframes.
        </p>
      </div>
      <button class="promo-btn" @click="emit('launchDemo')">
        Launch Pokédex Demo →
      </button>
    </div>
  </div>
</template>

<style scoped>
.doc-content {
  padding: 2.618em 3em;
  max-width: 980px;
}

@media (max-width: 900px) {
  .doc-content {
    padding: 1.618em 1em;
  }
}

.docs-section {
  margin-bottom: 3.618em;
}

.section-badge-row {
  display: flex;
  align-items: center;
  gap: 0.8em;
  margin-bottom: 0.6em;
}

.pkg-tag {
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.825rem;
  color: var(--ui-color-accent, oklch(0.78 0.18 160));
  background: var(--ui-color-surface-elevated, oklch(0.18 0.02 260));
  padding: 2px 8px;
  border-radius: var(--ui-radius-sm, 4px);
  border: 1px solid var(--ui-color-border-subtle, oklch(0.25 0.02 260));
}

.lead {
  font-size: 1.1rem;
  line-height: 1.65;
  color: var(--ui-color-text-muted, oklch(0.85 0.02 260));
  margin-bottom: 2em;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2em;
  margin: 1.8em 0;
}

.feature-card {
  background: var(--ui-card-bg, oklch(0.16 0.02 260));
  border: 1px solid var(--ui-color-border, oklch(0.25 0.02 260));
  border-radius: var(--ui-radius-md, 8px);
  padding: 1.2em;
}

.feature-card h4 {
  margin-top: 0;
  margin-bottom: 0.5em;
  font-size: 1rem;
  color: var(--ui-color-text, #ffffff);
}

.feature-card p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ui-color-text-muted, oklch(0.75 0.02 260));
}

.example-card {
  background: var(--ui-card-bg, oklch(0.16 0.02 260));
  border: 1px solid var(--ui-color-border, oklch(0.25 0.02 260));
  border-radius: var(--ui-radius-lg, 12px);
  padding: 1.618em;
  margin-bottom: 2em;
  box-shadow: var(--ui-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
}

.example-card h3 {
  margin-top: 0;
  margin-bottom: 0.382em;
  font-size: 1.15rem;
}

.example-desc {
  font-size: 0.9rem;
  color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
  margin-bottom: 1em;
}

.action-runner {
  display: flex;
  flex-direction: column;
  gap: 0.8em;
  margin-top: 1em;
}

.run-btn {
  background: var(--ui-color-primary, oklch(0.62 0.2 260));
  color: #ffffff;
  border: none;
  border-radius: var(--ui-radius-sm, 6px);
  padding: 0.5em 1em;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  align-self: flex-start;
  transition: opacity 0.146s ease, transform 0.146s ease;
}
.run-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.output-box {
  background: var(--ui-color-surface-elevated, oklch(0.11 0.015 260));
  border: 1px solid var(--ui-color-border, oklch(0.25 0.02 260));
  border-radius: var(--ui-radius-sm, 6px);
  padding: 0.6em 0.9em;
  font-family: var(--ui-font-mono, monospace);
  font-size: 0.825rem;
  display: flex;
  align-items: center;
  gap: 0.6em;
}
.output-label {
  color: var(--ui-color-accent, oklch(0.78 0.18 160));
  font-weight: 700;
}
.output-text {
  color: var(--ui-color-text, #ffffff);
}

.install-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

/* Promo Card in Docs */
.playground-promo-card {
  background: linear-gradient(135deg, var(--ui-color-surface-elevated, oklch(0.18 0.025 260)) 0%, oklch(0.22 0.04 260) 100%);
  border: 1px solid var(--ui-color-primary-border, oklch(0.65 0.19 230 / 0.4));
  border-radius: var(--ui-radius-lg, 12px);
  padding: 1.618em 2em;
  margin: 3em 0 1em 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.618em;
  flex-wrap: wrap;
}

.promo-text h3 {
  margin-top: 0;
  margin-bottom: 0.382em;
  font-size: 1.25rem;
}
.promo-text p {
  margin-bottom: 0;
  font-size: 0.92rem;
  color: var(--ui-color-text-muted, oklch(0.82 0.02 260));
}

.promo-btn {
  background: var(--ui-color-primary, oklch(0.65 0.19 230));
  color: #ffffff;
  border: none;
  border-radius: var(--ui-radius-full, 9999px);
  padding: 0.7em 1.618em;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.146s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
.promo-btn:hover {
  background: var(--ui-color-primary-hover, oklch(0.72 0.2 230));
  transform: translateY(-2px);
}
</style>
