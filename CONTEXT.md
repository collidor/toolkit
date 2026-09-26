# Collidor Toolkit Showcase

Domain language and concepts for the Collidor Toolkit multi-framework demonstration and documentation application.

## Language

**Command**:
A request object representing an intentional action to execute, with strongly typed input payload and return type.
_Avoid_: Action, message, RPC call

**CommandBus**:
The centralized dispatcher that routes a Command to its registered handler and returns the execution result.
_Avoid_: Controller, router, dispatcher

**Event**:
A typed broadcast object notifying listeners that a state change or milestone occurred.
_Avoid_: Signal, notification, message

**EventBus**:
The pub/sub broker distributing Events to active subscribers.
_Avoid_: Subject, emitter

**PortChannel**:
A cross-context communication bridge adapting `MessagePortLike` interfaces (MessagePort, BroadcastChannel, Window postMessage) for event distribution.
_Avoid_: Connector, transport, socket

**PortChannelPlugin**:
A CommandBus extension enabling transparent remote Command dispatch and response handling over a PortChannel.
_Avoid_: RPC adapter, network bridge

**Result**:
A monad representing either success with a value or failure with an error, engineered to safely cross execution realms (such as iframes) without `instanceof` brittleness.
_Avoid_: TryCatch, Either, ReturnObject

**SchemaCommand**:
A Command with attached Zod validation schemas for verifying boundary inputs and outputs at runtime.
_Avoid_: ValidatedCommand, FormCommand

**Showcase Shell**:
The top-level host application managing navigation, documentation layout, and micro-frontend integration.
_Avoid_: Parent app, container page

**Widget**:
A framework-isolated UI piece (built in React, Vue, Svelte, Solid, or Angular) fulfilling a dedicated Pokédex responsibility.
_Avoid_: Micro-frontend, sub-app, plugin
