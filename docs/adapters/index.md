---
sidebar_position: 1
title: Adapter 概述
description: 用 Adapter 接入平台，按实例能力复用插件业务。
---

Adapter 把一个聊天平台接入 Core，使用 `sdk/adapter` 与 `sdk.RunAdapter` 运行。它负责平台 API、接收与标准化、发送计划、媒体取件和平台权限。

Core 统一处理命令路由、权限策略、游标持久化和按钮 token。插件使用统一的[命令](../plugins/commands.md)与[消息 SDK](../plugins/messages.md)，再按实例的能力声明选择按钮、编辑、媒体等功能。

## 官方 Adapter

- **[Telegram](telegram.md)**：接收、入站媒体、发送与回执、按钮及回调、文本编辑、平台权限和代理模式已实现。
- **[OneBot 11](onebot11.md)**：正向 WebSocket、接收与标准化、平台权限已实现；发送与媒体尚待实现。

本机开发可先用[回环 Adapter](../guide/quick-start.md)观察回复，再通过[plugintest](../plugins/testing.md)检查业务逻辑。连接真实平台前，核对对应 Adapter 的进度与实例配置。

## 安装与替换

不同平台的 Adapter 可以并存，例如同时安装 Telegram 与 OneBot 11。同一个 `adapter_id` 由一个 Adapter 实现负责，可配置多个实例；Agent 与 WebUI 各保留一个实现。

替换已有的同类组件时，安装命令加 `--replace`。安装、来源更新和恢复命令见主仓库[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)。

## 开发 Adapter

- 实现放在可导入的包中，例如 `telegram.New()`；程序入口调用 `sdk.RunAdapter`。实例配置 Schema 放在包内的 `adapter_config_schema.json`。
- 平台权限与扩展事件放在 `adapters/<id>/perm`、`adapters/<id>/event` 常量包，插件可单独导入。
- 平台能力由 Descriptor / 实例报告。只声明已有实现的功能，平台动作还需声明名称、版本及输入/结果 Schema。
- 使用本地模拟服务验证故障和回执；真实平台的运行环境与结果单独记录在 [TEST-MATRIX](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md)。

依据：[Adapter SDK](https://github.com/AlonaBot/AlonaBot/tree/main/sdk/adapter)、[适配器实施计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/README.md)。
