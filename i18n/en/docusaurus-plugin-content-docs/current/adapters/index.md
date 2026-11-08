---
sidebar_position: 1
title: Overview
description: What an adapter does in AlonaBot and where the official adapters stand.
---

An adapter connects one chat platform to Core. It is a non-plugin component with its own process, run with `sdk/adapter` and `sdk.RunAdapter`. It owns the platform API client, receiving and normalization, send plans, media fetch, platform permissions and a local mock server.

Command routing, Core policy, cursor persistence and button tokens **do not** belong to adapters; Core owns them. That is why a plugin behaves the same on every platform.

## Official adapters

| Adapter | Program | Status |
| --- | --- | --- |
| [Telegram](telegram.md) | `adapters/telegram/` | Partial: receiving, normalization, inbound media |
| [OneBot 11](onebot11.md) | `adapters/onebot11/` | Not started |

## Replacing an official adapter

Only one adapter, Agent or WebUI of each kind can be installed. Replacing an official one with a community component needs `--replace` at install time. Install commands are still being implemented.

## Conventions

- The implementation lives in an importable package (e.g. `telegram.New()`); the program entry only calls `sdk.RunAdapter`. The instance config schema is `instance_schema.json` in the package.
- Platform permissions and extension events live in constant packages `adapters/<id>/perm` and `adapters/<id>/event`, so plugins can import them without linking the adapter runtime.
- Every platform has a local mock server with controllable faults. Mock results never replace verification on the real platform.
