---
slug: /
sidebar_position: 0
sidebar_label: Overview
title: AlonaBot Overview
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

## Key advantages

<div className="advantages">

| Advantage | Mechanism | Reference |
| --- | --- | --- |
| Dependency isolation | One process and one `go.mod` per plugin; dependencies and crashes never leak across plugins. An SDK-only plugin is ~7.5 MiB PSS | [§7.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#71-native-进程与安装边界) |
| Hot deploy | `alonabot run --reload`: Core stays up and restarts only changed components; adapter connections and other plugins are untouched; a failed build keeps the old version | [§15.4](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#154-开发运行与热部署) |
| Transactional updates | Managed SQLite candidate copy + atomic ActiveGeneration commit; a failed prepare returns to the old generation and data | [§6.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#63-sqlite-候选与维护), [§12](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#12-跨层状态机与恢复不变量) |
| Built-in Agent | Conversation loop, memory, MCP; tool calls require user confirmation per policy; plugins call models via `llm.generate` without vendor SDKs | [§13](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#13-agent-基础) |
| Plugin collaboration | Typed Service calls admitted by the Service Broker, a non-persistent Event Bus, JSON Schema validation of inputs and outputs; JSON Services can be exposed as Agent tools | [§3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#3-跨插件调用动态-router-与权限), [§13.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#131-工具与调用策略) |
| Trusted permissions | Core computes Actor permissions, so plugins cannot forge them; proactive sends are gated by per-instance send grants; config secrets are stored as immutable references | [§2.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#23-权限与-hook), [§5.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#53-secret-与翻译) |
| Signed distribution | Packages and `release.json` are Ed25519-signed and updates are pinned to the original source; official Adapter / Agent / WebUI can be swapped with `--replace` | [§9.2](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#92-来源摘要与签名), [§9.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#93-cli-的最小完整动作) |
| Typed SDK | Mismatched hook signatures fail at compile time; registration code and Service Schemas are generated at build time with no runtime reflection scan | [§9.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#91-manifest-与构建产物) |
| Real-Core testing | `plugintest` starts a real Core and test adapter inside `go test`; library mode embeds Core in any Go program | [§15.5](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#155-库模式), [§17](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#17-插件测试套件) |

</div>

## Scope of 0.1

Command / text-match / event routing, multi-turn waits, Service calls and the Event Bus, scheduling, configuration and managed databases, plugin HTTP routes, admin CLI, component install and update, en / zh-CN text. Distribution: release archive, `install.sh` (systemd / launchd), `docker compose`; plus library mode and `go test` integration tests via `plugintest`.

Implementation status: [Implementation Status](guide/status.md).

## Next

- [Quick Start](guide/quick-start.md)
- [Architecture](concepts/architecture.md)
- [Plugin Basics](plugins/first-plugin.md)
