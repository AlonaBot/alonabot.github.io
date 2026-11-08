---
slug: /
sidebar_position: 0
sidebar_label: 介绍
title: 什么是 AlonaBot
description: AlonaBot 是一个轻量级、跨平台的 Go 聊天机器人框架。
---

AlonaBot 是一个轻量级、跨平台的 Go 聊天机器人框架。它由一个 **Core** 和一组可安装、可替换的**组件**组成：

- **插件**：你写的机器人功能，每个插件是一个独立的 Native Go 子进程。
- **Adapter**：把聊天平台接入 Core。官方提供 Telegram 与 OneBot 11 两个 Adapter。
- **Agent**：官方 Agent 提供对话、记忆与工具调用，工具调用需要用户确认。
- **WebUI**：管理界面，只是一组静态文件。

组件之间不直接调用，一律经过 Core：Core 负责事件与命令路由、权限、消息发送、跨插件的 Service 调用与 Event Bus、调度、公开 HTTP 入口、配置与 secret，以及组件的安装与代次。

:::warning 项目处于实施初期

本文档对应 **0.1-beta**。框架按 [实施计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/PLAN.md) 分切片推进，很多能力还在实现中。每一页都标出了当前已经实现的范围；与规格冲突时，以仓库中的 [spec](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md) 为准。

:::

## 设计目标

- **轻量**：只用 SDK 的插件进程实测约 7.5 MiB 常驻内存（linux/amd64 PSS）。SDK 按需拆包，不导入就不链接。
- **好的开发体验**：插件使用普通的 Go Modules、goroutine 与 `net/http`，注册方式只有一种，签名错误在编译期暴露。
- **最小必要配置**：开箱即用，需要改的才写进设置文件。
- **以证据记录完成**：每项能力以编译、集成测试和目标平台运行记录完成情况，交叉编译不代替运行验证。

## 首发范围

v0.1 计划包含：命令、文本匹配与事件处理，多轮等待，Service 调用与广播，调度，配置与数据库，插件 HTTP 路由，管理 CLI，组件安装与更新，英文与简体中文的用户文案。用户可以通过发行归档、`install.sh`（Linux systemd、macOS launchd）或 `docker compose` 安装官方整合包；开发者也可以在自己的 `main.go` 中把框架当作 Go 库运行，并用插件测试套件在 `go test` 中以真实 Core 测试插件。

已经实现了哪些，见 [当前进度](guide/status.md)。

## 接下来读什么

- 想先跑起来：[快速开始](guide/quick-start.md)
- 想了解整体结构：[架构](concepts/architecture.md)
- 想写插件：[编写第一个插件](plugins/first-plugin.md)
