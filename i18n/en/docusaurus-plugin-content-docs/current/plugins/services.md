---
sidebar_position: 7
title: Services, Events and Models
description: Call typed services, publish events and reuse Agent models and tools.
---

Use a Service when another plugin must return a result, and Event Bus to broadcast a change. Put declarations in an importable package shared by provider and caller, using the same types on both sides.

## Define and call a Service

Call `registerService(p)` in a project with ID `alonabot-plugin-ping`. Import `sdk` and `sdk/service`:

```go
type GreetIn struct { Name string `json:"name"` }
type GreetOut struct { Text string `json:"text"` }

var Greet = service.JSON[GreetIn, GreetOut]("alonabot-plugin-ping/greet")

func registerService(p *sdk.Plugin) {
    service.Serve(p, Greet).Access(service.AccessPublic).
        Handle(func(_ *sdk.Context, in GreetIn) (GreetOut, error) {
            return GreetOut{Text: "Hello, " + in.Name}, nil
        })
}
```

In another plugin, import the provider's declaration package as `api` and register `p.Command("service-greet").Handle(callGreeting)`:

```go
func callGreeting(c *sdk.Context, name string) error {
    out, err := api.Greet.Call(c.Context(), api.GreetIn{Name: name})
    if err != nil {
        return err
    }
    return c.Reply(out.Text)
}
```

The caller's `/service-greet Alice` receives `Hello, Alice`. Use distinct component IDs for caller and provider. Core checks the call chain: calling your own plugin's Service from its handler returns `CALL_CYCLE`. Keep the target prefix equal to the provider's manifest ID.

The default is `AccessPrivate` (Core and the same plugin). `AccessAllowlist` admits specified direct callers; `AccessPublic` admits enabled plugins. `.Permission(...)` checks Core's trusted Actor. JSON inputs and outputs are schema-validated: invalid input skips the handler, and invalid output fails the call. Use `service.Proto` with your own `proto.Message` types for Protobuf.

JSON Service, Bus and task type parameters are package-level named, non-generic types. The builder generates schemas from shared declarations. Types can declare `SchemaVersion() uint32`, defaulting to 1; rebuild after changing them.

## Broadcast changes

In the same project, call `registerBus(p)` and import `sdk/bus`, `sdk/kv` and `sdk`:

```go
type Update struct { Text string `json:"text"` }
var updated = bus.Define[Update]("alonabot-plugin-ping/updated")

func registerBus(p *sdk.Plugin) {
    bus.Subscribe(p, updated).Handle(func(c *sdk.Context, in Update) error {
        return kv.Set(c.Context(), "latest-update", []byte(in.Text))
    })
    p.Command("publish").Handle(func(c *sdk.Context, text string) error {
        _, err := updated.Publish(c.Context(), Update{Text: text})
        return err
    })
}
```

Successful `Publish` means Core admitted the event. Broadcasts are nonpersistent and may be lost when receivers are offline, full or over budget. Choose a Service for processing results and receipts. Subscription callbacks run serially; keep them short. They have component identity only: supply an explicit chat with `sdk.Send` or `sdk.SendText` for messaging.

Publish only within your plugin's namespace. Import another plugin's declaration to subscribe; use `.ID(routeID)` for multiple subscriptions to the same event.

## Use a model

Register `p.Command("draft").Args("prompt").RawTail().Handle(draft)` and import `sdk/llm`:

```go
func draft(c *sdk.Context, prompt string) error {
    text, err := llm.Ask(c.Context(), prompt)
    if err != nil {
        return err
    }
    return c.Reply(text)
}
```

The administrator must enable an Agent, configure a model and add the plugin to `llm_service_allowed_plugins`. Calls target `@agent/llm.generate` and retain the handler's deadline and parent association. `llm.Ask` sends one user text; `llm.Generate` supports `Messages`, `System`, `Model` and `MaxOutputTokens`, returning the actual model and optional token usage. Each generation is non-streaming; use [Context.Stream](messages.md#stream-text) separately for text deltas.

## Expose a Service as an Agent tool

Before `Handle`, add `.Tool("Greet a user", tool.DefaultConfirm).Effect(tool.ReadOnly)` from `sdk/tool` to declare a JSON Service tool, its default policy and side-effect category. `ReadOnly`, `Write` and `Destructive` describe operations; Core's effective policy decides access.

In a handler or continuation, `tool.Invoke(ctx, target, args)` invokes under the current policy. `tool.Confirm(ctx, operation, summary, effect)` requests permission for your own operation; execute after success. Confirmation requires a trusted Actor, default chat and button support. `tool.List(ctx)` returns the catalog.

Full example: [echo services and broadcasts](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/commands.go). Sources: [Service API](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/service/service.go), [Bus API](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/bus/bus.go). Next: [Background Tasks and Interaction](background.md).
