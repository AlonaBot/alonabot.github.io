---
title: Platform connections
description: Choose an Adapter and connect your bot to a chat platform.
---

Adapters handle platform connections and message conversion. Plugins use the unified SDK for commands and events.

| Platform | Adapter | Configuration |
| --- | --- | --- |
| Telegram | alonabot-adapter-telegram | [Bot token and connection](telegram.md) |
| OneBot 11 | alonabot-adapter-onebot11 | [WebSocket and access token](onebot11.md) |
| Custom | Build an Adapter or install a community component | [Build an Adapter](../develop/adapter.md) |

## Local development

Use terminal chat with `alonabot run` to test a plugin. Enter `#number` to click a button. Edits appear as new lines marked `(edited)`.

## Query account capabilities

Use the CLI to list active accounts and their operation catalogs:

```fish
alonabot adapter instance list
alonabot adapter actions main
```

Catalogs include input schemas. See [Adapter development](../develop/adapter.md) for testing steps.
