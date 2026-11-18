---
sidebar_position: 1
title: Adapter Overview
description: Connect platforms through adapters and reuse plugin logic based on instance capabilities.
---

An adapter connects a chat platform to Core, using `sdk/adapter` and `sdk.RunAdapter`. It owns platform APIs, receiving and normalization, send plans, media fetch and platform permissions.

Core handles command routing, permission policies, cursor persistence and button tokens. Plugins use one [command](../plugins/commands.md) and [message SDK](../plugins/messages.md), then choose features such as buttons, editing and media based on instance capability declarations.

## Official adapters

- **[Telegram](telegram.md)**: receiving, inbound media, sending/receipts, buttons/callbacks, text editing, platform permissions and proxy modes are implemented.
- **[OneBot 11](onebot11.md)**: forward WebSocket, receiving/normalization and platform permissions are implemented; sending and media are upcoming.

For local development, observe replies with the [loopback adapter](../guide/quick-start.md), then check business logic with [plugintest](../plugins/testing.md). Check adapter progress and instance configuration before connecting a real platform.

## Install and replace

Adapters for different platforms can coexist, such as Telegram and OneBot 11. One adapter implementation owns each `adapter_id` and may have multiple instances. Agent and WebUI each have one implementation.

Add `--replace` when installing a replacement for an existing component of the same kind. Install, source update and recovery commands are in the repository [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md).

## Develop an adapter

- Keep the implementation in an importable package, such as `telegram.New()`, with an entry calling `sdk.RunAdapter`. Instance configuration goes in `adapter_config_schema.json` in that package.
- Platform permissions and extension events live in constant packages `adapters/<id>/perm` and `adapters/<id>/event`, available for separate plugin imports.
- Descriptor / instance reports declare capabilities. Declare implemented features only; platform actions also need a name, version and input/result schemas.
- Use local mock servers to verify faults and receipts. Record real-platform environments and results separately in [TEST-MATRIX](https://github.com/AlonaBot/AlonaBot/blob/main/spec/TEST-MATRIX.md).

Sources: [Adapter SDK](https://github.com/AlonaBot/AlonaBot/tree/main/sdk/adapter), [adapter implementation plan](https://github.com/AlonaBot/AlonaBot/blob/main/spec/plan/adapters/README.md).
