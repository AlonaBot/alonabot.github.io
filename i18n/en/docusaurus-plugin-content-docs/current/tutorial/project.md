---
title: Project structure
description: Understand plugin files and the New function.
---

This tutorial builds a todo plugin: `/todo add buy milk` adds an item, and `/todo list` lists items. Start by creating the project and exploring its files.

## Create a project

### Start from the plugin template

[alonabot-plugin-template](https://github.com/AlonaBot/alonabot-plugin-template) includes the hello example, plugintest integration tests, and five-platform packaging with a GitHub Release workflow. Its hello example matches `alonabot init`.

1. Select [Use this template](https://github.com/new?template_owner=AlonaBot&template_name=alonabot-plugin-template), then clone your new repository.
2. Set the module in `go.mod` to your repository path, update the plugin identity and `source` in `plugin.yaml`, and replace the `owner` placeholder in `.github/`.
3. Follow the [template README](https://github.com/AlonaBot/alonabot-plugin-template/blob/main/README.md) to set up the SDK and CLI, then continue with this page's New function and run steps. When replacing hello with the todo command, update the command and expected reply in `plugin_test.go` as well.

### Create with the CLI

For a basic project, run:

```sh
alonabot init alonabot-plugin-todo
cd alonabot-plugin-todo
```

The `alonabot-plugin-todo/` project contains:

| Path | Purpose |
| --- | --- |
| `plugin.go` | Plugin code |
| `plugin.yaml` | Plugin metadata, including name and version |
| `plugin_config_schema.json` | Configuration field declarations |
| `i18n/` (optional) | Localized user-facing text |
| `go.mod` | Go module and dependencies |
| `.gitignore` | Excludes `data/` and `bin/` |

Runtime data goes in `data/`; build output goes in `bin/`. Leave both out of version control.

## plugin.yaml

```yaml title="plugin.yaml"
id: alonabot-plugin-todo
name: alonabot-plugin-todo
version: 0.1.0
source: github.com/CHANGE-ME/CHANGE-ME
role: plugin
```

| Field | Meaning |
| --- | --- |
| `id` | Unique plugin identifier; defaults to the directory name. Public plugins use the `alonabot-plugin-` prefix |
| `name` | Display name in the management interface; you can change it to `Todo` |
| `version` | Version number |
| `source` | Source repository; set this to your own before publishing |
| `role` | Component role; `plugin` for plugins |

## The New function

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

A plugin exports one `New` function: create `p`, register commands on it, and return it. The CLI generates the executable entry point.

Registration rules:

- **Register everything in `New`.** Commands cannot be added after startup.
- **Return a fresh instance on every call.** Package-level state can leak between tests.

## Run

```sh
alonabot run
```

```text
> /todo
Try /todo add <text> or /todo list
```

Running `alonabot run` without arguments in the project directory compiles the current plugin and opens terminal chat. Code changes reload automatically. Use this terminal for the following chapters.

## Common commands

| Command | Purpose |
| --- | --- |
| `alonabot run` | Run and open terminal chat |
| `alonabot check` | Validate configuration, translations, and Handler declarations without running |
| `alonabot build` | Compile into `bin/` |
| `go test ./...` | Run tests; see [Testing](testing.md) |

See the [CLI reference](../reference/cli.md) for all options. Next: [Commands and arguments](commands.md).
