---
sidebar_position: 3
title: OneBot 11
description: Connection configuration, receiving capabilities and sending progress for the official OneBot 11 adapter.
---

The official adapter lives in [`adapters/onebot11/`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/onebot11). Main as of 2026-11-18 implements connection and receiving ([PR #109](https://github.com/AlonaBot/AlonaBot/pull/109)); sending and media belong to upcoming T-15.2.

## Configure an instance

Fields come from [`adapter_config_schema.json`](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/onebot11/adapter_config_schema.json):

- `ws_url`: required forward WebSocket URL for your OneBot implementation.
- `access_token`: secret, supplied when authentication is required; keep it out of repositories and logs.
- `mode`: defaults to `forward`, currently the only accepted schema value.

Each instance opens one forward WebSocket connection, then calls `get_login_info` to identify the account. Core instance configuration is described in the repository [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md).

## Implemented

- Forward WebSocket, handshake authentication, account lookup and bounded-backoff reconnects.
- `self_id` and array-format checks, per-instance event queues and sequential delivery.
- Normalization of private/group messages, recalls and member events, plus `to_me`.
- Group owner, group admin and friend-chat permissions, with constants in [`adapters/onebot11/perm`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/onebot11/perm).
- Local mock server [`onebottest`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/onebot11/onebottest).

## Upcoming work

Send plans/receipts, inbound/outbound media and `onebot11.face` belong to T-15.2. Reverse WebSocket, more segments, extension events, platform actions/deletion and chat titles also have upcoming slices. See the [OneBot 11 plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/onebot11.md).

For reply tests today, use the [loopback adapter](../guide/quick-start.md) or [plugintest](../plugins/testing.md). The homepage QQ conversation illustrates the shared SDK interaction; real OneBot 11 sending awaits T-15.2.

## Verification and account risk

Receiving and fault scenarios have been tested with local `onebottest`. Real QQ clients rely on unofficial protocol implementations with account risk and are tested manually by maintainers on authorized accounts. Upcoming T-15.3 gathers real-platform and cross-adapter evidence.
