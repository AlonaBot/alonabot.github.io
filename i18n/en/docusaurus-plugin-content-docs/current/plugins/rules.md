---
sidebar_position: 3
title: Plugin Guidelines
description: Rules plugins must follow for dependencies, storage, logging, lifecycle and collaboration.
---

A summary of the [plugin guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md). Official plugins, adapters, Agents and examples follow the same rules; [CONTRACTS](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md) wins on conflict.

## Memory and dependencies

- A disabled plugin runs no process; an enabled one's memory counts against the user's machine. Every linked library and init adds to it.
- Import only what you use. Prefer the standard library; use `net/http` for HTTP.
- Don't embed model vendor SDKs. For model calls, use the Agent's `llm.generate` (`sdk/llm` has the types and helpers).
- Keep package variables and `init` cheap; defer work to `OnStart` or first use.
- Prefer pure Go. If you need CGO, ship a real runnable binary for every platform you declare.

## Storage

- Business data goes in managed SQLite: `sqlitedb.Open(ctx)` returns `*sql.DB`, `gormdb.Open(ctx)` returns `*gorm.DB`, sharing one connection. Default to `sqlitedb`; it uses about 1.5 MiB less than GORM.
- Managed SQLite uses a separate candidate copy on reload and update, so a failed prepare keeps the old data. Files and external databases outside the framework get no such guarantee.
- In-memory caches must be bounded; put indexes, caches and vectors in managed SQLite or files in the plugin data directory.

## Logging and text

- Log with the standard `log/slog`; the SDK forwards records to Core. **Never write to stdout**: with stdio transport it is the protocol channel.
- Logs, error strings and `safe_message` are English; user-facing text goes in `i18n/`, with at least en-US.
- Never log secrets, tokens, full configs or DSNs.

## Lifecycle and calls

- Open resources in `OnStart` and close them in `OnStop`; background goroutines end with `OnStop` and respect ctx cancellation.
- Normal requests have a 30-second deadline.
- Calls with side effects are never retried automatically.

## Collaborating with other plugins

- Use Service calls and the Event Bus; never read or write another plugin's files or database.
- The Event Bus is a **non-persistent** broadcast: success from `sdk.Publish` only means Core accepted it, not that anyone received it. Use a Service call when you need acknowledgement or reliable delivery.
- Subscription callbacks run serially; don't block in them. They have no Actor or default Target, so set the target explicitly when sending.

## Publishing

Marketplace IDs use the role prefix `alonabot_plugin_`, `alonabot_adapter_`, `alonabot_agent_` or `alonabot_webui_`. Packages and the external `release.json` are signed with Ed25519; keep the private key out of the repository and build logs. Pack and install commands are still being implemented.
