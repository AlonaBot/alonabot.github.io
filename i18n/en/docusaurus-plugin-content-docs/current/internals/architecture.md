---
title: Architecture
description: How Core and components cooperate and where data lives.
---

Use this page to locate the component or storage involved when investigating a problem.

import ArchitectureDiagram from "@site/static/img/diagrams/architecture.en.svg";
import MessageFlow from "@site/static/img/diagrams/message-flow.en.svg";

## One Core, multiple components

<div className="doc-diagram-scroll"><ArchitectureDiagram className="doc-diagram" /></div>

Core routes all messages. Native components normally run as independent processes launched by Core; calls between them pass through Core. The official WebUI contains a Go backend and static frontend. Core hosts the management entry point; the backend adds store and page functionality. Third-party WebUI packages may supply static assets alone.

## Why separate processes

A crashed plugin can restart while Core and other plugins keep running. Each component can use its own dependency versions and update independently. Process-level resource use and errors are easy to locate.

Each process adds memory overhead, and inter-process calls cost more than direct function calls. Chat-platform network latency usually dominates that difference.

## A message's path

A Telegram user sends /todo add buy milk:

<div className="doc-diagram-scroll"><MessageFlow className="doc-diagram" /></div>

Core performs authorization using the identity recorded for the call. A plugin's claimed user identity alone grants no extra permissions.

## Data locations

Inside the data directory, normally data/:

| Path | Contents | Owner |
| --- | --- | --- |
| core_config.json | Core settings | Operator and Core |
| state.sqlite | Installations, versions and permissions | Core |
| core.lock | Exclusive data-directory lock | Core |
| plugins/&lt;ID&gt;/ | Development config and managed database; installed generations are tracked by Core | Core and plugin |
| plugin_data/&lt;ID&gt;/ | Plugin-managed files retained across restarts | Plugin |
| admin_token | Persistent local management and browser credential | Core |
| logs/ | Log files | Core |

Core creates and backs up managed plugin databases; each plugin owns its database contents.

## Trust and isolation

Install trusted components. They run as ordinary programs under Core's operating-system user and inherit that user's access. Process separation limits crash impact. Plugin pages use browser sandboxing and cannot read the management login. Platform-user permissions come from platform-authenticated identity.

## In-process mode

Core and components can share a Go process. [plugintest](../tutorial/testing.md) uses this mode, as does the built-in console Adapter. Embed a bot in another program with:

```go
import (
	"log"

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

Build this program with alonabot build so configuration declarations and localization resources are included. A plain go build omits those resources. In-process components share the host's failure and goroutine lifetime; an uncaught panic can terminate the process. Automatic development reloading is unavailable in this mode.
