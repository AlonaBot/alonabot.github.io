---
slug: /
sidebar_position: 0
sidebar_label: 介绍
title: 什么是 AlonaBot
description: 轻量级、跨平台的 Go 聊天机器人框架。
---

AlonaBot 是轻量级、跨平台的 Go 聊天机器人框架：一个 **Core**，加上可替换的组件。

| 组件 | 作用 |
| --- | --- |
| 插件 | 业务逻辑，每个插件一个 Native Go 子进程 |
| Adapter | 平台接入与事件标准化，官方提供 Telegram、OneBot 11 |
| Agent | 对话循环、记忆、工具调用（需用户确认） |
| WebUI | 管理界面，静态组件包 |

组件间无直接通信，均经 Core 中转。Core 负责事件路由、权限、消息发送、Service Broker、Event Bus、调度、公开 HTTP 入口、配置与 secret、安装代次。

:::warning 早期开发中

文档对应 **0.1-beta**，多数能力尚未实现，各页标注实现状态。与 [规格](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md) 冲突时以规格为准。

:::

## 设计原则

- **低内存占用**：单插件约 7.5 MiB PSS（linux/amd64），按需链接。
- **编译期校验**：Hook 签名不符在 `sdk.Run` 调用处编译失败。
- **最小配置**：缺省值开箱即用。
- **证据驱动验收**：以集成测试与目标平台运行记录为准，交叉编译不计入。

## 0.1 范围

命令 / 文本匹配 / 事件路由、多轮等待、Service 调用与 Event Bus、调度、配置与受管数据库、插件 HTTP 路由、管理 CLI、组件安装与更新、en / zh-CN 文案。分发形式：发行归档、`install.sh`（systemd / launchd）、`docker compose`；另支持库模式嵌入与基于 `plugintest` 的 `go test` 集成测试。

实现状态见 [当前进度](guide/status.md)。

## 下一步

- [快速开始](guide/quick-start.md)
- [架构](concepts/architecture.md)
- [编写第一个插件](plugins/first-plugin.md)
