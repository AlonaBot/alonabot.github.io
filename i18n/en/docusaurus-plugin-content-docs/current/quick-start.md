---
title: Quick start
description: Install the CLI and talk to your first plugin in a terminal.
---

Create a plugin with AlonaBot 0.2.0 and send it `/hello` in your terminal. A platform account is optional for this first step.

## 1. Install

Install [Go](https://go.dev/dl/) 1.27.1 or later, then install the CLI:

```fish
go install github.com/AlonaBot/AlonaBot/cmd/alonabot@v0.2.0
```

```fish
alonabot --help
```

If the command is missing, add the `bin` directory under `go env GOPATH` to PATH. For deployment, download the [official archive](usage/install.md#manual). The CLI built by `go install` also supports official adapter installation.

## 2. Create a plugin

```fish
alonabot init alonabot-plugin-hello
cd alonabot-plugin-hello
```

The directory name becomes the component ID. The generated `plugin.go` contains:

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	p.Command("hello").Menu().Description("Say hello").Handle(func(c *sdk.Context) error {
		return c.Reply("Hello AlonaBot")
	})
	return p
}
```

The template replies directly; add `i18n/` when you need localized messages.

## 3. Run

```fish
alonabot run
```

At the terminal prompt, enter:

```text
> /hello
Hello AlonaBot
```

Press Ctrl-C to stop Core.

## 4. Change the reply

Keep Core running and change the handler in `plugin.go`:

```go
	p.Command("hello").Menu().Description("Say hello").Handle(func(c *sdk.Context) error {
		return c.Reply("Hello from my first plugin!")
	})
```

Save and send the command again:

```text
> /hello
Hello from my first plugin!
```

Development mode rebuilds and restarts the changed component. A compiler error is shown in full while the previous executable keeps running; fixing the error allows replacement.

Continue with the [to-do tutorial](tutorial/project.md), or [connect Telegram](tutorial/telegram.md).
