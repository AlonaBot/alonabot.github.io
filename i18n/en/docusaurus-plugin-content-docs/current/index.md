---
slug: /
title: Overview
description: Deploy bots, develop Go plugins, and connect platforms and AI.
---

AlonaBot is a lightweight, cross-platform Go chatbot framework. Independent components connect chat platforms, implement plugins, and provide AI capabilities.

## Get started

| Goal | Start here |
| --- | --- |
| Deploy a bot | [Installation](usage/install.md) → [Connect Telegram](platforms/telegram.md) |
| Write a Go plugin | [Quick start](quick-start.md) → [Commands and arguments](tutorial/commands.md) |
| Set up AI conversations | [Agent](usage/agent.md) |
| Connect another platform | [Build an Adapter](develop/adapter.md) |

## Core features

- **Separate processes**: Core manages component startup, shutdown, and restarts.
- **Modular components**: install and replace plugins, Adapters, Agents, and WebUI independently.
- **Low resource usage**: disabling a component releases its process. Plugins that support hibernation exit when idle and wake on demand.
- **Go SDK**: commands, events, SQLite, configuration forms, hot reload, and tests with a real Core.
- **Central management**: manage accounts, models, permissions, and logs through WebUI and CLI.

See [Architecture](internals/architecture.md) for component relationships, and the [CLI](reference/cli.md), [events](reference/events.md), and [configuration schema](reference/config-schema.md) references for interfaces.
