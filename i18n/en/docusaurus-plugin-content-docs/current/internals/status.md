---
title: Implementation status
description: Capabilities, official components and known issues in v0.2.0.
---

**Core v0.2.0 was released on November 22, 2026.** All five official components also publish v0.2.0 and can be installed or updated independently.

## Distribution

| Delivery | Contents |
| --- | --- |
| Five-platform archives and installer | Core; install components as needed |
| Docker Compose | Core, WebUI and Agent; configure a model before enabling Agent |

Configured Telegram and OneBot11 accounts can trigger automatic official Adapter installation on startup. Upgrade Core, then WebUI and the other components. Older Core installations need an upgrade before online installation/update after legacy release sidecars were removed.

## Available capabilities

Plugins support command arguments, groups and aliases, text matching, permissions and rules, typed standard/extended events, media, buttons, edit/delete APIs, streaming, conversation waits, SQLite/KV, Profiles, static/dynamic tasks, services, broadcasts, model calls, HTTP pages and localization. plugintest exercises plugin paths with a real Core.

Management includes archive installation and discovery, updates and rollback, persistent local credentials, development reloading, diagnostics, logs and idle sleep/wakeup. Command menus filter explicit .Menu() routes by account, chat, language and permissions, with a manual-owner lifecycle.

| Component | Current capabilities |
| --- | --- |
| Telegram | Long polling; text/media, buttons, quotes, edits, deletion, scoped menus, typed actions/events |
| OneBot11 | Forward/reverse WebSocket; message/media send and receive, quotes, merged forwards, recursive nodes, deletion, typed actions/events |
| Agent | Multiple provider protocols, tools and confirmation, MCP, skills, memory; recursive quoted/forwarded content and image sources |
| WebUI | Go backend and frontend; components, store, accounts, Profiles, permissions, logs, data management and single-archive upload |
| help | Commands available in the current chat, /whoami and explicit menu entries |

## Known issues

- SnowLuma v2.4.2 produced empty m_resid values in some nested forwarding XML. This affects some reverse group sends and mixed body/child-node reads. The Adapter preserves parsed nodes and reports a path-specific error. See [OneBot11](../usage/onebot11.md#forward-nodes).
- OneBot11 lacks generic buttons, editing, albums and command menus. Telegram lacks generic forwarded-node reads and ordinary message-deletion events. See the [platform table](../usage/platforms.md).
- Telegram getFile is limited to 20 MiB. Static stickers become images, incoming album messages arrive separately, and edits accept text with optional buttons.
- Back up plugin-managed files and external databases separately; generation rollback restores the managed SQLite database, program and config.
- In-process components share process failure and must terminate their own background goroutines on shutdown.

## Recorded platform verification

Release targets are Linux/macOS amd64/arm64 and Windows amd64. Existing release evidence records:

| Target | Environment |
| --- | --- |
| macOS arm64 | Native Apple Silicon and launchd |
| macOS amd64 | Rosetta; native Intel Mac execution remains unrecorded |
| Linux amd64 | x86_64 Linux VM and systemd |
| Linux arm64 | Container on an ARM host; VM/hardware execution remains unrecorded |
| Windows amd64 | Cross-build and static checks; runtime, CGO and resource measurements deferred |

Existing integration checks used a local Telegram Bot API and synthetic providers. Real Telegram and paid LLM credentials remain unrecorded for the final candidate. v0.2.0 retains the previous scope of cross-build and simulated-service evidence; the SnowLuma real-account issue is recorded separately above. See the [v0.2.0 release notes](https://github.com/AlonaBot/AlonaBot/blob/main/changelog/v0.2.0/en.md) and [upgrade/recovery instructions](../usage/install.md#upgrade-and-recovery).
