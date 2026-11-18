---
sidebar_position: 2
title: Component Lifecycle
description: The states a component process goes through and the hooks the SDK provides.
---

Each installed plugin normally runs in a separate process; library mode and plugintest run components in-process. Core starts it, handshakes, validates its registration and atomically commits a generation before it receives any work. Disabling, updating or reloading config drains it first, then stops it.

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
| Suspended | Process exited; the enabled component retains its snapshot | A command/event, Service or HTTP request wakes the original generation |

Unexpected exits use bounded restarts: **3 exits within 5 minutes** disables the plugin. Disabling a plugin keeps it stopped.

## Explicit callbacks

Call `registerLifecycle(p)` in `New()`. Import `sdk`, standard-library `context` and `log/slog`:

```go
func registerLifecycle(p *sdk.Plugin) {
    p.OnStart(func(ctx context.Context) error {
        slog.InfoContext(ctx, "plugin preparing")
        return nil
    })
    p.OnReady(func(ctx context.Context) error {
        slog.InfoContext(ctx, "plugin activating")
        return nil
    })
    p.OnStop(func(ctx context.Context) error {
        slog.InfoContext(ctx, "plugin stopping")
        return nil
    })
}
```

`OnStart` runs after configuration and database preparation, before REGISTER. Open resources here and close plugin-owned resources in `OnStop`; the SDK closes managed database connections. `OnReady` runs after ACTIVATE and before ACTIVATED. Callback registration takes typed function signatures; each callback is registered at most once.

Business Send, Service and task operations require Session readiness, so keep them out of `OnStart` and `OnReady`. The ready gate opens after the SDK writes ACTIVATED. Use handlers, continuations or schedules for business work; the SDK lifetime cancels on disconnection and shutdown. Plugin-owned goroutines respond to cancellation and finish during stopping.

Normal handler Contexts expire on return. [Background Tasks and Interaction](../plugins/background.md) explains independent continuations and timed jobs. `sdk/conversation` stores JSON history; waiting for the next message uses `c.Wait` in a continuation.

## Resume the same generation

Waking an installed plugin/Agent from `SUSPENDED` reuses its generation, configuration and business database. `RESUME` skips SELF/VERSIONED database migration callbacks, while configuration loading, defaults/corrections and required validation still run; the complete configuration must match the original snapshot. `OnStart` and `OnReady` run again, and Core checks the registration digest. Cold starts use the request's original deadline; routes and permissions are checked again before delivery.

Declare `sleep_capable: true` only for components that can recover through restart and have no independent background activity. On-demand wake is connected; automatic idle exit and immediate-sleep policy remain in S-02.2, and Scheduler wake in S-03.1. Development components, Adapters and WebUI remain resident. See [on-demand wake and validation](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#按需唤醒与验证).

## Exclusive access across generations

The SDK holds a cross-generation `runtime.lock` in the plugin directory. A new process cannot start as a second writer while the old one still holds managed resources.

## Further reading

- Specs: [CONTRACTS §4](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md), [DESIGN §A](https://github.com/AlonaBot/AlonaBot/blob/main/spec/DESIGN.md)
