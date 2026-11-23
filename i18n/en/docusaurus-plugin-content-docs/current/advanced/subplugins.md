---
title: Split large plugins
description: Organize features into packages with subplugins.
---

As command counts grow, subplugins let each package manage its own commands and configuration.

## Register subplugins

Split `alonabot-plugin-todo/` by feature:

| Path | Purpose |
| --- | --- |
| `plugin.go` | Create the plugin and register subplugins |
| `items/items.go` | Add, remove, and query todos |
| `remind/remind.go` | Reminders |

Each package exports a `Register` function:

```go title="items/items.go"
package items

import "github.com/AlonaBot/AlonaBot/sdk"

func Register(s *sdk.SubPlugin) {
	todo := s.Group("todo")
	todo.Command("add").RawTail().Handle(add)
	todo.Command("list").Handle(list)
}

func add(c *sdk.Context, text string) error { return c.Reply("Added: " + text) }
func list(c *sdk.Context) error             { return c.Reply("Nothing to do.") }
```

Connect them in `New`:

```go title="plugin.go"
package plugin

import (
	"example.com/alonabot-plugin-todo/items"
	"example.com/alonabot-plugin-todo/remind"

	"github.com/AlonaBot/AlonaBot/sdk"
)

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	items.Register(p.Sub("items"))
	remind.Register(p.Sub("remind"))
	return p
}
```

`p.Sub("items")` returns a subplugin with the same registration methods as `p`, including `Command`, `Group`, `On`, and `Every`.

## Subplugin configuration

A subplugin reads the group with the same name in `plugin_config_schema.json`:

```json title="plugin_config_schema.json"
{
  "items": {
    "type": "object",
    "items": {
      "limit": { "type": "int", "default": 20 }
    }
  },
  "remind": {
    "type": "object",
    "items": {
      "max_minutes": { "type": "int", "default": 1440 }
    }
  }
}
```

```go title="items/items.go"
func Register(s *sdk.SubPlugin) {
	s.Command("limit").Handle(func(c *sdk.Context) error {
		return c.Reply(fmt.Sprint(s.Config().Int("limit")))
	})
}
```

`s.Config()` accesses `items` fields; `remind` has its own scope.

## Subplugin permissions

```go
admin := p.Sub("admin").Permission(sdk.Admin)
```
