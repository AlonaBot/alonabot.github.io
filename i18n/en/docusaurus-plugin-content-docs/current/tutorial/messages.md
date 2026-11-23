---
title: Replying to messages
description: Reply with text and images, and read user, session, and message information.
---

The first Handler parameter, `c`, is the call context (`*sdk.Context`). Use it to read user, session, and event information and reply to messages.

## Reply

```go
// Reply with text
return c.Reply("Added: " + text)

// Append an image after the text
return c.Reply("Here you go", message.ImageURL("https://example.com/cat.png"))
```

`message` is the `github.com/AlonaBot/AlonaBot/sdk/message` package. Common content types:

| Expression | Content |
| --- | --- |
| `message.Text("...")` | Text |
| `message.ImageURL(url)` | Image |
| `message.VideoURL(url)`, `message.VoiceURL(url)` | Video or voice |
| `message.FileURL(url)` | File |
| `message.Mention(userID)` | User mention |
| `message.Quote(ref)` | Quoted message |

Use `c.Send` to arrange the content yourself or access the send result:

```go
sent, err := c.Send(message.Chain{
	message.ImageURL("https://example.com/cat.png"),
	message.Text("A cat"),
})
```

`message.Chain` sends content in order. `sent` contains the sent message identifiers, which you can later use to [edit or delete](../advanced/media.md#edit-and-delete) the message.

A Handler can reply multiple times:

```go
func add(c *sdk.Context, text string) error {
	if err := c.Reply("Saving..."); err != nil {
		return err
	}
	return c.Reply("Added: " + text)
}
```

## Reply through a return value

When a Handler returns `(message.Content, error)`, the framework sends the returned content automatically:

```go
	p.Command("ping").Handle(func(c *sdk.Context) (message.Content, error) {
		return message.Text("pong"), nil
	})
```

Returning `nil` skips the reply.

## Call context

| Expression | Result |
| --- | --- |
| `c.User()` | Sender, such as `telegram:123456` |
| `c.Session()` | Session, such as `telegram:-100123` |
| `c.Text()` | Message text |
| `c.IsPrivate()`, `c.IsGroup()` | Whether this is a private or group chat |
| `c.Event()` | Full event, including message ID, timestamp, and raw content |

`c.User()` and `c.Session()` return strings in `platform:ID` format. Store them in your database to identify users or send messages to the session later.

Track who owns each todo:

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

The terminal chat user is always `console:local`.

## Errors

An `error` returned by a Handler is logged. To explain the problem to the user, send a reply:

```go
func done(c *sdk.Context, number int) error {
	if number < 1 {
		return c.Reply("The number starts from 1.")
	}
	// ...
	return c.Reply("Done.")
}
```

## Logging

Use the standard `log/slog` package or `c.Logger()`, which adds call information automatically:

```go
c.Logger().Info("item added", "user", c.User())
```

Write logs in English. Avoid `fmt.Println`: plugin standard output carries protocol data, so writing to it breaks communication. Terminal chat shows warnings and errors; full logs are stored in `data/logs/`.

Next: [Configuration](config.md).
