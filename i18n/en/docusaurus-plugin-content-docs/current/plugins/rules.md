---
sidebar_position: 3
title: Plugin Guidelines
description: Rules plugins must follow for dependencies, storage, logging, lifecycle and collaboration.
---

A summary of the [plugin guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md). Official plugins, adapters, Agents and examples follow the same rules; [CONTRACTS](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md) wins on conflict.

## Memory and dependencies

- A disabled plugin runs no process; dependency initialization and resident objects in an enabled plugin use memory on the user's machine.
- Import only what you use. Prefer the standard library; use `net/http` for HTTP.
- Don't embed model vendor SDKs. For model calls, use the Agent's `llm.generate` (`sdk/llm` has the types and helpers).
- Keep package variables and `init` cheap; defer work to `OnStart` or first use.
- Prefer pure Go. If you need CGO, ship a real runnable binary for every platform you declare.

## Storage

- Business data goes in managed SQLite: `sqlitedb.Open(ctx)` returns `*sql.DB`, `gormdb.Open(ctx)` returns `*gorm.DB`, sharing one connection. Default to `sqlitedb`; it uses the standard database/sql API and keeps GORM optional.
- Reloading configuration or updating an installed component uses a separate managed SQLite candidate copy, so failed preparation restores the old data. Development `run` reuses `dev.sqlite` directly; plugins arrange recovery for their own files and external databases. See [Data Storage](storage.md).
- In-memory caches must be bounded; put indexes, caches and vectors in managed SQLite or files in `sdk.PluginDataDir(ctx)`.

## Logging and text

- Log with the standard `log/slog`; the SDK forwards records to Core. **Never write to stdout**: with stdio transport it is the protocol channel.
- Logs, error strings and `safe_message` are English; user-facing text goes in `i18n/`, with at least en-US.
- Never log secrets, tokens, full configs or DSNs.

## Lifecycle and calls

- Open resources in `OnStart` and close them in `OnStop`; background goroutines end with `OnStop` and respect ctx cancellation.
- Normal requests default to a 30-second deadline, controlled by Core's `REQUEST_TIMEOUT` tuning parameter.
- Calls with side effects are never retried automatically.

## Collaborating with other plugins

- Use Service calls and the Event Bus; never read or write another plugin's files or database.
- The Event Bus is a **non-persistent** broadcast: success from `bus.Event.Publish` only means Core accepted it, not that anyone received it. Use a Service call when you need acknowledgement or reliable delivery.
- Subscription callbacks run serially; don't block in them. They have no Actor or default Target, so set the target explicitly when sending.

## Publishing

Marketplace IDs use the role prefix `alonabot-plugin-`, `alonabot-adapter-`, `alonabot-agent-` or `alonabot-webui-`. Packages and the external `release.json` are signed with Ed25519; keep the private key out of the repository and build logs. Use `alonabot check/build/pack` to validate, build and package. Core CLI manages installation and source updates; see the [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md).
