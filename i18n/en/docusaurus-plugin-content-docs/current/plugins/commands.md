---
sidebar_position: 4
title: Commands and Events
description: Register commands, bind arguments and select events with permissions and Rules.
---

Call the registration functions below from the `New()` in [Plugin Basics](first-plugin.md), before `return p`. They belong to the same `plugin` package and use `sdk` and `message`; the struct-argument example also imports the standard library's `fmt`.

## Groups, aliases and permissions

```go
func registerCommands(p *sdk.Plugin) {
    g := p.Group("demo")
    g.Command("echo").Alias("say").Args("text").RawTail().
        Handle(func(c *sdk.Context, text string) error {
            return c.Reply(text)
        })
    g.Command("admin").Permission(sdk.Admin.Or(sdk.ChatAdmin)).
        Handle(func(c *sdk.Context) error {
            return c.Reply("admin command")
        })
}
```

`/demo echo hello world` binds `hello world` as one raw tail argument. The alias `/say hello world` uses the full alias path. `Group("demo")` prefixes primary commands; `Alias` takes a complete token path. Core prefers the longest complete path or alias.

Commands and text matches require `sdk.User` by default. A permission set on the plugin, sub-plugin, group or route uses the nearest explicit setting. `Or` accepts any matching permission. Built-ins include `sdk.Anyone`, `sdk.User`, `sdk.Admin` and `sdk.ChatAdmin`; use `sdk.PermissionName("adapter.permission")` for platform permissions. Core computes Actor permissions; handlers can check them with `c.Has(permission)`.

## Positional arguments

The first handler parameter is `*sdk.Context`. Remaining positional parameters support:

| Go type | Command input |
| --- | --- |
| `string` | Text token; a final `RawTail()` receives the remaining original text |
| `int`, `int64`, `float64`, `bool` | Parsed as the declared type |
| `sdk.UserID` | User identifier or mention |
| `*message.ImageSegment` | Image segment |
| `message.Chain` | Message-chain argument |

`Args("text")` sets parameter names explicitly; the builder can also extract names from source. `Optional("text", "hello")` declares an optional argument and default. `RawTail()` applies to a final string or message parameter. Core sends usage on binding failure; `Silent()` suppresses that response. Set `Description` and `UsageKey`, then provide translations in `i18n/`.

## Struct arguments and defaults

`/search cats` uses limit 10; `/search cats 3` uses limit 3:

```go
type SearchArgs struct {
    Query string `arg:"query"`
    Limit int64  `arg:"limit" default:"10"`
}

func search(c *sdk.Context, args SearchArgs) error {
    return c.Reply(fmt.Sprintf("query=%s limit=%d", args.Query, args.Limit))
}

func registerSearch(p *sdk.Plugin) {
    p.Command("search").Handle(search)
}
```

The struct is the only parameter after Context. Fields bind in order: `arg` sets a name, `default` supplies a default, and pointer fields are optional with nil for missing values. A final raw field uses `arg:"text,raw"`. Keep field tags as the sole argument declaration and omit builder `Args`, `Optional` and `RawTail`. Validate business values in the handler and return a specific error.

## Match ordinary text

```go
func registerText(p *sdk.Plugin) {
    p.FullMatch("hello", "hello").IgnoreCase().
        Handle(func(c *sdk.Context) error { return c.Reply("Hello!") })
    p.Regex("number", `^number (\d+)$`).
        Handle(func(c *sdk.Context) error { return c.Reply(c.Match()[1]) })
}
```

`FullMatch` matches the complete text. `Keyword`, `StartsWith` and `EndsWith` match contained text, prefixes and suffixes; `IgnoreCase()` ignores case. Regex `c.Match()` contains the full match and capture groups. `Raw(routeID)` passes text to your own Rule. Use `c.Text()` inside a handler to read text.

## Typed events

```go
func registerEvents(p *sdk.Plugin) {
    p.On("echo-text", sdk.MessageCreated).Rule(sdk.NotCommand()).
        Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
            text := e.Chain.Text()
            if text == "" {
                return nil
            }
            return c.Reply(text)
        })
}
```

Use standard constants such as `sdk.MessageCreated` and the corresponding payload pointer. `sdk.NotCommand()` skips messages already consumed by the command layer, preventing `/ping` from also being echoed. A handler may take only `*sdk.Context` and read the `*message.Event` through `c.Event()`.

A Rule is `func(*sdk.Context) (bool, error)`. Multiple Rules on a chain must all match; `sdk.Any(...)` accepts any matching condition, and `sdk.ToMe()` checks whether the message addresses the bot. Declare Core-side message filtering with `.Filter(sdk.MessageFilter{ToMe: true})`. Multiple filter conditions use OR and run separately from SDK Rules.

Other events include `sdk.MessageEdited`, `sdk.MessageDeleted` and `sdk.MemberJoined`. Declare platform extensions with `sdk.AdapterEvent[T]("adapter.event", version)`; the payload parameter is `*T`, and the Adapter must declare the event schema.

## Registration and propagation

Register in `New()` and finish each builder with `Handle`. Missing or duplicate `Handle`, invalid signatures and registration after runtime starts report errors. Register business callbacks on `p.Sub("name")` for logical sub-plugins sharing the process, resources and lifecycle.

Lower `Priority` values run first. `c.StopPropagation()` in an active ordinary handler stops subsequent propagation. For longer waits, use `.Continue()` and `c.Wait(timeout)`; see the [echo conversation example](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/commands.go).

`command.List(c.Context())`, from `sdk/command`, returns available commands filtered and localized by Core for the current Actor and default chat. The official [help plugin](https://github.com/AlonaBot/AlonaBot/blob/main/plugins/help/help.go) demonstrates a full command list.

Next: [Messages and Media](messages.md). Sources: [argument binding](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/arguments.go) and the [plugin guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md).
