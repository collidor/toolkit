[![Codecov](https://codecov.io/gh/collidor/toolkit/branch/main/graph/badge.svg)](https://codecov.io/gh/collidor/toolkit)
[![npm version](https://img.shields.io/npm/v/@collidor/toolkit)](https://www.npmjs.com/package/@collidor/toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# @collidor/toolkit

The modular umbrella toolkit providing unified access to Collidor architecture libraries: Command, Event, Injector, Result, Observable, and Schema systems.

## Installation

```bash
npm install @collidor/toolkit
```

## Modular Subpath Imports

> **Breaking Change**: The monolithic root entrypoint (`@collidor/toolkit`) has been replaced with dedicated, tree-shakeable single entrypoints per module. Import directly from each module subpath:

```typescript
// 1. Command Bus & Commands
import { Command, CommandBus, createCommand } from "@collidor/toolkit/command";

// 2. Event Bus & Cross-Context Channels
import { Event, EventBus, createEvent, PortChannel } from "@collidor/toolkit/event";

// 3. Dependency Injection
import { Injector } from "@collidor/toolkit/injector";

// 4. Observable Streams (RxJS)
import { ObservableCommandBus } from "@collidor/toolkit/observable-command";
import { ObservableEventBus } from "@collidor/toolkit/observable-event";

// 5. Result Monad
import { Result } from "@collidor/toolkit/result";

// 6. Schema Commands (Zod)
import { SchemaCommand, createSchemaCommand } from "@collidor/toolkit/schema-command";
```

## Available Subpath Modules

| Module Subpath | Exports |
| --- | --- |
| `@collidor/toolkit/command` | `Command`, `CommandBus`, `AsyncCommandBus`, `createCommand`, plugins |
| `@collidor/toolkit/event` | `Event`, `EventBus`, `createEvent`, `PortChannel`, `PortEvents` |
| `@collidor/toolkit/injector` | `Injector`, dependency injection tokens & decorators |
| `@collidor/toolkit/observable-command` | `ObservableCommandBus` (RxJS-powered Command Bus) |
| `@collidor/toolkit/observable-event` | `ObservableEventBus` (RxJS-powered Event Bus) |
| `@collidor/toolkit/result` | `Result` monad (`Ok`, `Err`, unwrapping) |
| `@collidor/toolkit/schema-command` | `SchemaCommand`, `schemaCommand`, `createSchemaCommand` |
