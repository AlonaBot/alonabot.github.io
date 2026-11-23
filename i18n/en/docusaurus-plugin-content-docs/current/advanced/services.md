---
title: Plugin collaboration
description: Call another plugin's functionality or broadcast notifications.
---

Plugins run as separate programs. Two APIs connect them:

| API | Suitable for | Behavior |
| --- | --- | --- |
| Service | Calls that need a result | Request-response; fails when the provider is not running |
| Broadcast | Notifications that something happened | Fire-and-forget; no error if nobody receives it |

## Services

For example, a weather plugin provides a lookup that a todo plugin calls.

### Declare

Place the service declaration in a shared package imported by both plugins:

```go title="alonabot-plugin-weather/api/api.go"
package api

import "github.com/AlonaBot/AlonaBot/sdk/service"

type QueryIn struct {
	City string `json:"city"`
}

type QueryOut struct {
	Summary string `json:"summary"`
}

var Query = service.JSON[QueryIn, QueryOut]("alonabot-plugin-weather/query")
```

Service names use `provider-plugin-ID/service-name` format.

### Provide

```go title="alonabot-plugin-weather/plugin.go"
package plugin

import (
	"example.com/alonabot-plugin-weather/api"

	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/service"
)

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	service.Serve(p, api.Query).Access(service.AccessPublic).
		Handle(func(c *sdk.Context, in api.QueryIn) (api.QueryOut, error) {
			return api.QueryOut{Summary: "Sunny in " + in.City}, nil
		})
	return p
}
```

### Call

```go title="alonabot-plugin-todo/plugin.go"
import "example.com/alonabot-plugin-weather/api"

	p.Command("weather").Handle(func(c *sdk.Context, city string) error {
		out, err := api.Query.Call(c, api.QueryIn{City: city})
		if err != nil {
			return err
		}
		return c.Reply(out.Summary)
	})
```

```text
> /weather Tokyo
Sunny in Tokyo
```

### Access control

| `Access(...)` | Callers |
| --- | --- |
| `service.AccessPrivate` | This plugin only (default) |
| `service.AccessAllowlist, "plugin-ID", ...` | Listed plugins |
| `service.AccessPublic` | All plugins |

In the provider Handler, `c.User()` remains the original sender, so `.Permission(...)` applies normally. `c.Caller()` identifies the calling plugin.

### Handle an unavailable provider

`Call` returns an error if the weather plugin is absent or disabled. Let the todo plugin remain usable:

```go
	out, err := api.Query.Call(c, api.QueryIn{City: city})
	if errcode.Of(err) == errcode.Unavailable || errcode.Of(err) == errcode.NotFound {
		return c.Reply("Weather is not available.")
	}
```

## Broadcasts

### Declare and publish

```go title="alonabot-plugin-todo/api/api.go"
package api

import "github.com/AlonaBot/AlonaBot/sdk/bus"

type ItemDone struct {
	User string `json:"user"`
	Text string `json:"text"`
}

var Done = bus.Define[ItemDone]("alonabot-plugin-todo/done")
```

```go title="alonabot-plugin-todo/plugin.go"
	_, err := api.Done.Publish(c, api.ItemDone{User: c.User(), Text: text})
```

Plugins can publish only events prefixed with their own ID.

### Subscribe

In another plugin:

```go
import (
	"example.com/alonabot-plugin-todo/api"

	"github.com/AlonaBot/AlonaBot/sdk/bus"
)

	bus.Subscribe(p, api.Done).Handle(func(c *sdk.Context, e api.ItemDone) error {
		c.Logger().Info("item done", "user", e.User)
		return nil
	})
```

### Delivery behavior

Broadcasts are dropped if a subscriber is stopped or cannot keep up. The publisher receives no delivery result. **Use services when delivery matters.**

Subscription Handlers have no current message session. Use `c.SendTo` to send messages.

## Expose a service to AI

Add a tool description so [Agent](../usage/agent.md) can call the service in conversations:

```go
import "github.com/AlonaBot/AlonaBot/sdk/tool"

	service.Serve(p, api.Query).Access(service.AccessPublic).
		Tool("Query the weather of a city", tool.DefaultAllow).Effect(tool.ReadOnly).
		Handle(query)
```

| Argument | Meaning |
| --- | --- |
| Description | Explain the tool's purpose to the model in English |
| `tool.DefaultAllow` | Allow direct model calls |
| `tool.DefaultConfirm` | Ask the user to confirm before execution |
| `.Effect(tool.ReadOnly)` | Read-only; alternatives are `tool.Write` for changes and `tool.Destructive` for deletion |

Use `DefaultConfirm` for tools that modify or delete data. Owners can change these defaults in management.

## Testing

Load both plugins in the same test:

```go
h := plugintest.Start(t,
	plugintest.Plugin(weather.New()),
	plugintest.Plugin(todo.New()),
)
```
