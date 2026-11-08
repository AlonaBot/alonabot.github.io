---
sidebar_position: 2
title: Telegram
description: Scope and status of the official Telegram adapter.
---

The official Telegram adapter lives in `adapters/telegram/`; its program entry is [alonabot-adapter-telegram](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/cmd/alonabot-adapter-telegram/main.go).

## Implemented

- Account check and long-polling, per-update cursor and normalization.
- Mapping for six kinds of inbound media. When Core reads media, the adapter calls `getFile` on demand and downloads in Range chunks, up to 20 MiB, with sanitized errors.
- A local Bot API mock server, [telegramtest](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/telegramtest/server.go).

Receiving real private messages has been verified on darwin/arm64. Full Core assembly and other real-platform scenarios are verified in later slices.

## Not yet

Sending, outbound media, buttons, command policy and Rules. Webhook receiving is out of scope for v0.1.
