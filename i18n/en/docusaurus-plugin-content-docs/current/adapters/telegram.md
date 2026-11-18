---
sidebar_position: 2
title: Telegram
description: Instance configuration, current capabilities and upcoming work for the official Telegram adapter.
---

The official adapter lives in [`adapters/telegram/`](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/telegram), with the [alonabot-adapter-telegram](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/cmd/alonabot-adapter-telegram/main.go) entry. This page follows main as of 2026-11-18.

## Configure an instance

Fields come from [`adapter_config_schema.json`](https://github.com/AlonaBot/AlonaBot/blob/main/adapters/telegram/adapter_config_schema.json):

- `token`: required secret containing the Bot Token; keep it out of repositories and logs.
- `api_base_url`: defaults to `https://api.telegram.org`; replace it for a local Bot API or mock server.
- `proxy_mode`: defaults to `none` (direct); `core` uses Core’s proxy; `custom` uses the instance’s proxy.
- `proxy`: secret, used and required in `custom` mode; supports http / https / socks5 URLs.

Receiving currently uses **long polling**. An existing webhook causes instance startup to fail; resolve that conflict on the platform first. Core manages instances in `core_config.json`; file structure and runtime commands are in the repository [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md).

## Implemented

- `getMe` account checks, long polling, per-update cursors/normalization and `to_me` for private chats, replies and mentions.
- Inbound media mapping and on-demand `getFile` fetch with Range chunks, currently up to 20 MiB, with sanitized errors.
- Complete Chain preflight and sequential send plans, text entities, media/albums, first-message references, last-message buttons and per-part receipts. Combinations the platform cannot express, such as buttons on a final album, return `UNSUPPORTED`.
- `callback_query` / `answerCallbackQuery`, followed by Core-validated button-click dispatch.
- `editMessageText` text editing with stable message handles, usable by `c.Stream` for incremental text.
- `telegram.chat_owner` / `telegram.chat_admin`, chat administrator lookup, instance proxy modes and topic detection.
- Local Bot API server [telegramtest](https://github.com/AlonaBot/AlonaBot/tree/main/adapters/telegram/telegramtest).

Plugin entry points: [Messages and Media](../plugins/messages.md), [Button Interactions](../plugins/background.md), [Permissions and Events](../plugins/commands.md).

## Upcoming work

More media and segments (voice, animations, stickers, video notes, URL buttons), platform actions/deletion, command menus, chat titles and service messages are upcoming slices in the [Telegram plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/telegram.md).

## Verification environment

Real private-message receiving has a **darwin/arm64** record. Sending, editing, callbacks and fault matrices mainly use the local Bot API server; see [TEST-MATRIX §3](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md) for environments and results.
