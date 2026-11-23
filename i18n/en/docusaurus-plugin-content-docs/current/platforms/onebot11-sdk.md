---
title: OneBot 11 SDK
description: Use OneBot 11 permissions, events, and platform clients in plugins.
---

For account setup, see [OneBot 11](onebot11.md). Platform packages live in `github.com/AlonaBot/alonabot-adapter-onebot11`.

## Platform packages

| Package | Purpose |
| --- | --- |
| `perm` | Group owner, administrator, and friend permissions |
| `event` | Platform-specific events |
| `client` | Platform calls bound to the current account |
| `segment` | Platform message segments |

## Platform permissions

```go
import (
    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/alonabot-adapter-onebot11/perm"
)

func New() *sdk.Plugin {
    p := sdk.NewPlugin()
    p.Command("owner").Permission(sdk.PermissionName(perm.GroupOwner)).
        Handle(func(c *sdk.Context) error { return c.Reply("You own this group.") })
    return p
}
```

| Constant | Permission |
| --- | --- |
| `perm.GroupOwner` | Group owner |
| `perm.GroupAdmin` | Group administrator |
| `perm.PrivateFriend` | Private chat with a friend |

## Bind the current account

```go
import (
    "encoding/json"

    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/alonabot-adapter-onebot11/client"
)

func friendList(c *sdk.Context) (json.RawMessage, error) {
    platform, err := client.From(c)
    if err != nil {
        return nil, err
    }
    return platform.Call("get_friend_list", struct{}{})
}
```

The client uses the current event's account and trusted call context, preserving complete platform results and errors. Query methods also provide typed results: `Value` holds the parsed value and `Raw` retains the original JSON.

## Query account operations

```fish
alonabot adapter actions qq
```

Prepare arguments using the returned input schema and test with `alonabot adapter call`. For unified messaging, see [Replying to messages](../tutorial/messages.md).
