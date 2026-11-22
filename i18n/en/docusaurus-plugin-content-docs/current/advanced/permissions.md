---
title: Permissions and rules
description: Choose who can invoke a route and when it matches.
---

## Permissions

```go
todo.Command("purge").Permission(sdk.Admin).Handle(purge)
```

| Permission | Who qualifies |
| --- | --- |
| sdk.Anyone | Any source |
| sdk.User | Platform-authenticated user; default for commands and text matching |
| sdk.Admin | Core administrator listed in admins |
| sdk.ChatAdmin | Platform-confirmed group owner or administrator |

Combine alternatives with Or:

```go
.Permission(sdk.Admin.Or(sdk.ChatAdmin))
```

Denied routes do not invoke their handler. The closest explicit setting wins: route, group, then outer group.

```go
	admin := p.Group("todo-admin").Permission(sdk.Admin)
	admin.Command("purge").Handle(purge)
	admin.Command("stats").Permission(sdk.User).Handle(stats)
```

## Platform permissions

```go
import tgperm "github.com/AlonaBot/alonabot-adapter-telegram/perm"

.Permission(sdk.PermissionName(tgperm.ChatOwner))
```

Telegram publishes ChatOwner and ChatAdmin in `github.com/AlonaBot/alonabot-adapter-telegram/perm`. OneBot11 publishes GroupOwner, GroupAdmin and PrivateFriend in its own `perm` package. Use `sdk.PermissionName` to turn the published name into a permission.

## Check inside a handler

```go
func list(c *sdk.Context) error {
	if c.Has(sdk.Admin) {
		return c.Reply("All users' items: ...")
	}
	return c.Reply("Your items: ...")
}
```

Administrators can override command permissions, names and enabled state in WebUI.

## Rules

```go
	p.On(sdk.MessageCreated).Rule(sdk.ToMe()).
		Handle(func(c *sdk.Context) error {
			return c.Reply("You called?")
		})
```

| Rule | Behavior |
| --- | --- |
| ToMe | Private chat, mention of the bot, or reply to it |
| NotCommand | Skip command messages |
| Any(a, b) | Either rule succeeds |

Multiple Rule arguments must all match:

```go
.Rule(sdk.ToMe(), sdk.NotCommand())
```

A custom rule returns `(bool, error)`:

```go
func onlyGroups(c *sdk.Context) (bool, error) {
	return c.IsGroup(), nil
}

	p.Command("rollcall").Rule(onlyGroups).Handle(rollcall)
```

False skips this route while other routes continue.

## Order and propagation

```go
	p.On(sdk.MessageCreated).Priority(-10).Handle(first)
```

Lower priority runs first, default zero. A handler can stop later event delivery:

```go
func first(c *sdk.Context) error {
	c.StopPropagation()
	return nil
}
```

Continuation routes execute outside ordinary propagation; StopPropagation there does not stop the original dispatch chain.
