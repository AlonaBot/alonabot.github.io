---
sidebar_position: 1
title: Quick start
description: Build AlonaBot from source and run an example plugin.
---

There is no release yet. Build from source and use the development entry `alonabot run`, which starts **one plugin**. This page runs the bundled `lifecycle` example.

## Requirements

- Go **1.27.1**, matching `go.mod`.
- Git.

protoc is only needed when you change `.proto` files; see the [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md).

## Build

From the repository root:

```sh
go build -o bin/alonabot ./cmd/alonabot
go build -o bin/lifecycle ./examples/plugins/lifecycle
```

## Run a plugin

```sh
bin/alonabot run --data-dir ./data --plugin-id demo --entry bin/lifecycle
```

The plugin talks to Core over TCP loopback by default. Add `--stdio` to use stdio:

```sh
bin/alonabot run --data-dir ./data --plugin-id demo --entry bin/lifecycle --stdio
```

The log shows `OnStart` and `OnReady`. On Ctrl-C (or SIGTERM), Core drains in-flight requests, the plugin enters STOPPING, runs `OnStop` and exits.

:::note

- Only one Core may run per `data_dir`.
- The first run records a development install and commits a new generation; later runs reuse it.
- `run` reads `<data_dir>/alonabot.yaml` and writes defaults with mode 0600 if it is missing. Restart after editing.

:::

## Reach plugin HTTP routes

Core serves a single public HTTP entry on `listen` (default `127.0.0.1:7650`) and dispatches by Host: admin and plugin entries use different hostnames, and other hosts get 421. With default settings, plugin `demo` is at:

```text
http://localhost:7650/plugins/demo/...
```

`--listen`, `--log-level` and `--log-format` override settings only for this run and never rewrite the file.

## Next

- What the example does: [Lifecycle](../concepts/lifecycle.md)
- Write your own: [Your first plugin](../plugins/first-plugin.md)
