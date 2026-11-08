---
slug: /
sidebar_position: 0
sidebar_label: Introduction
title: What is AlonaBot
description: A lightweight, cross-platform chatbot framework in Go.
---

AlonaBot is a lightweight, cross-platform chatbot framework in Go: one **Core** plus swappable components.

| Component | Role |
| --- | --- |
| Plugin | Business logic; one native Go subprocess each |
| Adapter | Platform integration and event normalization; official Telegram and OneBot 11 |
| Agent | Conversation loop, memory, tool calls (user-confirmed) |
| WebUI | Admin interface; static component package |

Components never communicate directly; all traffic goes through Core. Core owns event routing, permissions, message sending, the Service Broker, the Event Bus, scheduling, the public HTTP entry, configuration and secrets, and install generations.

:::warning Early development

These docs cover **0.1-beta**. Most capabilities are not implemented yet; each page states its implementation status. When they disagree with the [specification](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md), the specification wins.

:::

## Design principles

- **Low memory footprint**: ~7.5 MiB PSS per plugin (linux/amd64), linked on demand.
- **Compile-time checks**: a mismatched hook signature fails to compile at the `sdk.Run` call.
- **Minimal configuration**: usable with defaults.
- **Evidence-based acceptance**: integration tests and target-platform runs; cross-compilation does not count.

## Scope of 0.1

Command / text-match / event routing, multi-turn waits, Service calls and the Event Bus, scheduling, configuration and managed databases, plugin HTTP routes, admin CLI, component install and update, en / zh-CN text. Distribution: release archive, `install.sh` (systemd / launchd), `docker compose`; plus library mode and `go test` integration tests via `plugintest`.

Implementation status: [Status](guide/status.md).

## Next

- [Quick start](guide/quick-start.md)
- [Architecture](concepts/architecture.md)
- [Write your first plugin](plugins/first-plugin.md)
