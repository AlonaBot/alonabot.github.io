---
sidebar_position: 1
title: Adapter 概述
description: Adapter 在 AlonaBot 中的职责，以及官方 Adapter 的进度。
---

Adapter 把一个聊天平台接入 Core。它是有进程的非插件组件：用 `sdk/adapter` 与 `sdk.RunAdapter` 运行，负责平台 API 客户端、接收与标准化、发送计划、平台取件、平台权限与本地模拟服务。

命令路由、Core 策略、游标持久化与按钮 token 都**不归** Adapter，而是由 Core 负责。所以同一个插件在不同平台上的行为一致。

## 官方 Adapter

| Adapter | 程序 | 状态 |
| --- | --- | --- |
| [Telegram](telegram.md) | `adapters/telegram/` | 部分实现：接收、标准化与入站媒体 |
| [OneBot 11](onebot11.md) | `adapters/onebot11/` | 未开始 |

## 替换官方 Adapter

Adapter、Agent 与 WebUI 同一类不能并存。用社区组件替换官方组件需要在安装时加 `--replace`。安装命令仍在实现中。

## 扩展约定

- 实现放在可导入的包中（例如 `telegram.New()`），程序入口只调用 `sdk.RunAdapter`。实例配置的 schema 写在包内的 `instance_schema.json`。
- 平台权限与扩展事件放在常量包 `adapters/<id>/perm` 与 `adapters/<id>/event`，插件可以导入它们而不链接 Adapter 的运行时。
- 每个平台都有可控故障的本地模拟服务。模拟服务的测试结果不代替真实平台的验证。
