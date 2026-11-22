---
title: Project structure
description: Create the to-do plugin and learn its entry point.
---

Build a to-do list: `/todo add buy milk` adds an item and `/todo list` lists it. Start with the project files.

## Create the project

```fish
alonabot init alonabot-plugin-todo
cd alonabot-plugin-todo
```

| Path | Purpose |
| --- | --- |
| `plugin.go` | Plugin code |
| `plugin.yaml` | ID, name, version, role and source |
| `config_schema.json` | Configuration declarations |
| `i18n/`, added as needed | Localized user messages |
| `go.mod` | Module dependencies; an existing parent module is reused |
| `.gitignore` | Excludes `data/` and `bin/` |

Runtime data goes in `data/`; build output goes in `bin/`.

## plugin.yaml

```yaml title="plugin.yaml"
id: alonabot-plugin-todo
name: alonabot-plugin-todo
version: 0.1.0
source: github.com/CHANGE-ME/CHANGE-ME
role: plugin
```

`id` defaults to the directory name. Public plugins use the `alonabot-plugin-` prefix. `name` is the display name, `version` belongs to your component, `source` must be changed to your repository before release, and `role` is `plugin`.

## New

Replace `plugin.go` with:

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	p.Command("todo").Description("Show how to use the to-do list").Handle(func(c *sdk.Context) error {
		return c.Reply("Try /todo add <text> or /todo list")
	})
	return p
}
```

Export `New() *sdk.Plugin`, register behavior, and return a fresh object on every call. The CLI supplies the executable entry point through an overlay. Keep registrations inside construction; avoid shared mutable package state.

## Run

```fish
alonabot run
```

```text
> /todo
Try /todo add <text> or /todo list
```

With a component project as the working directory, `run` loads it and enables terminal chat. Source changes automatically reload it.

| Command | Purpose |
| --- | --- |
| `alonabot run` | Run with terminal chat |
| `alonabot check` | Read-only resource and handler checks |
| `alonabot build` | Build to `bin/` |
| `go test ./...` | Run [plugin tests](testing.md) |

See the [CLI reference](../reference/cli.md). Next: [commands and arguments](commands.md).
