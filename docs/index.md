---
slug: /
sidebar_position: 0
sidebar_label: 概述
title: AlonaBot 概述
description: 用 Go 编写聊天机器人，通过统一 SDK 接入不同平台并测试真实回复。
---

AlonaBot 是跨平台的 Go 聊天机器人框架。你编写插件的业务逻辑，**Core** 负责路由、权限、消息、配置、存储和组件管理，**Adapter** 接入聊天平台。

| 组件 | 作用 |
| --- | --- |
| 插件 | 命令、事件处理和业务服务；安装后各自运行 Native Go 进程 |
| Adapter | 平台接入、事件标准化与发送；官方提供 Telegram、OneBot 11 |
| Agent | 模型调用、对话、工具确认、MCP、记忆与定时任务 |
| WebUI | 管理登录、总览、组件与机器人账号；由 Core 提供静态页面 |

文档对应 **0.1-beta**，API 仍在变化。本文按 2026-11-18 的主仓库 main 整理，已实现能力与后继工作见[实现状态](guide/status.md)。行为契约见主仓库的[规格](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md)。

## 从一个插件逐步扩展

### 一次编写，多平台复用

命令、事件和消息使用同一套 SDK。Adapter 提供标准化事件和实例能力，业务代码据此选择按钮、编辑等功能；平台实现进度见 [Adapter 概述](adapters/index.md)。从[命令与事件](plugins/commands.md)、[消息与媒体](plugins/messages.md)开始。

### 本机验证真实回复

`plugintest` 在 `go test` 中装配真实 Core、SDK Session 和测试 Adapter。直接注入文本、按钮或任务，检查回复、权限、受管数据库与多轮等待。[测试指南](plugins/testing.md)从 `/ping` 的完整断言开始。

### 改插件，其他组件继续运行

开发时使用 `alonabot run --reload`。Core 保持运行，只重启变化的组件，构建失败继续运行旧版本，方便边修改边观察回复。具体命令见[快速开始](guide/quick-start.md)。

### 各插件自主选择依赖

Native 插件分别构建为独立可执行文件，依赖版本随各自构建确定，安装后按组件运行和定位故障。作者可使用独立 `go.mod`，也可像入门工程一样复用所在仓库的模块。只导入用到的 SDK 包，减少额外初始化和常驻资源。职责与状态归属见[架构](concepts/architecture.md)。

### 更新失败保留受管数据

安装组件更新时，Core 先创建受管 SQLite 候选副本，候选准备失败恢复旧代次与旧数据库。业务数据采用[受管存储](plugins/storage.md)可以沿用这条更新路径；自管文件和外部数据库由插件安排恢复。

### 复用服务与模型

已有业务能力可注册为 Service，通知可通过非持久 Event Bus 广播。需要模型时，使用 `sdk/llm` 调用 Agent，统一管理模型配置。用法见[服务、广播与模型](plugins/services.md)。

## 选择入口

- [快速开始](guide/quick-start.md)：在本机运行 Core 与开发插件。
- [编写第一个插件](plugins/first-plugin.md)：从 `New() *sdk.Plugin`、命令注册和组件构建开始。
- [测试插件](plugins/testing.md)：用 `go test` 检查业务结果。
- [配置](plugins/config.md)、[后台与交互](plugins/background.md)、[HTTP 与插件页面](plugins/http.md)：按业务需要添加能力。
