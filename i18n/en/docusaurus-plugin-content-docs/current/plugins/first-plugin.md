---
sidebar_position: 1
title: Plugin Basics
description: Create a plugin that replies to /ping, then build and run it with the current SDK.
---

Send `/ping`, receive `pong`. Export `New() *sdk.Plugin`, create a plugin object and register the command.

## Create the project

Clone the main repository and build the CLI as shown in [Quick Start](../guide/quick-start.md). From the repository root, create a project that reuses its `go.mod`:

```fish
bin/alonabot init ./alonabot-plugin-ping
```

`init` requires an empty directory and creates `plugin.go`, `plugin.yaml`, `config_schema.json` and `i18n/`. The component ID comes from `plugin.yaml`: `alonabot-plugin-ping` here. Exporting `New()` lets the same package run in a separate process or in-process during `go test`.

Replace the generated `plugin.go` with:

```go title="alonabot-plugin-ping/plugin.go"
package plugin

import (
    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/AlonaBot/sdk/message"
)

func New() *sdk.Plugin {
    p := sdk.NewPlugin()
    p.Command("ping").Description("Check whether the bot is responding").
        Handle(func(*sdk.Context) (message.Content, error) {
            return message.Text("pong"), nil
        })
    return p
}
```

Each call to `New()` returns an independent object. Register routes and lifecycle callbacks here, and create business state here so tests do not share it.

## Check and build

```fish
bin/alonabot check ./alonabot-plugin-ping
bin/alonabot build ./alonabot-plugin-ping
```

`check` validates the project, configuration, translations and handler signatures. `build` runs the same checks and writes the component binary to the project's `bin/`. Keep the source as an importable package: the builder creates an entry calling `sdk.Run(New())` and embeds the manifest, schemas and translations through a Go overlay.

There are no generated files to maintain. Use `alonabot build` for components; `go build` still builds the Core CLI. For a project outside the repository, specify `--module example.com/ping`. A development CLI asks you to select an SDK version with `go get github.com/AlonaBot/AlonaBot@<version>`; see the [author tools](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#开发运行与热部署).

## Run and observe replies

```fish
bin/alonabot run ./alonabot-plugin-ping --data-dir ./data --reload
```

This starts Core and the plugin. Calling `/ping` from chat also requires a configured, running Adapter instance. [Quick Start](../guide/quick-start.md) provides a local loopback Adapter and steps to observe replies. `run` accepts multiple component directories. `--reload` rebuilds changed sources or resources, restarts only changed components, and keeps the old component running if compilation fails.

TCP loopback is the default transport; `--stdio` switches development components to stdio. Press Ctrl-C to stop Core and its components.

## Choose a reply style

- Return `(message.Content, error)`: on success, non-empty content is sent once after all explicit sends in the call. Return `nil` or an empty Chain to skip the automatic reply.
- Return `error`: reply explicitly with `c.Reply(text)` or `c.Send(content)` and return the original sending error.

Both styles can send explicitly. Content can be a single `message.Text("pong")` or a `message.Chain{...}`. The first handler parameter is always `*sdk.Context`.

## Continue

- [Commands and Events](commands.md): groups, arguments, permissions, text matching and typed events.
- [Messages and Media](messages.md): mixed content, send receipts, edits and streamed text.
- [Configuration Schema and Secrets](config.md): read-only configuration and secret values.
- [Data Storage](storage.md): KV, managed SQLite and plugin files.
- [Services, Events and Models](services.md): shared APIs, notifications and generation.
- [Background Tasks and Interaction](background.md): replies, reminders and buttons.
- [HTTP and Plugin Pages](http.md): private routes and page assets.
- [Test Plugins with plugintest](testing.md): assert replies, interactions and model calls in go test.
- [Plugin Rules](rules.md): resources, storage and distribution.

Repository examples: [lifecycle](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/lifecycle/main.go) for explicit callbacks and HTTP, [echo](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/main.go) for commands, events and services, and [showcase](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/showcase/main.go) for configuration, HTTP and tasks together.
