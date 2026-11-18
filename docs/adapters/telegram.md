---
sidebar_position: 2
title: Telegram
description: 官方 Telegram Adapter 的实例配置、当前能力与后继工作。
---

官方 Telegram Adapter 位于 [`adapters/telegram/`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/telegram)，入口为 [alonabot-adapter-telegram](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/cmd/alonabot-adapter-telegram/main.go)。以下对照 2026-11-18 的 main。

## 配置实例

实例配置字段来自 [`adapter_config_schema.json`](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/adapter_config_schema.json)：

- `token`：必填 Secret，填写 Bot Token，避免写入仓库或日志。
- `api_base_url`：默认 `https://api.telegram.org`，本地 Bot API 或模拟服务可替换它。
- `proxy_mode`：默认 `none`（直连）；`core` 使用 Core 代理；`custom` 使用实例自己的代理。
- `proxy`：Secret，`custom` 模式使用并要求填写，支持 http / https / socks5 URL。

当前接收方式是 **long polling**。已有 webhook 时实例启动报错，作者先在平台侧处理冲突。Core 在 `core_config.json` 管理实例，文件结构与运行方式见主仓库[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)。

## 已实现

- `getMe` 账号检查、long polling、逐条游标与标准化、私聊/回复/提及的 `to_me`。
- 入站媒体映射及按需 `getFile` 取件、Range 分块下载，当前下载上限 20 MiB，错误脱敏。
- Chain 全量预检与顺序发送计划、文本实体、媒体/相册、首条引用、末条按钮和逐项回执。相册尾部附按钮等平台无法表达的组合返回 `UNSUPPORTED`。
- `callback_query` / `answerCallbackQuery` 与 Core 验证后的按钮点击派发。
- `editMessageText` 文本编辑，保留消息句柄；可供 `c.Stream` 显示增量文本。
- `telegram.chat_owner` / `telegram.chat_admin` 权限及会话管理员查询；实例代理模式和话题判定。
- 本地 Bot API 模拟服务 [telegramtest](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/telegram/telegramtest)。

业务入口见[消息与媒体](../plugins/messages.md)、[按钮交互](../plugins/background.md)、[权限与事件](../plugins/commands.md)。

## 后继工作

更多媒体与新增片段（voice、动图、贴纸、video note、URL 按钮等）、平台动作与撤回、命令菜单、会话标题与服务消息，仍在 [Telegram 计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/telegram.md) 的后继切片。

## 验证环境

真实私聊接收已有 **darwin/arm64** 记录。发送、编辑、回调和故障矩阵主要通过本地 Bot API 模拟服务验证，具体环境与结果见 [TEST-MATRIX §3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md)。
