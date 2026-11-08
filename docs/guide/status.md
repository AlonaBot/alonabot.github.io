---
sidebar_position: 2
title: 实现状态
description: AlonaBot 0.1-beta 已实现与尚未实现的能力。
---

本页按主仓库 `main` 分支整理，更新于 2026-11-08。权威记录是仓库的 [README](https://github.com/AlonaBot/AlonaBot/blob/main/README.md)、[架构地图](https://github.com/AlonaBot/AlonaBot/blob/main/ARCHITECTURE.md) 的「状态」列与 [TEST-MATRIX §3.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md)。

## 已实现

- **协议与工具链**：协议契约、Protobuf 生成工具链、manifest 与 release 校验。
- **Core 基础**：状态库与 core.lock、Native 插件进程、TCP 与 stdio 两种 IPC、握手、激活与停止生命周期、有限重启。
- **路由**：命令的最长路径与别名选择、文本匹配与 Raw、参数绑定、usage 与静默、自动回复、显式事件注册。
- **发送**：原目标手动回复、按实例许可准入的其他目标与后台 `sdk.Send`、媒体分块上传 `sdk.Upload`、入站媒体按需读取与转授（`sdk.ReadMedia`、`sdk.GrantMedia`）。
- **协作**：经 Core Broker 准入的跨插件 Service 调用，非持久的 Event Bus 广播（`sdk.Publish`、`sdk.Subscribe`）。
- **HTTP**：插件 HTTP 路由经 Core 公开入口代理。私有路由尚未接入授权，一律返回 401。
- **设置与生成**：启动设置文件 `alonabot.yaml`，以及构建期生成插件注册代码的 `alonabot plugin generate` 与 `plugin check`。
- **Telegram**：接收、标准化与入站媒体取件。

## 尚未实现

- Telegram 的发送、出站媒体、按钮、命令策略与 Rule。
- 调度、管理 CLI、组件安装与更新、库模式入口 `alonabot.Run`、插件测试套件 `plugintest`。
- 官方 OneBot 11 Adapter、预装插件、官方 Agent 的大部分能力，以及 WebUI 的真实 Admin API 与页面。

目前只有开发用入口 `alonabot run` 与 `alonabot plugin generate`、`plugin check`。

## 平台验证

运行验证只在 darwin/arm64 上做过。linux/amd64、linux/arm64、windows/amd64 与 darwin/amd64 只做了 `CGO_ENABLED=0` 交叉编译，还没有运行证据。
