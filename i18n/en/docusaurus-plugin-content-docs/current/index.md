---
slug: /
title: Overview
description: Build a Go bot, connect platforms, and choose where to start.
---

AlonaBot is a framework for writing chat bots in Go. Register commands and message handlers in a plugin, then use adapters to connect the same code to Telegram, QQ through OneBot11, or another platform.

```go
p.Command("ping").Handle(func(c *sdk.Context) error {
    return c.Reply("pong")
})
```

```text
> /ping
pong
```

## Components

| Component | Purpose |
| --- | --- |
| Core | The `alonabot` program: routes events, checks permissions, sends replies and manages components |
| Plugin | Your commands, scheduled tasks and pages; normally runs as a separate process |
| Adapter | Connects platform accounts and converts platform messages to the shared model |
| Agent | Optional AI conversations and model services for plugins |
| WebUI | Browser management interface |

Components can be installed and updated independently.

## Where to start

- Write a plugin: follow the [quick start](quick-start.md), then the [to-do tutorial](tutorial/project.md).
- Run a bot: [install Core](usage/install.md) and connect [Telegram](usage/telegram.md) or [OneBot11](usage/onebot11.md).
- Add a platform: [write an adapter](develop/adapter.md).
- Look up a term in the [glossary](reference/glossary.md).

:::note Version
These docs cover **0.2.0**, released on November 22, 2026. See [implementation status](internals/status.md) for available features and known issues.
:::
