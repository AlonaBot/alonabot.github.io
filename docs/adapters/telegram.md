---
sidebar_position: 2
title: Telegram
description: 官方 Telegram Adapter 的范围与实现状态。
---

官方 Telegram Adapter 位于 `adapters/telegram/`，入口程序是 [alonabot-adapter-telegram](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/cmd/alonabot-adapter-telegram/main.go)。

## 已实现

- 账号检查与 long polling 接收，逐条游标与标准化。
- 入站六类媒体的映射。Core 读取媒体时，Adapter 按需调用 `getFile` 并按 Range 分块下载，上限 20 MiB，错误信息会脱敏。
- 本地 Bot API 模拟服务 [telegramtest](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/telegramtest/server.go)。

真实私聊消息的接收已在 darwin/arm64 上验证过。完整的 Core 装配与其他真实平台场景由后继切片联合验证。

## 尚未实现

发送、出站媒体、按钮、命令策略与 Rule。webhook 接收不在 v0.1 范围内。
