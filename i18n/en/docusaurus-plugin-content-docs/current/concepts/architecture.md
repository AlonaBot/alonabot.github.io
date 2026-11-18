---
sidebar_position: 1
title: Architecture
description: How Core, components and the SDK divide responsibilities, and who owns which state.
---

AlonaBot is a single Go module (`github.com/AlonaBot/AlonaBot`) split into packages by responsibility. Module boundaries and allowed imports are defined in [ARCHITECTURE.md](https://github.com/AlonaBot/AlonaBot/blob/main/ARCHITECTURE.md); this page covers the concepts.

## One Core, many processes

```text
        chat platforms (Telegram, OneBot 11, ...)
                          |
                       Adapter
                          |
      +------------------ Core ------------------+
      | routing / permissions / send / media     |
      | service broker / event bus / scheduler   |
      | http / config & secret / generations     |
      +-------+--------------+--------------+----+
              |              |              |
          plugins          Agent    WebUI (static files)
```

- **Core** is the single hub. One `data_dir` runs one Core, enforced by `core.lock`.
- **Installed plugins, adapters and Agents** run as separate processes. Each talks to Core through the SDK, never to each other.
- **WebUI** supplies static pages served read-only by Core and uses the versioned Admin API. A WebUI package may also include a Go entry for backend services; the current official `web/admin` package is static.

Install components from trusted sources: plugin processes run with the same OS user’s permissions.

Library mode can register in-process components. `plugintest` uses this path to assemble a real Core, SDK sessions and a test adapter inside `go test`. See [Plugin Testing](../plugins/testing.md).

## Main modules

| Module | Responsibility |
| --- | --- |
| `contracts/` | `.proto` sources and generated types, manifest/release/message validation, schedule calculation, config schema parsing. No runtime I/O |
| `internal/wire/` | Frame codec, TCP/stdio transport, session call table, admission budgets, priority lane and cancellation |
| `internal/core/` | State store, processes, lifecycle, routing, permissions, media, service broker, Event Bus, HTTP entry, config and secrets, admin auth |
| `plugintest/` | Library-mode test harness, event injection, permission/capability/model setup and accepted-send/handler-result collection |
| `sdk/` | Component-side API: root plugin, Context and sending, chained registration, lifecycle hooks, managed SQLite (`sdk/sqlitedb`, `sdk/gormdb`), adapter role (`sdk/adapter`) |
| `adapters/telegram/`, `adapters/onebot11/` | Official adapters: platform API, receiving and normalization, send plans, platform permissions, local mock servers |
| `agent/` | Official Agent: conversation loop, providers, tools and MCP, memory |
| `web/admin/` | Official WebUI: Vite + TypeScript + React 19 |
| `cmd/alonabot/` | Assembles Core startup and the developer and admin CLI |

A few hard rules: `sdk` never imports `internal/core`, `internal/core` never imports `sdk`, and neither adapters nor plugins import `internal/core`. Components reach Core only through the public SDK.

## State ownership

| State | Sole owner |
| --- | --- |
| `<data_dir>/core.lock`, `state.sqlite` (installs, components and sources, generations, policies, secret refs, Agent sessions) | Core |
| `<plugins>/<id>/runtime.lock`, the plugin's managed DB connection | The SDK inside the plugin process |
| Plugin business data (managed SQLite candidate files) | The plugin; Core only copies candidates and admits them |
| Data the plugin manages itself (external databases, files outside the framework) | The plugin; Core never creates, checks or backs it up |

## Further reading

- [Plugin Basics](../plugins/first-plugin.md) and [Storage](../plugins/storage.md)
- [Component Lifecycle](lifecycle.md)
- [Wire Protocol](wire-protocol.md)
- Specs: [DESIGN.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/DESIGN.md), [CONTRACTS-v0.1.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md)
