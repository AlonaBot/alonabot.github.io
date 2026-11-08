---
sidebar_position: 2
title: Implementation Status
description: What AlonaBot 0.1-beta implements so far.
---

Based on the main repository's `main` branch as of 2026-11-08. The authoritative record is the repository [README](https://github.com/AlonaBot/AlonaBot/blob/main/README.md), the Status column in [ARCHITECTURE.md](https://github.com/AlonaBot/AlonaBot/blob/main/ARCHITECTURE.md), and [TEST-MATRIX §3.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md).

## Implemented

- **Protocol and tooling**: protocol contracts, Protobuf generation, manifest and release validation.
- **Core basics**: state store and core.lock, native plugin processes, TCP and stdio IPC, handshake, activation and stop lifecycle, bounded restarts.
- **Routing**: longest-path and alias command matching, text matching and Raw, argument binding, usage and silent mode, auto-reply, explicit event registration.
- **Sending**: manual replies to the original target, other targets and background `sdk.Send` gated by per-instance permissions, chunked media upload `sdk.Upload`, on-demand inbound media read and grant (`sdk.ReadMedia`, `sdk.GrantMedia`).
- **Collaboration**: cross-plugin Service calls admitted by the Core broker, non-persistent Event Bus (`sdk.Publish`, `sdk.Subscribe`).
- **HTTP**: plugin HTTP routes proxied through Core's public entry. Private routes are not authorized yet and always return 401.
- **Settings and codegen**: the `alonabot.yaml` settings file, and `alonabot plugin generate` / `plugin check` for build-time registration code.
- **Telegram**: receiving, normalization and inbound media fetch.

## Not yet

- Telegram sending, outbound media, buttons, command policy and Rules.
- Scheduling, admin CLI, component install and update, the library entry `alonabot.Run`, the `plugintest` suite.
- The official OneBot 11 adapter, bundled plugins, most of the official Agent, and the WebUI's real Admin API and pages.

The only entry points today are the development commands `alonabot run` and `alonabot plugin generate` / `plugin check`.

## Platform verification

Runtime verification has only been done on darwin/arm64. linux/amd64, linux/arm64, windows/amd64 and darwin/amd64 are cross-compiled with `CGO_ENABLED=0` only.
