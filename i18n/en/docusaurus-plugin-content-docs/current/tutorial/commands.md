---
title: Commands and arguments
description: Register commands, parse arguments and set permissions.
---

Add `/todo add` and `/todo list`. The first version only replies; [storage](storage.md) will make it persistent.

## A command with arguments

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	todo := p.Group("todo")
	todo.Command("add").Description("Add a to-do item").RawTail().
		Handle(func(c *sdk.Context, text string) error {
			return c.Reply("Added: " + text)
		})
	todo.Command("list").Description("List to-do items").
		Handle(func(c *sdk.Context) error {
			return c.Reply("Nothing to do.")
		})

	return p
}
```

```text
> /todo add buy milk
Added: buy milk
> /todo list
Nothing to do.
```

`Group("todo")` prefixes commands. The handler receives `*sdk.Context` first, then typed arguments. `RawTail()` gives the last argument the remaining original text, so `buy milk` is one string. Missing or invalid arguments cause Core to reply with usage before invoking the handler.

## Argument types

| Type | Input |
| --- | --- |
| `string` | Text token |
| `int`, `int64`, `float64`, `bool` | Parsed number or boolean |
| `sdk.UserID` | User mention |
| `*message.ImageSegment` | Image |
| `message.Chain` | Mixed message content |

Arguments are positional:

```go
	todo.Command("done").Description("Mark an item as done").
		Handle(func(c *sdk.Context, number int) error {
			return c.Reply(fmt.Sprintf("Item %d done.", number))
		})
```

Import `fmt` for formatting.

```text
> /todo done 2
Item 2 done.
```

## Optional arguments and defaults

```go
type ListArgs struct {
	Page int `arg:"page" default:"1"`
}

func list(c *sdk.Context, args ListArgs) error {
	return c.Reply(fmt.Sprintf("Page %d", args.Page))
}
```

Register `todo.Command("list").Handle(list)`:

```text
> /todo list
Page 1
> /todo list 3
Page 3
```

Struct fields follow input order. `arg` supplies the usage name; `default` supplies a missing value. A pointer field is optional and remains nil when absent. The final field can use `arg:"text,raw"`. Use a single argument struct after Context, with no positional arguments or Args/Optional/RawTail mixed in.

## Aliases

```go
	todo.Command("add").Alias("remember").RawTail().Handle(add)
```

Aliases are complete paths: `/remember buy milk` invokes `/todo add buy milk`.

## Permissions

```go
	todo.Command("clear").Permission(sdk.Admin).Handle(clear)
```

`sdk.User` is the command default. Use `sdk.Admin`, `sdk.ChatAdmin`, or `sdk.Admin.Or(sdk.ChatAdmin)` for restricted commands. Rejected users do not invoke the handler. The terminal user is a Core administrator. See [permissions](../advanced/permissions.md).

## Descriptions and menus

Write the English source in `.Description(...)`; translate descriptions under canonical command paths:

```json title="i18n/zh-CN.json"
{
  "commands": {
    "todo add": { "description": "添加一条待办" },
    "todo list": { "description": "列出待办" }
  }
}
```

Root commands appear in automatic platform menus when explicitly marked `.Menu()`, for example `p.Command("todo").Menu().Description("Manage to-do items").Handle(help)`. Child commands remain accessible through text and help. See [scoped Telegram menus](../usage/telegram.md#command-menus).

Next: [replies](messages.md).
