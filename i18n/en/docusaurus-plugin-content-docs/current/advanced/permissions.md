---
title: Permissions and rules
description: Control who can invoke commands and when Handlers run.
---

Permissions control user access. Rules determine whether a Handler runs for a particular call.

## Permissions

```go
todo.Command("purge").Permission(sdk.Admin).Handle(purge)
```

| Permission | Users |
| --- | --- |
| `sdk.Anyone` | Everyone, including sources without a platform-verified identity |
| `sdk.User` | All users; default for commands and text matchers |
| `sdk.Admin` | Bot administrators in Core's `admins` setting |
| `sdk.ChatAdmin` | Current group administrators or owners, as reported by the platform |

Use `Or` to accept either permission:

```go
.Permission(sdk.Admin.Or(sdk.ChatAdmin))
```

A denied call skips the Handler without replying.

### Command group permissions

Commands inherit group permissions. A command's own declaration overrides the group:

```go
	admin := p.Group("todo-admin").Permission(sdk.Admin)
	admin.Command("purge").Handle(purge)                          // Administrators
	admin.Command("stats").Permission(sdk.User).Handle(stats)     // All users
```

For platform permissions, see [Telegram SDK](../platforms/telegram-sdk.md) and [OneBot 11 SDK](../platforms/onebot11-sdk.md).

### Check within a Handler

Use `c.Has` when a command behaves differently by identity:

```go
func list(c *sdk.Context) error {
	if c.Has(sdk.Admin) {
		return c.Reply("All users' items: ...")
	}
	return c.Reply("Your items: ...")
}
```

### Owner overrides

Owners can change command permissions or disable commands in WebUI. Code declarations provide defaults.

## Rules

Rules return whether to handle a call and run before the Handler:

```go
	p.On(sdk.MessageCreated).Rule(sdk.ToMe()).
		Handle(func(c *sdk.Context) error {
			return c.Reply("You called?")
		})
```

| Built-in rule | Meaning |
| --- | --- |
| `sdk.ToMe()` | Private message, mention, or reply to the bot |
| `sdk.NotCommand()` | Message has not been handled as a command |
| `sdk.Any(a, b)` | Either a or b passes |

All rules must pass when several are supplied:

```go
.Rule(sdk.ToMe(), sdk.NotCommand())
```

### Custom rules

A rule has type `func(*sdk.Context) (bool, error)`:

```go
func onlyGroups(c *sdk.Context) (bool, error) {
	return c.IsGroup(), nil
}

	p.Command("rollcall").Rule(onlyGroups).Handle(rollcall)
```

Returning `false` skips this Handler. Other plugins can still process the message.

## Processing order

A message can match several Handlers. Lower priorities run first; the default is 0:

```go
	p.On(sdk.MessageCreated).Priority(-10).Handle(first)
```

An earlier Handler can stop subsequent processing:

```go
func first(c *sdk.Context) error {
	c.StopPropagation()
	return nil
}
```
