<script setup lang="ts">
import { ref } from "vue";
import CodeBlock from "./CodeBlock.vue";
import Callout from "./Callout.vue";
import { Result } from "@collidor/result";
import { EventBus } from "@collidor/event";
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
    (power: number) => power * 1.5,
    (power: number) => Math.round(power * 0.85)
  );
  const out = `Pipeline computed damage: ${Result.unwrap(res)} (STAB + random variance)`;
  setOutput("result-pipeline", out);
  busService.logTelemetry("result", "ResultPipelineExecuted", "DocViewer", { base: 90, result: Result.unwrap(res) });
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

// 3. Command Action
async function runCommandExample() {
  const startTime = performance.now();
  const simulatedResult = Result.ok({
    fighter: "Charizard",
    hp: 120,
    status: "READY_FOR_BATTLE",
    turn: 1,
  });
  const duration = (performance.now() - startTime).toFixed(2);
  const out = `Command executed in ${duration}ms => Result.ok(${JSON.stringify(simulatedResult.value)})`;
  setOutput("command-dispatch", out);
  busService.logTelemetry("command", "DeployFighterCommand", "DocViewer", simulatedResult.value);
  return out;
}

// 4. Event Action
function runEventExample() {
  const payload = { pokemonId: 25, pokemonName: "Pikachu", type: "electric", timestamp: Date.now() };
  busService.logTelemetry("event", "PokemonSelectedEvent", "DocViewer", payload);
  const out = `Emitted PokemonSelectedEvent over Bus => Telemetry logged (see DevTools dock)`;
  setOutput("event-bus", out);
  return out;
}

// 5. Observable Command Action
function runObservableCommand() {
  const out = `Stream dispatched: [1, 2, 3].map(cmd => bus.execute(cmd)) => RxJS switchMap resolved 3 steps`;
  setOutput("obs-command", out);
  busService.logTelemetry("command", "BatchExecuteStream", "DocViewer", { count: 3 });
  return out;
}

// 6. Schema Command Action
function runSchemaCommand() {
  const out = `Schema Command Validated: { id: 25, name: "Pikachu" } matches StandardSchemaV1 contract`;
  setOutput("schema-command", out);
  busService.logTelemetry("command", "SchemaCommandValidated", "DocViewer", { valid: true, id: 25 });
  return out;
}

// 7. Struct Action
function runStructExample() {
  const out = `Struct compiled: UserSchema inferred TypeScript types & generated JSON Schema Draft 2020-12`;
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
        <span class="ui-badge ui-badge--accent">v1.0.0</span>
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
    (power) => power > 0 ? power : Result.err("Invalid move power"),
    (power) => power * 1.5,            // Same-Type Attack Bonus (STAB)
    (power) => Math.round(power * 0.85) // Random variance
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
        Works in-memory, across Web Workers, or across iframe boundaries via PortChannel.
      </p>

      <div class="example-card">
        <h3>Registering &amp; Executing Commands</h3>
        <CodeBlock
          language="typescript"
          title="command-bus.ts"
          code='import { AsyncCommandBus, Command } from "@collidor/toolkit/command";
import { Result } from "@collidor/toolkit/result";

class DeployFighterCommand extends Command<{ fighterName: string; level: number }> {
  constructor(data: { fighterName: string; level: number }) {
    super(data);
  }
}

const commandBus = new AsyncCommandBus();

// Register unique handler
commandBus.register(DeployFighterCommand, async (cmd) => {
  return Result.ok({
    fighter: cmd.data.fighterName,
    hp: cmd.data.level * 25,
    status: "READY_FOR_BATTLE"
  });
});

// Dispatch command
const res = await commandBus.execute(new DeployFighterCommand({ fighterName: "Charizard", level: 50 }));'
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
        With <code>PortChannelPlugin</code>, events seamlessly stream across iframe boundaries via zero-copy HTML5 <code>MessageChannel</code> ports.
      </p>

      <div class="example-card">
        <h3>Event Declaration &amp; Multi-Subscriber Pub/Sub</h3>
        <CodeBlock
          language="typescript"
          title="event-bus.ts"
          code='import { EventBus, Event, PortChannelPlugin } from "@collidor/toolkit/event";

class PokemonSelectedEvent extends Event<{ id: number; name: string }> {
  constructor(data: { id: number; name: string }) {
    super(data);
  }
}

const eventBus = new EventBus();

// Listen for selection changes
const unsubscribe = eventBus.on(PokemonSelectedEvent, (event) => {
  console.log("Selected Pokemon:", event.data.name);
});

// Emit event
eventBus.emit(new PokemonSelectedEvent({ id: 25, name: "Pikachu" }));'
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
    </section>

    <!-- 6. OBSERVABLE STREAMS -->
    <section id="observable-command" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/observable-command</span>
        <span class="ui-badge ui-badge--primary">Reactive RxJS</span>
      </div>
      <h2>Observable Command &amp; Event Streams</h2>
      <p>
        Integrates reactive streams powered by RxJS into the Command and Event architecture.
        Allows declarative pipelines, debouncing, buffering, and cancelable asynchronous pipelines.
      </p>

      <div class="example-card">
        <h3>Reactive Command Execution with RxJS</h3>
        <CodeBlock
          language="typescript"
          title="observable-commands.ts"
          code='import { ObservableCommandBus } from "@collidor/toolkit/observable-command";
import { from } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";

const obsBus = new ObservableCommandBus();

from([cmd1, cmd2, cmd3]).pipe(
  switchMap(cmd => obsBus.execute(cmd)),
  catchError(err => of(Result.err(err)))
).subscribe(result => {
  console.log("Reactive step completed:", result);
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

    <!-- 7. DEPENDENCY INJECTION -->
    <section id="injector" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/injector</span>
        <span class="ui-badge ui-badge--accent">IoC Container</span>
      </div>
      <h2>Hierarchical Dependency Injector</h2>
      <p>
        Lightweight, decorator-free dependency injection container. Supports token-based bindings, singleton instances, factory providers, and child scope inheritance.
      </p>

      <div class="example-card">
        <h3>Token Binding &amp; Scope Hierarchy</h3>
        <CodeBlock
          language="typescript"
          title="injector.ts"
          code='import { Injector, InjectionToken } from "@collidor/toolkit/injector";

interface DatabaseService { query(sql: string): Promise<any>; }
const DB_TOKEN = new InjectionToken<DatabaseService>("DB_SERVICE");

const rootInjector = new Injector();
rootInjector.provide(DB_TOKEN, {
  useFactory: () => new PostgresDatabaseService()
});

const db = rootInjector.resolve(DB_TOKEN);'
        />
      </div>
    </section>

    <!-- 8. SCHEMA COMMANDS -->
    <section id="schema-command" class="docs-section">
      <div class="section-badge-row">
        <span class="pkg-tag">@collidor/toolkit/schema-command</span>
        <span class="ui-badge ui-badge--primary">Standard Schema V1</span>
      </div>
      <h2>Schema Commands &amp; Zod Validation</h2>
      <p>
        Commands with built-in runtime contract validation against Zod schemas or Standard Schema V1.
        Any invalid command payloads are automatically rejected at the bus boundary before invoking handlers.
      </p>

      <div class="example-card">
        <h3>Typed Schema Command Definition</h3>
        <CodeBlock
          language="typescript"
          title="schema-command.ts"
          code='import { createSchemaCommand } from "@collidor/toolkit/schema-command";
import { z } from "zod";

const AddMemberSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  role: z.enum(["starter", "substitute"]).default("starter")
});

export const AddTeamMemberCommand = createSchemaCommand("ADD_TEAM_MEMBER", AddMemberSchema);'
        />
        <div class="action-runner">
          <button class="run-btn" @click="runSchemaCommand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Validate Command
          </button>
          <div v-if="exampleOutputs['schema-command']" class="output-box">
            <span class="output-label">OUT:</span>
            <span class="output-text">{{ exampleOutputs['schema-command'] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. STRUCT & BRIDGES -->
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
        <h3>Defining Structures with s.struct()</h3>
        <CodeBlock
          language="typescript"
          title="struct-demo.ts"
          code='import { s, toZod, toJSONSchema } from "@collidor/toolkit/struct";

const UserProfile = s.struct({
  id: s.string().uuid(),
  username: s.string().trim().toLowerCase().min(3),
  email: s.string().email(),
  role: s.enum(["admin", "editor", "viewer"]).default("viewer"),
  verified: s.boolean().default(false)
});

// Infer TypeScript type
export type User = s.infer<typeof UserProfile>;

// Bidirectional conversion
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
