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
| 插件 | 机器人功能，每个插件一个进程 |
| 适配器 | 接入聊天平台，官方提供 Telegram、OneBot 11 |
| Agent | 对话、记忆、工具调用（调用前需用户确认） |
| WebUI | 管理界面，纯静态文件 |

组件之间不直接通信，一律经过 Core。Core 负责路由、权限、发送、插件协作、调度、HTTP、配置与安装。

:::warning 早期开发中

文档对应 **0.1-beta**，很多功能尚未实现，每页都标明了现状。与 [规格](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md) 冲突时以规格为准。

:::

## 原则

- **轻**：单个插件约 7.5 MiB，按需链接。
- **顺手**：插件就是普通 Go 程序，签名写错编译期报错。
- **少配置**：开箱即用。
- **有证据**：以测试和目标平台运行记录为准，交叉编译不算。

## 0.1 范围

命令与事件、多轮对话、服务调用与广播、定时任务、配置与数据库、插件 HTTP、管理 CLI、组件安装升级、中英文文案。支持发行包、`install.sh`、`docker compose` 安装，也可作为 Go 库嵌入，并用 `go test` 测试插件。

已实现的部分见 [当前进度](guide/status.md)。

## 下一步

- [快速开始](guide/quick-start.md)
- [架构](concepts/architecture.md)
- [编写第一个插件](plugins/first-plugin.md)
