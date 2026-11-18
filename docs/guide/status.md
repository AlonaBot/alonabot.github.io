---
sidebar_position: 2
title: 实现状态
description: AlonaBot 0.1-beta 的当前能力、后继工作与运行证据。
---

更新于 **2026-11-18**，对照主仓库 main 的 [`e0a38d7`](https://github.com/AlonaBot/AlonaBot/commit/e0a38d7c1de9061abc51ba1c82423bfdbbd4805c)。能力状态依据[实施计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/PLAN.md)与实际源码；验收环境和结果见 [TEST-MATRIX §3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md)。API 仍处于 0.1-beta。

## 插件开发可用能力

- **命令与事件**：最长路径与别名、参数绑定、文本 Rule、自动回复、类型化事件、权限准入与多轮等待。见[命令与事件](../plugins/commands.md)。
- **消息与媒体**：`message.Content` / `Chain`、手动回复、显式其他目标和后台发送、逐项发送回执、消息编辑与流式文本；`sdk/media` 提供上传、读取与转授。编辑、撤回、按钮和媒体的实际可用性取决于 Adapter 能力，见[消息与媒体](../plugins/messages.md)。
- **配置与存储**：`OnConfigLoad`、补值与校正、Secret、动态选项、KV、受管 SQLite、会话历史。配置文件已接通会话插件开关、字段覆盖、SDK 调用视图与 `core.profile.*` 服务（PR #242）；前缀与回复方式的配置文件应用仍属 T-04.19。见[配置](../plugins/config.md)与[存储](../plugins/storage.md)。
- **协作与后台**：Service Broker、非持久 Event Bus、`sdk/llm`、工具登记、静态调度与动态任务、按钮交互。见[服务与模型](../plugins/services.md)、[后台与交互](../plugins/background.md)。
- **HTTP 与页面**：Core 代理插件路由，私有路由接入管理认证；`sdk/page` 提供页面套件。WebUI 的完整插件页面桥集成仍有后继工作，见[HTTP 与插件页面](../plugins/http.md)。
- **本地测试**：`plugintest` 在同进程装配真实 Core 与 SDK，通过测试 Adapter 顺序注入事件；可配置权限、能力与模型替身。见[测试插件](../plugins/testing.md)。

## Core 与工具

- **运行与生命周期**：状态库、`core.lock`、Native 组件进程、TCP / stdio IPC、握手、激活、停止与故障恢复。
- **按需唤醒**：已安装 plugin/agent 从 `SUSPENDED` 经命令/事件、Service 或 HTTP 恢复原代次，复用配置与数据库（PR #241）。自动空闲退出与即时休眠策略、Scheduler 到期唤醒仍有后继工作，见[组件生命周期](../concepts/lifecycle.md#同代次恢复)。
- **作者 CLI**：顶层 `init`、`check`、`build`、`test`、`pack`；`run --reload` 构建并监视开发组件，资源由 overlay 注入。启动设置使用 `core_config.json`，见[快速开始](quick-start.md)。
- **管理与安装**：管理认证与 API、组件安装、启停、来源更新、候选代次与恢复、实例和配置管理、日志及诊断命令。命令见主仓库[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)。
- **库模式**：根包 `alonabot.Run` 在 Go 程序中装配 Core，可注册同进程组件；`plugintest` 复用这条运行路径。
- **官方 Agent**：对话与流式输出、模型配置与 `llm.generate`、工具确认、MCP、记忆、技能和定时任务已合入。配置文件接入与五个插件管理页面仍在后继切片，见 [Agent 计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/agent.md)。

## 平台与管理界面

- **[Telegram](../adapters/telegram.md)**：long polling、标准化与入站媒体、发送计划与回执、引用与按钮、按钮回调、文本编辑、平台权限和代理模式已有实现。更多媒体与片段、平台动作/撤回、命令菜单等仍在后继切片。
- **[OneBot 11](../adapters/onebot11.md)**：正向 WebSocket、账号查询、重连、接收与标准化、平台权限和 `onebottest` 已实现；发送与媒体、反向 WebSocket、动作等尚待实现。
- **WebUI**：真实登录、总览、组件列表/详情与机器人账号页已接入 Admin API（[PR #238](https://github.com/AlonaBot/AlonaBot/pull/238)）。配置与权限、日志、模型、统计/商店、插件页面等有后继工作，见 [WebUI 计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/webui.md)。

## 运行证据

主仓库记录的真实运行环境以 **darwin/arm64** 为主；其他目标平台的记录包含 `CGO_ENABLED=0` 交叉编译，具体运行结果逐项见 TEST-MATRIX。

Telegram 的真实私聊接收有 darwin/arm64 记录；发送、编辑和故障矩阵主要使用本地 Bot API 模拟服务。OneBot 11 使用本地 `onebottest`，真实 QQ 手测属于后继一致性验收。

WebUI 在 **2026-11-17、darwin/arm64** 的真实 Core 上完成安装与浏览器检查：登录、总览、插件列表/详情、机器人账号，覆盖浅色桌面与深色手机。真实 Telegram 账号的添加与启停尚未运行。
