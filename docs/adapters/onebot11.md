---
sidebar_position: 3
title: OneBot 11
description: 官方 OneBot 11 Adapter 的计划范围。
---

官方 OneBot 11 Adapter 位于 `adapters/onebot11/`，**尚未开始实现**。本页描述 [实施计划](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/onebot11.md) 中的范围。

## 计划范围

- 每个实例建立一条**正向 WebSocket** 连接（只接受 `forward` 模式），握手带 `access_token`，连接后调用 `get_login_info` 取得账号。反向 WebSocket 不在 v0.1 范围内。
- 断线按有界退避重连，重连不会重放已提交的发送。
- 私聊、群聊、撤回与成员事件的标准化，以及群主、群管理员与好友私聊的平台权限（`adapters/onebot11/perm`）。
- 发送计划与回执、入站与出站媒体、`onebot11.face` 扩展。
- 本地 OneBot 11 模拟服务 `onebottest`。

真实 QQ 端依赖非官方协议实现，有账号风险，只由维护者手动测试；CI 与验收使用本地模拟服务。
