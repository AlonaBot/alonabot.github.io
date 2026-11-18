---
sidebar_position: 1
title: 架构
description: Core、组件与 SDK 的职责划分，以及谁拥有哪些状态。
---

AlonaBot 是一个 Go module（`github.com/AlonaBot/AlonaBot`），按职责分包。模块边界与允许的 import 方向以仓库的 [ARCHITECTURE.md](https://github.com/AlonaBot/AlonaBot/blob/main/ARCHITECTURE.md) 为准，本页只讲概念。

## 一个 Core，多个子进程

```text
        chat platforms (Telegram, OneBot 11, ...)
                          |
                       Adapter
                          |
      +------------------ Core ------------------+
      | routing / permissions / send / media     |
      | service broker / event bus / scheduler   |
      | http / config & secret / generations     |
      +-------+--------------+--------------+----+
              |              |              |
          plugins          Agent    WebUI (static files)
```

- **Core** 是唯一的调度中心。同一个 `data_dir` 只运行一个 Core，由 `core.lock` 保证。
- **安装的插件、Adapter、Agent** 各自运行独立子进程，经 SDK 与 Core 通信，互相之间不直接调用。
- **WebUI** 提供静态页面，由 Core 只读托管，经带主版本号的 Admin API 管理 Core。组件包也可携带 Go 入口提供后台服务；当前官方 `web/admin` 包采用静态形式。

安装时选择可信来源：插件进程拥有同一 OS 用户的权限。

库模式支持注册同进程组件。`plugintest` 沿用这条路径，在 `go test` 内装配真实 Core、SDK Session 和测试 Adapter，见[测试插件](../plugins/testing.md)。

## 主要模块

| 模块 | 负责 |
| --- | --- |
| `contracts/` | `.proto` 源与生成类型、manifest/release/消息结构校验、调度触发计算、配置声明解析。不做任何运行时 I/O |
| `internal/wire/` | 帧编解码、TCP/stdio 传输、Session 调用表、准入预算、优先通道与取消 |
| `internal/core/` | 状态库、进程、生命周期编排、路由、权限、媒体、Service Broker、Event Bus、HTTP 入口、配置与 secret、管理认证 |
| `plugintest/` | 库模式测试环境、事件注入、权限/能力/模型设置，收集接受的发送与 Handler 结果 |
| `sdk/` | 组件侧 API：根插件、Context 与发送、链式注册、生命周期 Hook、受管 SQLite（`sdk/sqlitedb`、`sdk/gormdb`）、Adapter 角色（`sdk/adapter`） |
| `adapters/telegram/`、`adapters/onebot11/` | 官方 Adapter：平台 API、接收与标准化、发送计划、平台权限、本地模拟服务 |
| `agent/` | 官方 Agent：对话循环、Provider、工具与 MCP、记忆 |
| `web/admin/` | 官方 WebUI：Vite + TypeScript + React 19 |
| `cmd/alonabot/` | Core 启停、开发者与管理 CLI 的装配入口 |

依赖方向有几条硬规则：`sdk` 不导入 `internal/core`，`internal/core` 不导入 `sdk`，Adapter 与插件都不导入 `internal/core`。组件只能通过公共 SDK 与 Core 交互。

## 状态归属

| 状态 | 唯一所有者 |
| --- | --- |
| `<data_dir>/core.lock`、`state.sqlite`（安装、组件与来源、代次、策略、secret 引用、Agent 会话） | Core |
| `<plugins>/<id>/runtime.lock`、插件受管 DB 连接 | 插件进程内的 SDK |
| 插件业务数据（受管 SQLite 候选文件） | 插件；Core 只负责候选复制与准入 |
| 插件自管的外部数据（外部数据库、框架外文件） | 插件；Core 不创建、不校验、不备份 |

## 延伸阅读

- [插件入门](../plugins/first-plugin.md)与[存储](../plugins/storage.md)
- [组件生命周期](lifecycle.md)
- [Wire 协议](wire-protocol.md)
- 规格：[DESIGN.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/DESIGN.md)、[CONTRACTS-v0.1.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md)
