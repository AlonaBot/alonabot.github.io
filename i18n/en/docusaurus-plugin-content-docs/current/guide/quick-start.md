---
sidebar_position: 1
title: Quick Start
description: Start a plugin and a local loopback Adapter from source and observe a real reply.
---

Send `/hello` locally and receive `Hello from devbot!`. The repository's `devbot` example runs real Core, a plugin and a loopback Adapter, then writes replies to a file. No platform account is required.

## Requirements

Install Git and Go **1.27.1**, matching the main repository's `go.mod`. Commands below use fish. Normal builds use checked-in generated Protobuf files; prepare the extra tools in the [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md) when changing `.proto` files.

## Start Core, the plugin and the Adapter

```fish
git clone https://github.com/AlonaBot/AlonaBot.git
cd AlonaBot
go build -o bin/alonabot ./cmd/alonabot
set -gx DEVBOT_DATA (mktemp -d)
set -gx DEVBOT_OUTPUT (mktemp)
cp examples/devbot/core_config.example.json $DEVBOT_DATA/core_config.json
printf 'DEVBOT_DATA=%s\nDEVBOT_OUTPUT=%s\n' $DEVBOT_DATA $DEVBOT_OUTPUT
bin/alonabot run examples/devbot/plugin examples/devbot/adapter --data-dir $DEVBOT_DATA --reload
```

Save the two printed temporary paths. `run` stays in the foreground, checks and builds both components, then accepts events after preparation and activation. `core_config.json` binds the `devloop` instance `one` to the loopback Adapter and expands the output path from the environment.

This example listens on `127.0.0.1:7650`; check that the port is free first. If another Core is running, use dedicated settings and data. The [devbot README](https://github.com/AlonaBot/AlonaBot/blob/main/examples/devbot/README.md) provides the full configuration.

## Send a command

In another terminal, enter the same repository and replace these paths with the actual paths printed by the first terminal:

```fish
set -gx DEVBOT_DATA '/actual/data/directory'
set -gx DEVBOT_OUTPUT '/actual/output/file'
```

The first terminal launch prints a management token to stderr once. Store it in the second terminal using `set token 'the displayed token'`. For a non-terminal launch, use the official CLI to read the initial delivery file:

```fish
set token (bin/alonabot admin-token show --data-dir $DEVBOT_DATA)
```

Inject `/hello` using the token:

```fish
curl --fail-with-body -X POST \
  -H "Authorization: Bearer $token" \
  'http://127.0.0.1:7650/plugins/alonabot-adapter-devbot/inject?instance=one&text=%2Fhello'
cat $DEVBOT_OUTPUT
```

The request returns **HTTP 204** and dispatches asynchronously. After sending completes, the file contains **`Hello from devbot!`**. If the file is still empty immediately after the request, run `cat $DEVBOT_OUTPUT` again. Change `text` to `hello` to see ordinary text echoed back.

`/inject` is a private plugin route authenticated with Core's management Bearer token. Admin and plugin routes share the `base_url` hostname, `http://127.0.0.1:7650` here. Cookie-authenticated POST requests also require Origin and CSRF checks.

## Observe changes

Keep `--reload` running and edit `messages.hello` in `examples/devbot/plugin/i18n/en-US.json`. Inject `/hello` again to see the new translation. Source or resource changes rebuild and restart only changed components. Compilation failures retain the complete diagnostics while the old component keeps replying.

Development components use TCP loopback by default; add `--stdio` to switch transport. Ctrl-C drains in-flight work and runs stop callbacks. `core.lock` ensures one Core per data directory; this example uses temporary data and preserves your existing bot data.

## Next

- [Plugin Basics](../plugins/first-plugin.md): create your own `/ping` project.
- [Commands and Events](../plugins/commands.md): arguments, permissions and event handlers.
- [Messages and Media](../plugins/messages.md): send results and media.
- [Implementation Status](status.md): connected capabilities and remaining work.
