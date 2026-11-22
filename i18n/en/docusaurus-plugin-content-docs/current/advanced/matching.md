---
title: Text matching and events
description: React to ordinary text, membership changes and typed platform events.
---

## Match text

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

| Builder | Match |
| --- | --- |
| FullMatch | Exact text, any supplied pattern |
| Keyword | Contains a pattern |
| StartsWith / EndsWith | Prefix / suffix |
| Regex | Go regular expression |

IgnoreCase makes text matching case insensitive. Read input with `c.Text()`.

## Regular expressions

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

Match()[0] is the whole match; later elements are captured groups.

## Every ordinary message

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

NotCommand skips messages treated as commands. In groups, restrict replies to messages directed at the bot:

```go
p.On(sdk.MessageCreated).Rule(sdk.ToMe(), sdk.NotCommand()).Handle(chat)
```

## Standard events

| Constant | Payload |
| --- | --- |
| MessageCreated | `*message.CreatedPayload` |
| MessageEdited | `*message.EditedPayload` |
| MessageDeleted | `*message.DeletedPayload` |
| MemberJoined / MemberLeft | `*message.MemberPayload` |
| ReactionAdded | `*message.ReactionAddedPayload` |
| BotOnline / BotOffline | Corresponding BotOnlinePayload / BotOfflinePayload |

```go
	p.On(sdk.MemberJoined).
		Handle(func(c *sdk.Context, e *message.MemberPayload) error {
			return c.Reply("Welcome!", message.Mention(e.MemberExternalUserID))
		})
```

Events are delivered when the adapter reports them. See the [platform matrix](../usage/platforms.md).

## Distinguish repeated routes

```go
	p.On(sdk.MessageCreated).ID("log").Handle(logMessage)
	p.On(sdk.MessageCreated).ID("chat").Rule(sdk.ToMe()).Handle(chat)
```

Route IDs must be unique within a plugin. A stable explicit ID also helps preserve a route's management policy when its pattern changes.

## Platform-specific events

```go
type Poke struct {
	TargetID string `json:"target_id"`
}

var poke = sdk.AdapterEvent[Poke]("onebot11.poke", 1)

	p.On(poke).Handle(func(c *sdk.Context, e *Poke) error {
		return c.Reply("Don't poke me!")
	})
```

This custom Poke declaration must match the adapter's name, version and fields. Prefer the published `event` package when available; [OneBot11](../usage/onebot11.md) already exposes a typed Poke declaration. Incompatible versions or payloads log a warning and skip the handler.
