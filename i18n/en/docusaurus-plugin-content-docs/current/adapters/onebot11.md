---
sidebar_position: 3
title: OneBot 11
description: Planned scope of the official OneBot 11 adapter.
---

The official OneBot 11 adapter will live in `adapters/onebot11/` and has **not been started**. This page describes the scope in the [implementation plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/onebot11.md).

## Planned scope

- One **forward WebSocket** per instance (only `forward` mode), with `access_token` in the handshake and `get_login_info` to identify the account. Reverse WebSocket is out of scope for v0.1.
- Bounded backoff on reconnect; reconnecting never replays committed sends.
- Normalization of private and group messages, recalls and member events, plus platform permissions for group owner, group admin and friend chats (`adapters/onebot11/perm`).
- Send plans and receipts, inbound and outbound media, the `onebot11.face` extension.
- A local OneBot 11 mock server, `onebottest`.

Real QQ clients rely on unofficial protocol implementations with account risk, so only maintainers test them by hand; CI and acceptance use the local mock server.
