---
sidebar_position: 1
title: Plugin Basics
description: Write a native Go plugin that answers commands and events with sdk.Base.
---

A plugin is an ordinary Go `main` package: define a root type that embeds `sdk.Base`, chain-register handlers in its registration methods, then call `sdk.Run`.

## Minimal plugin: answer a command

```go title="main.go"
package main

import (
	"log/slog"
	"os"

	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)

// Ping is the root plugin; embedding sdk.Base gives default hooks.
type Ping struct{ sdk.Base }

// Commands registers /ping; Core sends the returned Chain as the reply.
func (*Ping) Commands(r *sdk.CommandRegistry) {
	r.Command("ping").Handle(func(*sdk.Context) (message.Chain, error) {
		return message.Chain{message.Text("pong")}, nil
	})
}

func main() {
	if err := sdk.Run(&Ping{}); err != nil {
		slog.Error("plugin stopped with an error", "err", err)
		os.Exit(1)
	}
}
```

Build it and run it with the development entry:

```sh
go build -o bin/ping .
bin/alonabot run --data-dir ./data --plugin-id ping --entry bin/ping
```

## Two kinds of handlers

- **Auto-reply**: returns `(message.Chain, error)`. Core sends a non-empty Chain once after the handler returns, after all explicit sends in that call.
- **Manual**: returns only `error` and calls `c.Send` itself.

Both may call `c.Send`.

## Command groups and arguments

```go
func (p *Demo) Commands(r *sdk.CommandRegistry) {
	g := r.Group("demo")
	g.Command("hello").Handle(p.Hello) // /demo hello
	g.Command("echo").Handle(p.Echo)   // /demo echo <text> <times>
}

// Echo binds arguments by position from the command text: /demo echo hi 3
func (p *Demo) Echo(c *sdk.Context, text string, times int64) error {
	for i := int64(0); i < times; i++ {
		if _, err := c.Send(message.Chain{message.Text(text)}); err != nil {
			return err
		}
	}
	return nil
}
```

Handler parameters can also be `sdk.UserID`, `*pb.ImageSegment` and `*pb.MessageChain`. Dispatch prefers the longest full path or alias.

## Handling events

To handle events without a command, register them in `Events`:

```go
func (*Echo) Events(r *sdk.EventRegistry) {
	r.On("echo", "message.created").Handle(func(c *sdk.Context) error {
		var chain message.Chain
		for _, s := range c.Event().GetEventPayload().GetMessageCreated().GetChain().GetSegments() {
			if t := s.GetText(); t != nil {
				chain = append(chain, message.Text(t.GetText()))
			}
		}
		if len(chain) == 0 {
			return nil
		}
		_, err := c.Send(chain)
		return err
	})
}
```

## Registration rules

- Commands, text matches, events, Services and Event Bus subscriptions are **chain-registered only in the root plugin's registration methods** and end with `Handle`. A missing `Handle`, a repeated call or a call after it makes `Collect` fail.
- Permissions are `sdk.Permission` values: `sdk.Anyone`, `sdk.User`, `sdk.Admin`, `sdk.ChatAdmin`, `sdk.PermissionName`, combined with `Or`, e.g. `Permission(sdk.Admin.Or(sdk.ChatAdmin))`. Commands and text matches use the nearest explicit setting and require `user` if none is set. Use `c.Has` inside a handler to check the current Actor.
- The plugin ID comes only from `plugin.yaml`.

## Generating registration code

For real builds, registration code is generated at build time; nothing scans the disk at runtime. In the plugin's entry directory:

```sh
alonabot plugin generate --dir ./myplugin   # leaves the file untouched if nothing changed
alonabot plugin check --dir ./myplugin      # exits 1 if the generated file is stale
```

Both filter sources by `--goos`, `--goarch` and `--tags`, defaulting to the current environment. Source problems print as `file:line:col: message`.

## Full examples

`examples/plugins/` in the repository has three:

- [lifecycle](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/lifecycle/main.go): the smallest runnable plugin; logs each hook.
- [echo](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/main.go): manual event replies in a real session.
- [showcase](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/showcase/main.go): every public SDK signature together, including config callbacks, HTTP and schedules. The SDK does not support schedules yet, so running it returns UNSUPPORTED.
