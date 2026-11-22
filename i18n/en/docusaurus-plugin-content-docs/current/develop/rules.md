---
title: Plugin guidelines
description: Requirements for a plugin that is ready to publish.
---

Use these guidelines before publishing so owners can run your plugin with predictable memory use, durable data and useful errors. Official components follow the same rules.

## Keep memory use small

Each enabled native plugin normally runs as a process. Owners may run dozens on a small machine.

- Import only the packages you use. Prefer the standard library, including `net/http`.
- Call models through [`sdk/llm`](../advanced/llm.md) and Agent rather than embedding provider SDKs.
- Open connections and load resources in `OnStart` or on first use, keeping package initialization small.
- Bound caches according to the actual workload. Store large data in a database or files.
- Prefer `sdk/sqlitedb` for SQL-only workloads; it avoids linking and initializing GORM. Measure memory in the actual build and environment.

## Protect data

Store business data in the [managed database](../tutorial/storage.md) so failed updates can recover. Append migrations and preserve published ones. Access another plugin's data through its [services](../advanced/services.md).

For an external database such as MySQL, mark connection credentials as secret settings and declare `prepare_effects: external` in `plugin.yaml`. Owners then receive the external-migration confirmation before operations that prepare data.

## Logs and user text

Use `log/slog` or `c.Logger()`. Write logs and errors in English. Reserve stdout for the component protocol; `fmt.Println` or `print` can corrupt it. Keep tokens, complete configuration and credential-bearing URLs out of logs.

Put user-facing text in `i18n/`, supplying at least `en-US.json`. See [Localization](../advanced/i18n.md).

## Resource lifetime

Open resources in `OnStart`, close them in `OnStop`, and stop background goroutines before shutdown completes. Each `New` call returns independent state.

## Calls and broadcasts

Ordinary Handlers have a 30-second deadline. Use [`.Continue()`](../tutorial/conversation.md) or [scheduled tasks](../advanced/schedule.md) for longer work. Handle unavailable services and model providers. A timed-out side effect may already have completed; avoid automatic retries.

Broadcasts may be lost. Use a service when acknowledgement matters, and keep subscription Handlers short.

## Build targets and names

Prefer pure Go for cross-platform packaging. A CGO component needs working binaries for every declared target.

| Role | Public ID prefix |
| --- | --- |
| Plugin | `alonabot-plugin-` |
| Adapter | `alonabot-adapter-` |
| Agent | `alonabot-agent-` |
| WebUI | `alonabot-webui-` |

## Before publishing

```fish
alonabot check
go test ./...
alonabot test
```

Then [package the release](../advanced/publish.md). Keep source identity, component identity, version and target consistent in every v0.2.0 platform archive.
