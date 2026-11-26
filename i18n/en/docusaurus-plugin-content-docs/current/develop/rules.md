---
title: Plugin conventions
description: Requirements to check before publishing a plugin.
---

Review resource usage, storage, logging, and lifecycle before publishing. Official plugins follow the same conventions.

## Memory usage

Each enabled plugin is a running program. Owners may install dozens on a small server.

- **Import only necessary packages.** Prefer the standard library, including `net/http`.
- **Use shared model access.** Call through Agent with [`sdk/llm`](../advanced/llm.md) instead of embedding vendor SDKs.
- **Defer expensive initialization.** Load large files and establish connections in `OnStart` or on first use, rather than package variables or `init`.
- **Bound in-memory caches.** Store large datasets in a database or files.
- **Prefer `sdk/sqlitedb`.** It uses about 1.5 MiB less memory than `sdk/gormdb`.
- **Import SDK packages by feature.** The root `sdk` package provides the plugin object, Handler context and registration methods; scheduled tasks, services, broadcasts, buttons, media, conversations, AI tools, platform actions, dynamic options and command menus live in `sdk/task`, `sdk/service`, `sdk/bus`, `sdk/button`, `sdk/media`, `sdk/conversation`, `sdk/tool`, `sdk/action`, `sdk/options` and `sdk/command`. Packages you do not import are not linked.

## Hibernation

When the bot owner enables idle hibernation, plugins that stay unused for a while exit; the framework starts them again for a command, event, service call, HTTP request or due scheduled task. Plugins may hibernate by default (`sleep_capable` in `plugin.yaml` defaults to `true`).

- If the plugin relies on in-memory state or runs background work outside Handlers (its own goroutines, long-lived connections), set `sleep_capable: false` in `plugin.yaml` to keep it running.
- A plugin that may hibernate must resume after a restart: keep state that matters in the database or key-value storage.
- Due scheduled tasks wake the plugin, so scheduled work does not require staying resident.

## Data

- Store business data in the [managed database](../tutorial/storage.md) for failed-update recovery.
- Keep published migrations unchanged; append migrations for schema changes.
- Access another plugin's data through its [service](../advanced/services.md).
- Declare external database credentials as secrets. Add `prepare_effects: external` to `plugin.yaml` to inform owners that external data needs its own recovery strategy.

## Logging

- Use `log/slog` or `c.Logger()`.
- **Reserve standard output for framework communication.** `fmt.Println` and `print` corrupt it.
- Write logs in English.
- Exclude secrets, tokens, full configuration, and connection URLs containing passwords.
- When the plugin's own data is corrupt and it cannot continue, log CRITICAL with `slog.Log(ctx, sdk.LevelCritical, "component data is corrupt", "error", err)` so the owner acts immediately.

## Text

- Store user-facing text in `i18n/`, including a complete `en-US.json`; see [Internationalization](../advanced/i18n.md).
- Write returned `error` messages in English.

## Startup and shutdown

- Open resources in `OnStart` and close them in `OnStop`.
- Stop background goroutines in `OnStop`.
- Return a fresh object from `New` without package-level shared state.

## Calls

- Regular Handlers must return within 30 seconds. For longer work, use [continuations](../tutorial/conversation.md) or [scheduled tasks](../advanced/schedule.md).
- **Avoid automatic retries of side effects.** A timed-out operation may have completed; retrying may duplicate messages or charges.
- Handle unavailable services and models.

## Broadcasts

- Broadcasts can be lost. Use a service when delivery confirmation matters.
- Keep subscription Handlers fast.

## Pure Go

Prefer pure Go for cross-platform packaging. When CGO is required, provide working packages for every declared platform.

## Naming

Public component IDs use a role prefix:

| Role | Prefix |
| --- | --- |
| Plugin | `alonabot-plugin-` |
| Adapter | `alonabot-adapter-` |
| Agent | `alonabot-agent-` |
| WebUI | `alonabot-webui-` |

After the prefix, use lowercase letters and digits with single hyphens between words, no underscores, and at most 64 characters in total, such as `alonabot-plugin-todo-list`. Components used only on your own machine may skip the prefix (the ID only needs to match `^[a-z][a-z0-9_-]{0,63}$`); `alonabot init` warns about it.

## Before publishing

```sh
alonabot check
go test ./...
alonabot test
```

Pass all three checks, then [package and publish](../advanced/publish.md) the platform archives.
