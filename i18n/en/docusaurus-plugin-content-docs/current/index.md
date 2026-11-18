---
slug: /
sidebar_position: 0
sidebar_label: Overview
title: AlonaBot Overview
description: Build chatbots in Go with one SDK for platform integration and real-reply testing.
---

AlonaBot is a cross-platform chatbot framework in Go. You write the plugin’s business logic; **Core** handles routing, permissions, messages, configuration, storage and component management, while **adapters** connect chat platforms.

| Component | Role |
| --- | --- |
| Plugin | Commands, event handlers and business services; each installed plugin runs a native Go process |
| Adapter | Platform integration, event normalization and sending; official Telegram and OneBot 11 |
| Agent | Model calls, conversations, tool confirmation, MCP, memory and scheduled tasks |
| WebUI | Admin login, overview, components and bot accounts; static pages served by Core |

These docs cover **0.1-beta**, with an evolving API. This overview follows main as of 2026-11-18. See [Implementation Status](guide/status.md) for implemented features and upcoming work, and the repository [specification](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md) for behavioral contracts.

## Grow from one plugin

### Write once, reuse across platforms

Commands, events and messages share one SDK. Adapters supply normalized events and instance capabilities, so business code can choose features such as buttons and editing. See [Adapter Overview](adapters/index.md) for platform progress; start with [Commands and Events](plugins/commands.md) and [Messages and Media](plugins/messages.md).

### Test real replies locally

`plugintest` assembles a real Core, SDK sessions and a test adapter inside `go test`. Inject text, button clicks or tasks to check replies, permissions, managed storage and multi-turn waits. The [testing guide](plugins/testing.md) starts with a complete `/ping` assertion.

### Reload a plugin, keep the rest running

Use `alonabot run --reload` during development. Core stays running and restarts only changed components; a failed build keeps the previous version. This lets you observe replies as you edit. Commands are in [Quick Start](guide/quick-start.md).

### Choose dependencies per plugin

Native plugins build as separate executables. Each build selects its dependencies, and installed plugins run and expose failures by component. Authors can use their own `go.mod` or reuse the containing repository's module, as the introductory project does. Import only the SDK packages you use to reduce initialization and resident resources. See [Architecture](concepts/architecture.md) for responsibilities and state ownership.

### Keep managed data when an update fails

When updating an installed component, Core first creates a managed SQLite candidate copy. Failed candidate preparation restores the previous generation and database. [Managed storage](plugins/storage.md) follows this update path; plugins arrange recovery for their own files and external databases.

### Reuse services and models

Expose existing functionality as a Service and broadcast notifications on the non-persistent Event Bus. Use `sdk/llm` to call the Agent with centrally managed model configuration. See [Services, Events and Models](plugins/services.md).

## Choose an entry point

- [Quick Start](guide/quick-start.md): run Core and a development plugin locally.
- [Write Your First Plugin](plugins/first-plugin.md): start with `New() *sdk.Plugin`, command registration and component builds.
- [Test Your Plugin](plugins/testing.md): check business results with `go test`.
- [Configuration](plugins/config.md), [Background Work and Interactions](plugins/background.md), [HTTP and Plugin Pages](plugins/http.md): add capabilities as your plugin needs them.
