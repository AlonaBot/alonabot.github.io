---
sidebar_position: 2
title: Component Lifecycle
description: The states a component process goes through and the hooks the SDK provides.
---

Each installed plugin is one process. Core starts it, handshakes, validates its registration and atomically commits a generation before it receives any work. Disabling, updating or reloading config drains it first, then stops it.

## States

| State | Entered when | Next |
| --- | --- | --- |
| Stopped | Initially, or after stopping | Start the process; after the HELLO handshake, Preparing |
| Preparing | Core sends Bootstrap | Config, database migrations, `OnStart`, REGISTER validation; failure before commit returns to Stopped |
| Prepared | Preparation succeeded | Atomically commit ActiveGeneration |
| Activating | Committed | `OnReady`, then ACTIVATED; failure after commit goes to Degraded |
| Activated | ACTIVATED received | Handles events and calls |
| Stopping | Disable, update or config reload | Drain, `OnStop`, exit |
| Degraded | Crash, lost connection or failure after commit | Bounded restart of the current authoritative generation |

Unexpected exits use bounded restarts: **3 exits within 5 minutes** disables the plugin. A normal stop never restarts.

## Hooks

The root plugin embeds `sdk.Base`, which provides empty defaults for every hook. Override only what you need:

```go
func (p *MyPlugin) OnStart(ctx context.Context) error { return nil } // open resources
func (p *MyPlugin) OnReady(ctx context.Context) error { return nil } // last step before activation
func (p *MyPlugin) OnStop(ctx context.Context) error  { return nil } // close resources
```

- `OnStart` and `OnReady` must not wait on the plugin's own public routes or make business Send or Service calls.
- Background work waits for the SDK's ready gate and follows the lifetime context. The gate opens after ACTIVATED is written.
- If the main connection to Core drops, the SDK cancels the lifetime, closes internal HTTP and exits within a deadline.

A hook with the wrong signature makes the root plugin stop satisfying `sdk.Root`, so the `sdk.Run` call fails to compile instead of silently skipping it.

## Exclusive access across generations

The SDK holds a cross-generation `runtime.lock` in the plugin directory. A new process cannot start as a second writer while the old one still holds managed resources.

## Further reading

- Specs: [CONTRACTS §4](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md), [DESIGN §A](https://github.com/AlonaBot/AlonaBot/blob/main/spec/DESIGN.md)
