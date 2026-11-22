---
title: Replying to messages
description: Send content and inspect the user, chat and event.
---

The handler's `c` describes this invocation: who sent the message, where it arrived and how to reply.

## Reply

```go
return c.Reply("Added: " + text)
return c.Reply("Here you go", message.ImageURL("https://example.com/cat.png"))
```

Import `github.com/AlonaBot/AlonaBot/sdk/message` for message segments.

| Constructor | Content |
| --- | --- |
| `message.Text(text)` | Text |
| `message.ImageURL(url)` | Image |
| `message.VideoURL(url)`, `message.VoiceURL(url)` | Video or voice |
| `message.FileURL(url, "report.pdf")` | Named file |
| `message.Mention(userID)` | Mention using the external user ID |
| `message.Quote(ref)` | Reference to a message handle |

Use Send for exact ordering and a receipt:

```go
sent, err := c.Send(message.Chain{
	message.ImageURL("https://example.com/cat.png"),
	message.Text("A cat"),
})
```

`message.Chain` preserves segment order. Save `sent.Ref()` for [editing or deletion](../advanced/media.md#editing-and-deleting). A handler may reply more than once:

```go
func add(c *sdk.Context, text string) error {
	if err := c.Reply("Saving..."); err != nil {
		return err
	}
	return c.Reply("Added: " + text)
}
```

## Return a reply

```go
	p.Command("ping").Handle(func(c *sdk.Context) (message.Content, error) {
		return message.Text("pong"), nil
	})
```

A `(message.Content, error)` handler sends its nonempty result after explicit sends. Nil or an empty chain produces no automatic reply.

## Inspect the invocation

| Method | Value |
| --- | --- |
| `c.User()` | User identity such as `telegram:123456` |
| `c.Session()` | Chat identity such as `telegram:-100123` |
| `c.Text()` | Message text |
| `c.IsPrivate()`, `c.IsGroup()` | Chat kind |
| `c.Event()` | Full inbound event, including its message handle |

Store identity strings to associate data with users and chats.

```go
	todo.Command("add").Description("Add a to-do item").RawTail().
		Handle(func(c *sdk.Context, text string) error {
			return c.Reply(fmt.Sprintf("Added for %s: %s", c.User(), text))
		})
```

```text
> /todo add buy milk
Added for console:local: buy milk
```

The terminal user is `console:local`.

## Errors and logs

Handler errors go to logs. Reply explicitly when the user needs an explanation:

```go
func done(c *sdk.Context, number int) error {
	if number < 1 {
		return c.Reply("The number starts from 1.")
	}
	// ...
	return c.Reply("Done.")
}
```

Use `log/slog` or the invocation logger:

```go
c.Logger().Info("item added", "user", c.User())
```

Logs and errors use English. Keep stdout for the component protocol. Terminal chat shows warnings and errors; full logs are under `data/logs/`.

Next: [configuration](config.md).
