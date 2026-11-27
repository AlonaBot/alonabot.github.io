---
title: Commands and arguments
description: Register commands, bind arguments, and configure aliases, groups, and permissions.
---

Add `/todo add` and `/todo list` to the todo plugin. The [storage](storage.md) chapter adds a database later.

## Commands with arguments

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

`p.Group("todo")` creates a command group. Its `add` and `list` commands map to `/todo add` and `/todo list`.

## Argument binding

The SDK generates argument declarations from the Handler signature. Core parses the command against those declarations, and the SDK passes the results to the Handler. Declare arguments individually in the signature or together in a struct.

### Bind function parameters

The SDK provides the first parameter, `*sdk.Context`, with the current user, session, and reply methods. Subsequent parameters bind command input in order. Their types determine parsing:

| Go type | Bound input |
| --- | --- |
| `string` | One text argument |
| `int`, `int64`, `float64`, `bool` | A number or boolean of the corresponding type |
| `sdk.UserID` | A user mention |
| `*message.ImageSegment` | An image segment |
| `message.Chain` | The remaining message chain, including text and images |

For example, `number int` binds the number after the command to `number`:

```go
	todo.Command("done").Description("Mark an item as done").
		Handle(func(c *sdk.Context, number int) error {
			return c.Reply(fmt.Sprintf("Item %d done.", number))
		})
```

```text
> /todo done 2
Item 2 done.
```

The earlier `add` uses `.RawTail()` to bind the entire `buy milk` text to `text`. Regular text arguments split at whitespace; `.RawTail()` passes the remaining source text to the last argument.

If a required argument is missing or parsing fails, Core replies with command usage and skips the Handler.

### Bind a struct

A struct groups argument declarations into fields. This suits commands with many arguments or tags for names, defaults, and raw input. The SDK fills fields in declaration order and passes the struct to the Handler:

```go
type ListArgs struct {
	Page int `arg:"page" default:"1"`
}

func list(c *sdk.Context, args ListArgs) error {
	return c.Reply(fmt.Sprintf("Page %d", args.Page))
}
```

Register `todo.Command("list").Handle(list)` in `New`. `Page` is an `int`; `arg:"page"` sets its name in command usage, and `default:"1"` supplies the value when omitted:

```text
> /todo list
Page 1
> /todo list 3
Page 3
```

| Field declaration | Binding |
| --- | --- |
| `Page int` | Required integer; its name defaults to `page`, derived from the field name |
| `Page int` with `arg:"page" default:"1"` | Uses `1` when omitted |
| `Page *int` with `arg:"page"` | Optional integer; `nil` when omitted |
| `Text string` with `arg:"text,raw"` | The last field receives the remaining source text |

Export fields and declare them in input order. Choose a pointer field for an optional value or a `default` tag for a default value. With struct binding, the Handler accepts only this struct after `*sdk.Context`; fields declare names, defaults, and raw behavior.

## Aliases

```go
	todo.Command("add").Alias("remember").RawTail().Handle(add)
```

Aliases specify the full command. Here, `/remember buy milk` works like `/todo add buy milk`.

## Command permissions

Commands are available to all users by default. Restrict them with `Permission`:

```go
	todo.Command("clear").Permission(sdk.Admin).Handle(clear)
```

| Declaration | Allowed users |
| --- | --- |
| `sdk.User` | Everyone (default) |
| `sdk.Admin` | Bot administrators |
| `sdk.ChatAdmin` | Administrators of the current group |
| `sdk.Admin.Or(sdk.ChatAdmin)` | Either group |

The Handler is skipped when the user lacks permission. In terminal chat, you are a bot administrator. See [Permissions and rules](../advanced/permissions.md) for more combinations.

## Command descriptions

`Description` appears in the `/help` command list. Write it in English. To display Chinese, add translations by command in `i18n/zh-CN.json`:

```json title="i18n/zh-CN.json"
{
  "commands": {
    "todo add": { "description": "添加一条待办" },
    "todo list": { "description": "列出待办" }
  }
}
```

## Platform command menus

Add `.Menu()` to root commands that should appear in a platform menu:

```go
p.Command("ping").Description("Check the bot").Menu().Handle(func(c *sdk.Context) error {
    return c.Reply("pong")
})
```

Core synchronizes menus according to account configuration. Menu descriptions use the language file translations.

Menus include only single-word root commands marked with `.Menu()`, filtered for each chat by its profile, plugin switch, permissions and the `/` prefix. Command names must match `^[a-z0-9_]{1,32}$`, and descriptions are 1 to 256 characters.

### Manage menus yourself

To give different chats different menus, the owner sets `auto_sync_commands` to `false` on the account, and the plugin writes a whole menu with `sdk/command` after `sdk.CommandMenuReady`:

```go
p.On(sdk.CommandMenuReady).Handle(func(c *sdk.Context, ready *message.CommandMenuReadyPayload) error {
	if ready.ChatID == "" {
		return nil
	}
	return command.Set(c, ready.AdapterInstanceID, command.Menu{
		Scope:    command.Scope{Type: "chat", ChatID: ready.ChatID},
		Commands: []command.Item{{Name: "hello", Description: "Say hello"}},
	})
})
```

An empty `ChatID` means the account as a whole is ready; a non-empty one means that chat can be set. Besides `chat`, scopes include `chat_administrators` and `chat_member` with a `UserID`. Each menu holds at most 100 entries; set each language through `LanguageCode`, where an empty string is the default language.

| Function | Purpose |
| --- | --- |
| `command.Set` | Write the whole menu for one location |
| `command.Get` | Read the platform's current menu |
| `command.Delete` | Delete the menu at one location |
| `command.Status` | Mode, readiness and the latest error |
| `command.Sync` | Resynchronize; use it after external edits or a failed mode switch |

`clear_commands_on_disable` (default `true`) controls whether menus the framework wrote are cleared when switching from automatic to manual.

### List available commands

For help-style plugins, `command.List(c)` returns the commands in effect for the current session: `entry.Path` and `entry.Aliases` are names, and `entry.Description` is the command description in the current language. Group by `entry.PluginID`, display the localized `entry.PluginName` and `entry.PluginDescription`, and use `Name`, `Optional`, and `Variadic` from `entry.Params` to format usage. See the [official builtin plugin](https://github.com/AlonaBot/alonabot-plugin-builtin/blob/main/internal/builtin/handler/help.go) for a complete example.

Next: [Replying to messages](messages.md).
