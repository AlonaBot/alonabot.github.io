---
title: Text matching and events
description: Trigger Handlers from message content and handle platform events.
---

Text matchers trigger Handlers from message content. Event subscriptions handle new messages, member joins, deletions, and other platform events.

## Match content

```go
	p.FullMatch("hello", "hi").IgnoreCase().
		Handle(func(c *sdk.Context) error {
			return c.Reply("Hello!")
		})
```

```text
> Hi
Hello!
```

| Method | Trigger |
| --- | --- |
| `p.FullMatch("a", "b")` | Message equals one of the values |
| `p.Keyword("a", "b")` | Message contains one of the values |
| `p.StartsWith("a", "b")` | Message starts with one of the values |
| `p.EndsWith("a", "b")` | Message ends with one of the values |
| `p.Regex(expr)` | Message matches the regular expression |

Add `.IgnoreCase()` for case-insensitive matching. Read text with `c.Text()`.

### Regular expressions

`c.Match()` returns the matches: index 0 is the full match, followed by captured groups:

```go
	p.Regex(`^remind me in (\d+) minutes$`).
		Handle(func(c *sdk.Context) error {
			return c.Reply("OK, in " + c.Match()[1] + " minutes.")
		})
```

```text
> remind me in 10 minutes
OK, in 10 minutes.
```

Patterns use Go's standard `regexp` syntax.

## Handle every message

```go
import "github.com/AlonaBot/AlonaBot/sdk/message"

	p.On(sdk.MessageCreated).Rule(sdk.NotCommand()).
		Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
			return c.Reply("You said: " + e.Chain.Text())
		})
```

```text
> good morning
You said: good morning
```

`p.On` registers an event Handler; `sdk.MessageCreated` represents new messages. The SDK binds the event payload to the second parameter `e`, whose `e.Chain` is the message chain. A context-only Handler can use `func(c *sdk.Context) error`.

`sdk.NotCommand()` excludes messages handled as commands, preventing `/todo list` from being echoed.

### Messages addressed to the bot

Add `sdk.ToMe()` to handle private messages, mentions, and replies to the bot:

```go
p.On(sdk.MessageCreated).Rule(sdk.ToMe(), sdk.NotCommand()).Handle(chat)
```

## Other events

| Event | Trigger | Second parameter type |
| --- | --- | --- |
| `sdk.MessageCreated` | New message | `*message.CreatedPayload` |
| `sdk.MessageEdited` | Edited message | `*message.EditedPayload` |
| `sdk.MessageDeleted` | Deleted message | `*message.DeletedPayload` |
| `sdk.MemberJoined` | Member joins | `*message.MemberPayload` |
| `sdk.MemberLeft` | Member leaves | `*message.MemberPayload` |
| `sdk.ReactionAdded` | Reaction added | `*message.ReactionAddedPayload` |
| `sdk.BotOnline`, `sdk.BotOffline` | Bot account goes online or offline | `*message.BotOnlinePayload`, `*message.BotOfflinePayload` |

Welcome a new member:

```go
	p.On(sdk.MemberJoined).
		Handle(func(c *sdk.Context, e *message.MemberPayload) error {
			return c.Reply("Welcome!", message.Mention(e.MemberExternalUserID))
		})
```

Events depend on platform notifications. For example, a platform that does not report edits will never invoke `sdk.MessageEdited` Handlers.

## Route IDs

Handlers for the same event share a default route ID. Duplicate IDs fail startup. Assign distinct identifiers with `.ID(...)`:

```go
	p.On(sdk.MessageCreated).ID("log").Handle(logMessage)
	p.On(sdk.MessageCreated).ID("chat").Rule(sdk.ToMe()).Handle(chat)
```

Management uses route IDs to distinguish Handlers. Omit `.ID(...)` when the default is already unique.

## Platform-specific events

Platforms can define additional events. Declare the struct agreed with the platform:

```go
type Poke struct {
	TargetID string `json:"target_id"`
}

var poke = sdk.AdapterEvent[Poke]("example.poke", 1)

	p.On(poke).Handle(func(c *sdk.Context, e *Poke) error {
		return c.Reply("Don't poke me!")
	})
```

The Adapter defines event names, versions, and fields. Consult its documentation.
