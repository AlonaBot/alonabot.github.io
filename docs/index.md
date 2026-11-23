---
slug: /
title: 概述
description: 部署机器人、开发 Go 插件、接入平台与 AI。
---

AlonaBot 是轻量级、跨平台的 Go 聊天机器人框架。通过独立组件接入聊天平台、扩展业务和 AI 能力。

## 选择入口

| 你想做什么 | 从这里开始 |
| --- | --- |
| 部署机器人 | [安装](usage/install.md) → [接入 Telegram](platforms/telegram.md) |
| 编写 Go 插件 | [快速上手](quick-start.md) → [命令与参数](tutorial/commands.md) |
| 配置 AI 对话 | [Agent](usage/agent.md) |
| 接入其他平台 | [编写 Adapter](develop/adapter.md) |

## 核心能力

- **独立进程**：组件分别运行，Core 管理启动、停止与重启。
- **按需组合**：插件、Adapter、Agent 和 WebUI 独立安装与替换。
- **低资源占用**：停用组件释放进程，支持休眠的插件空闲时退出、按需唤醒。
- **Go SDK**：命令、事件、SQLite、配置表单、热重载与真实 Core 测试。
- **集中管理**：WebUI 与 CLI 管理账号、模型、权限和日志。

组件组成见[架构](internals/architecture.md)，接口查[CLI](reference/cli.md)、[事件](reference/events.md)与[配置 Schema](reference/config-schema.md)。
