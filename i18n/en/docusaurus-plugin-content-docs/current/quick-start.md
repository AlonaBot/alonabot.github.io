---
title: Quick start
description: Install the CLI, create a plugin, and chat with it in the terminal.
---

Create a plugin that responds to `/hello` with 0.4.0, then try it in the terminal without registering a platform account.

## 1. Install

Install [Go](https://go.dev/dl/) 1.27.1 or later, then install the `alonabot` command:

```sh
go install github.com/AlonaBot/AlonaBot/cmd/alonabot@v0.4.0
```

Check the installation:

```sh
alonabot --help
```

If the command is not found, add the `bin` subdirectory of `go env GOPATH` to `PATH`.

For platform connections and the management interface, see [Installation](usage/install.md).

## 2. Create a plugin

```sh
alonabot init alonabot-plugin-hello
cd alonabot-plugin-hello
```

The directory name becomes the plugin ID. The generated project already includes a `/hello` command:

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	p.Command("hello").Description("Show a greeting").Menu().Handle(func(c *sdk.Context) error {
		return c.Reply("Hello AlonaBot")
	})
	return p
}
```

## 3. Run with hot reload

```sh
alonabot run --reload
```

Use `--reload` during development: saving code automatically recompiles and restarts the plugin.

When Core shows the `> ` prompt, enter a message:

```text
> /hello
Hello AlonaBot
```

The reply comes from your plugin. Keep the process running while you edit; press Ctrl-C when finished.

## 4. Make a change

Keep `alonabot run --reload` running and change the Handler in `plugin.go` to:

```go
	p.Command("hello").Description("Show a greeting").Handle(func(c *sdk.Context) error {
		return c.Reply("Hello from my first plugin!")
	})
```

Saving recompiles and restarts the plugin automatically. Try the command again:

```text
> /hello
Hello from my first plugin!
```

If compilation fails, the terminal displays the compiler error and the previous plugin keeps running. Fixing the code loads the new version automatically.

## Next steps

- The [tutorial](tutorial/project.md) builds a todo plugin from this project, covering arguments, replies, configuration, storage, conversations, and tests.
- To try a real platform, see [Platform development](platforms/development.md).
