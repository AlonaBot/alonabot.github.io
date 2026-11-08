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
| Plugin | Bot features, one process each |
| Adapter | Connects a chat platform; official ones for Telegram and OneBot 11 |
| Agent | Conversation, memory and tool calls (tools need user confirmation) |
| WebUI | Admin interface, static files only |

Components never talk to each other directly; everything goes through Core. Core handles routing, permissions, sending, plugin collaboration, scheduling, HTTP, configuration and installation.

:::warning Early development

These docs cover **0.1-beta**. Much is not implemented yet, and every page states its current status. When they disagree with the [specification](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md), the specification wins.

:::

## Principles

- **Light**: about 7.5 MiB per plugin; link only what you use.
- **Pleasant**: a plugin is a plain Go program; wrong signatures fail at compile time.
- **Minimal config**: works out of the box.
- **Evidence-based**: done means tested and run on the target platform; cross-compiling alone does not count.

## Scope of 0.1

Commands and events, multi-turn conversations, service calls and broadcasts, schedules, configuration and databases, plugin HTTP, admin CLI, component install and update, English and Simplified Chinese text. Install via release archive, `install.sh` or `docker compose`, or embed it as a Go library and test plugins with `go test`.

See [Status](guide/status.md) for what works today.

## Next

- [Quick start](guide/quick-start.md)
- [Architecture](concepts/architecture.md)
- [Write your first plugin](plugins/first-plugin.md)
