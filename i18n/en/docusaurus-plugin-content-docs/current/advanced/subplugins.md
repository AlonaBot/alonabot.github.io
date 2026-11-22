---
title: Organizing a large plugin
description: Split registrations into focused packages.
---

Subplugins group one plugin's commands and configuration. For a to-do component, use `items/` for list operations and `remind/` for reminders.

## Register each part

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

Connect these packages in the entry point; the remind package should export the same Register pattern:

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

A SubPlugin supports Command, Group, On, Every, HTTP routes and hooks without adding its ID to command paths or service names.

## Configuration views

```json title="config_schema.json"
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

Import fmt in the items package. `s.Config()` reads the same-name top-level object's base configuration. To apply the current Profile, use `c.Config().Object("items").Int("limit")` inside the handler.

## Shared permissions

```go
admin := p.Sub("admin").Permission(sdk.Admin)
```

This sets the default permission within the subplugin.

## Ownership

Subplugins share the parent's install, lifecycle and database. They are one level deep; migrations and lifecycle callbacks belong to the parent. For independent enabling or updates, use separate plugins connected by [services](services.md).
