---
title: Collaborating plugins
description: Call a typed service or publish an event.
---

| Mechanism | Use |
| --- | --- |
| Service | Request a result; eligible sleeping components can wake on demand |
| Event Bus | Nonpersistent notification to current subscribers |

## Declare a service

Put the shared declaration in an API package imported by provider and caller:

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

The target is `<providerPluginID>/<serviceName>`.

## Provide it

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

## Call it

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

## Access

| Access | Callers |
| --- | --- |
| AccessPrivate | Same plugin; default |
| AccessAllowlist plus IDs | Listed plugins |
| AccessPublic | All plugins |

The original Actor and target follow the parent call. `c.Caller()` identifies the immediate caller plugin; c.Event() is nil on the service invocation. Permissions can still restrict the provider handler.

Handle known unavailable-service cases while returning other errors:

```go
	out, err := api.Query.Call(c, api.QueryIn{City: city})
	if errcode.Of(err) == errcode.Unavailable || errcode.Of(err) == errcode.NotFound {
		return c.Reply("Weather is not available.")
	}
	if err != nil {
		return err
	}
	return c.Reply(out.Summary)
```

## Broadcast an event

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

Publish uses the provider's own namespace. Subscribe from another plugin:

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

The bus is nonpersistent: offline subscribers and full queues lose notifications. Publish success means admission by Core. Use a service when you require a result. Keep subscribers short; they have no inbound Actor/default chat and need explicit sends.

JSON service, bus and task types must be package-level named nongeneric types. The generator derives schemas and the type's SchemaVersion, defaulting to 1. Rebuild after changing the type. Service input/output validation preserves safe errors without leaking payload details.

## Expose an AI tool

```go
import "github.com/AlonaBot/AlonaBot/sdk/tool"

	service.Serve(p, api.Query).Access(service.AccessPublic).
		Tool("Query the weather of a city", tool.DefaultAllow).Effect(tool.ReadOnly).
		Handle(query)
```

DefaultAllow permits direct invocation; DefaultConfirm asks the user. Effect describes ReadOnly, Write or Destructive behavior and is shown with confirmation. Effective policy comes from Profile, global policy and then declaration. An administrator can override it. Confirmation needs a trusted Actor and a button-capable instance.

## Testing

```go
h := plugintest.Start(t,
	plugintest.Plugin(weather.New()),
	plugintest.Plugin(todo.New()),
)
```

Both plugins run through the same real Core in the test Harness.
