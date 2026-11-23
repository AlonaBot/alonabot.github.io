---
title: Telegram SDK
description: Use Telegram permissions, events, and platform actions in plugins.
---

For account setup, see [Telegram](telegram.md). Use the AlonaBot SDK for common commands, messages, and buttons. The Adapter's Go module provides Telegram-specific operations.

## Import platform packages

| Package | Purpose |
| --- | --- |
| `github.com/AlonaBot/alonabot-adapter-telegram/perm` | Group owner and administrator permissions |
| `github.com/AlonaBot/alonabot-adapter-telegram/event` | Platform event declarations |
| `github.com/AlonaBot/alonabot-adapter-telegram/action` | Typed platform actions |

## Platform permissions

```go
import (
    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/alonabot-adapter-telegram/perm"
)

func New() *sdk.Plugin {
    p := sdk.NewPlugin()
    p.Command("owner").Permission(sdk.PermissionName(perm.ChatOwner)).
        Handle(func(c *sdk.Context) error { return c.Reply("You own this chat.") })
    return p
}
```

`perm.ChatOwner` represents a group owner, and `perm.ChatAdmin` a group administrator. Use `sdk.ChatAdmin` for platform-independent group administration.

## Query chat information

```go
import (
    "github.com/AlonaBot/AlonaBot/sdk"
    tg "github.com/AlonaBot/alonabot-adapter-telegram/action"
)

func chatInfo(c *sdk.Context) error {
    chat, err := tg.GetChat(c, c.Session())
    if err != nil {
        return err
    }
    return c.Reply(chat.Title)
}
```

The same package provides member management, pinning, and reactions. Message actions take a message handle that determines the account. Use `sdk.Via` to select an instance for background sends or multi-account operations.

## Query account operations

```fish
alonabot adapter actions main
```

The result lists the current account's operation names and input schemas. Use it to check platform call arguments. See [Test plugins on a platform](development.md).
