---
title: Architecture
description: How Core and components work together and store data.
---

This chapter explains component relationships and the data used for troubleshooting.

import ArchitectureDiagram from "@site/static/img/diagrams/en/architecture.svg";
import MessageJourney from "@site/src/components/MessageJourney";

## One Core, multiple components

<div className="doc-diagram-scroll"><ArchitectureDiagram className="doc-diagram" /></div>

- **Core routes messages.** All messages pass through it.
- **Native components run in separate processes by default**, started by Core. Calls between components pass through Core. See below for in-process operation.
- **WebUI supplies management pages and an optional backend process.** Core serves the interface, which uses Core's management API.

## Separate plugin processes

- **Fault isolation.** A crashed plugin leaves Core and other plugins running. Core restarts it automatically.
- **Dependency isolation.** Plugins can use different versions of the same library.
- **Independent updates.** Updating one plugin leaves the others running.
- **Per-process diagnostics.** Inspect memory usage and errors for each plugin.

## Message flow

A user sends `/todo add buy milk` on Telegram:

<MessageJourney />

Select a step to jump to it, or drag the progress bar. Each step names the main-repository package that owns it.

## Data storage

The data directory, `data/` by default, contains:

| Path | Content | Managed by |
| --- | --- | --- |
| `core_config.json` | Core settings | Owner and Core |
| `state.sqlite` | Installed components, versions, permissions | Core |
| `core.lock` | Ensures a single Core uses the directory | Core |
| `plugins/<ID>/` | Plugin configuration and managed databases | Plugin, with framework database management |
| `plugin_data/<ID>/` | Plugin-managed files | Plugin |
| `logs/` | Log files | Core |

The framework creates and backs up plugin databases. Only the owning plugin reads and writes their contents.

## Trust and isolation

- **Plugins are trusted code.** They run as the same system user as Core and have that user's permissions. Process isolation reduces the impact of failures. Install trusted plugins.
- **Plugin pages are untrusted.** Browser sandboxing isolates them from management credentials.
- **Platform users are untrusted.** Core determines administrator access using platform-verified identities.

## In-process operation

Core and components can also run within one Go program. [`plugintest`](../tutorial/testing.md) uses this mode for fast startup. The terminal Adapter is embedded in `alonabot` the same way.

Embed the bot in your own `main.go`:

```go
import (
	"github.com/AlonaBot/AlonaBot"
	todo "example.com/alonabot-plugin-todo"
)

func main() {
	if err := alonabot.Run(
		alonabot.DataDir("./data"),
		alonabot.Plugin(todo.New()),
	); err != nil {
		log.Fatal(err)
	}
}
```

Build with `alonabot build`. A direct `go build` omits configuration declarations and language files, resulting in a startup error.

In this mode, a plugin crash exits the entire program and automatic reload is unavailable. Use it for testing, debugging, and embedding.
