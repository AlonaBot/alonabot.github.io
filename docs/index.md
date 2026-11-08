---
slug: /
sidebar_position: 0
sidebar_label: 概述
title: AlonaBot 概述
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

## 核心优势

<div className="advantages">

| 优势 | 机制 | 依据 |
| --- | --- | --- |
| 依赖隔离 | 每个插件独立进程、独立 `go.mod`，依赖与崩溃互不影响；只用 SDK 的插件约 7.5 MiB PSS | [§7.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#71-native-进程与安装边界) |
| 热部署 | `alonabot run --reload`：Core 常驻，只重启变更组件，Adapter 连接与其他插件不受影响；编译失败保留旧版本 | [§15.4](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#154-开发运行与热部署) |
| 事务化更新 | 受管 SQLite 候选副本 + ActiveGeneration 原子提交，准备失败回到旧代次与旧数据 | [§6.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#63-sqlite-候选与维护)、[§12](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#12-跨层状态机与恢复不变量) |
| 内置 Agent | 对话循环、记忆、MCP；工具调用按策略需用户确认；插件经 `llm.generate` 调用模型，无需内嵌厂商 SDK | [§13](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#13-agent-基础) |
| 插件协作 | Service Broker 准入的类型化 Service 调用，非持久 Event Bus 广播，输入输出按 JSON Schema 校验；JSON Service 可声明为 Agent 工具 | [§3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#3-跨插件调用动态-router-与权限)、[§13.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#131-工具与调用策略) |
| 可信权限 | Actor 权限由 Core 计算，插件不可伪造；主动发送按实例发信许可准入；配置中的 secret 以不可变引用存储 | [§2.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#23-权限与-hook)、[§5.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#53-secret-与翻译) |
| 签名分发 | 安装包与 `release.json` 使用 Ed25519 签名，更新锁定原来源；官方 Adapter / Agent / WebUI 可用 `--replace` 替换 | [§9.2](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#92-来源摘要与签名)、[§9.3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#93-cli-的最小完整动作) |
| 类型化 SDK | Hook 签名不符在编译期失败；注册代码与 Service Schema 在构建期生成，运行时不做反射扫描 | [§9.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#91-manifest-与构建产物) |
| 真实 Core 测试 | `plugintest` 在 `go test` 中启动真实 Core 与测试 Adapter；库模式可将 Core 嵌入任意 Go 程序 | [§15.5](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#155-库模式)、[§17](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#17-插件测试套件) |

</div>

## 0.1 范围

命令 / 文本匹配 / 事件路由、多轮等待、Service 调用与 Event Bus、调度、配置与受管数据库、插件 HTTP 路由、管理 CLI、组件安装与更新、en / zh-CN 文案。分发形式：发行归档、`install.sh`（systemd / launchd）、`docker compose`；另支持库模式嵌入与基于 `plugintest` 的 `go test` 集成测试。

实现状态见 [实现状态](guide/status.md)。

## 下一步

- [快速开始](guide/quick-start.md)
- [架构](concepts/architecture.md)
- [插件入门](plugins/first-plugin.md)
