---
sidebar_position: 2
title: Implementation Status
description: Current AlonaBot 0.1-beta capabilities, upcoming work and runtime evidence.
---

Updated **2026-11-18**, against main at [`e0a38d7`](https://github.com/AlonaBot/AlonaBot/commit/e0a38d7c1de9061abc51ba1c82423bfdbbd4805c). Capability status follows the [implementation plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/PLAN.md) and source; environments and results are recorded in [TEST-MATRIX §3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md). The API remains at 0.1-beta.

## Available for plugin development

- **Commands and events**: longest paths and aliases, argument binding, text Rules, automatic replies, typed events, permission admission and multi-turn waits. See [Commands and Events](../plugins/commands.md).
- **Messages and media**: `message.Content` / `Chain`, manual replies, explicit targets and background sends, per-part receipts, editing and streaming text; upload, read and grants through `sdk/media`. Editing, deletion, buttons and media depend on adapter capabilities. See [Messages and Media](../plugins/messages.md).
- **Configuration and storage**: `OnConfigLoad`, defaults and corrections, secrets, dynamic options, KV, managed SQLite and conversation history. Profiles now apply chat-level plugin switches, field overrides, SDK invocation views and `core.profile.*` services (PR #242); profile-specific prefixes and reply behavior remain in T-04.19. See [Configuration](../plugins/config.md) and [Storage](../plugins/storage.md).
- **Collaboration and background work**: Service Broker, non-persistent Event Bus, `sdk/llm`, tool registration, static schedules, dynamic tasks and button interactions. See [Services and Models](../plugins/services.md) and [Background Work and Interactions](../plugins/background.md).
- **HTTP and pages**: Core proxies plugin routes; private routes use admin authentication. `sdk/page` supplies a page kit. Full WebUI plugin-page bridge integration has upcoming work; see [HTTP and Plugin Pages](../plugins/http.md).
- **Local tests**: `plugintest` assembles real Core and SDK sessions in-process, with sequential event injection through a test adapter. Permissions, capabilities and model substitutes are configurable. See [Plugin Testing](../plugins/testing.md).

## Core and tools

- **Runtime and lifecycle**: state store, `core.lock`, native component processes, TCP / stdio IPC, handshake, activation, stopping and fault recovery.
- **On-demand wake**: installed plugins/Agents resume from `SUSPENDED` through a command/event, Service or HTTP request, reusing the generation, configuration and database (PR #241). Automatic idle exit, immediate-sleep policy and Scheduler wake remain upcoming; see [Component Lifecycle](../concepts/lifecycle.md#resume-the-same-generation).
- **Author CLI**: top-level `init`, `check`, `build`, `test`, `pack`; `run --reload` builds and watches development components, with resources injected by an overlay. Settings use `core_config.json`. See [Quick Start](quick-start.md).
- **Management and installation**: admin authentication and API, component install/start/stop, source updates, candidate generations and recovery, instance/configuration management, logs and diagnostics. Commands are in the repository [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md).
- **Library mode**: root-package `alonabot.Run` assembles Core in a Go program and supports in-process components. `plugintest` reuses this runtime path.
- **Official Agent**: conversations and streaming output, model configuration and `llm.generate`, tool confirmation, MCP, memory, skills and scheduled tasks are merged. Configuration-profile integration and five plugin management pages are upcoming; see the [Agent plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/agent.md).

## Platforms and admin interface

- **[Telegram](../adapters/telegram.md)**: long polling, normalization, inbound media, send plans and receipts, references and buttons, button callbacks, text editing, platform permissions and proxy modes are implemented. More media/segments, platform actions/deletion and command menus are upcoming.
- **[OneBot 11](../adapters/onebot11.md)**: forward WebSocket, account lookup, reconnects, receiving/normalization, platform permissions and `onebottest` are implemented. Sending/media, reverse WebSocket and actions are upcoming.
- **WebUI**: real login, overview, component lists/details and bot accounts use the Admin API ([PR #238](https://github.com/AlonaBot/AlonaBot/pull/238)). Configuration/permissions, logs, models, statistics/store and plugin pages have upcoming work; see the [WebUI plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/webui.md).

## Runtime evidence

The repository’s real runtime records are primarily on **darwin/arm64**. Other platform records include `CGO_ENABLED=0` cross-compilation; consult TEST-MATRIX for individual runtime results.

Telegram has a darwin/arm64 record for receiving real private messages. Sending, editing and fault matrices mainly use the local Bot API server. OneBot 11 uses local `onebottest`; real QQ testing is part of the upcoming cross-adapter acceptance.

On **2026-11-17, darwin/arm64**, WebUI was installed on a real Core and checked in a browser: login, overview, plugin lists/details and bot accounts, covering light desktop and dark mobile layouts. Adding and starting/stopping a real Telegram account has not been run.
