---
sidebar_position: 3
title: OneBot 11
description: 官方 OneBot 11 Adapter 的连接配置、接收能力与发送进度。
---

官方 OneBot 11 Adapter 位于 [`adapters/onebot11/`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/onebot11)。2026-11-18 的 main 已实现连接与接收（[PR #109](https://github.com/AlonaBot/AlonaBot/pull/109)），发送与媒体属于后继 T-15.2。

## 配置实例

字段来自 [`adapter_config_schema.json`](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/onebot11/adapter_config_schema.json)：

- `ws_url`：必填，OneBot 实现的正向 WebSocket 地址。
- `access_token`：Secret，需要鉴权时填写，避免写入仓库或日志。
- `mode`：默认 `forward`，当前 Schema 只接受此值。

每个实例建立一条正向 WebSocket 连接，连接后调用 `get_login_info` 取得账号。实例在 Core 中的配置方式见主仓库[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)。

## 已实现

- 正向 WebSocket 连接、握手鉴权、账号查询与有界退避重连。
- `self_id` 与数组消息格式检查，实例事件队列和逐条交付。
- 私聊、群聊、撤回与成员事件的标准化，以及 `to_me`。
- 群主、群管理员与好友私聊权限，常量位于 [`adapters/onebot11/perm`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/onebot11/perm)。
- 本地模拟服务 [`onebottest`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/onebot11/onebottest)。

## 后继工作

发送计划与回执、入站/出站媒体、`onebot11.face` 属于 T-15.2；反向 WebSocket、新增片段、扩展事件、平台动作与撤回、会话标题等也有后继切片。详细进度见 [OneBot 11 计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/onebot11.md)。

目前验证插件回复时，先使用[回环 Adapter](../guide/quick-start.md)或[plugintest](../plugins/testing.md)。首页 QQ 对话展示统一 SDK 的交互示意，真实 OneBot 11 发送需等待 T-15.2。

## 验证与账号风险

接收与故障场景已通过本地 `onebottest` 验证。真实 QQ 端依赖非官方协议实现，有账号风险，由维护者在授权账号上手动测试；后继 T-15.3 汇总真实平台与跨 Adapter 一致性证据。
