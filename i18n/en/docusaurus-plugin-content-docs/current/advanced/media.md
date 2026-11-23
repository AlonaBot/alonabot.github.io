---
title: Media, editing, and streaming
description: Send and receive files, edit and delete messages, and stream text.
---

## Send images and files

Use a URL when one is available:

```go
return c.Reply("Here it is", message.ImageURL("https://example.com/chart.png"))
```

For in-memory content, such as a generated chart, use `sdk/media`:

```go
import "github.com/AlonaBot/AlonaBot/sdk/media"

func export(c *sdk.Context) error {
	file, err := media.File(c, []byte("buy milk\ncall mom\n"), "todos.txt", "text/plain")
	if err != nil {
		return err
	}
	return c.Reply("Your list", file)
}
```

| Method | Content |
| --- | --- |
| `media.Image(c, data)` | Image |
| `media.Video(c, data)` | Video |
| `media.File(c, data, filename, contentType)` | File |

Use `media.Upload` to stream large files instead of loading them entirely into memory:

```go
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	ref, err := media.Upload(c, f, "application/zip")
	if err != nil {
		return err
	}
	return c.Reply("Backup", message.File(ref.Source(), "backup.zip"))
```

## Receive images

An image parameter requires the user to attach an image after the command:

```go
	p.Command("size").Handle(func(c *sdk.Context, img *message.ImageSegment) error {
		r, err := media.Open(c, img.Source)
		if err != nil {
			return err
		}
		defer r.Close()

		data, err := io.ReadAll(r)
		if err != nil {
			return err
		}
		return c.Reply(fmt.Sprintf("%d bytes", len(data)))
	})
```

`media.Open` returns an `io.ReadCloser`. Content downloads from the platform as it is read. Close it after use.

To handle images in arbitrary messages, iterate over the chain:

```go
	p.On(sdk.MessageCreated).Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
		for _, seg := range e.Chain {
			if img, ok := seg.(message.ImageSegment); ok {
				// Read with media.Open(c, img.Source)
				_ = img
			}
		}
		return nil
	})
```

## Edit and delete

Use the message identifier returned by `c.Send` to edit or delete:

```go
func work(c *sdk.Context) error {
	sent, err := c.Send(message.Text("Working..."))
	if err != nil {
		return err
	}

	// ... Perform time-consuming work ...

	_, err = c.Edit(sent.Ref(), message.Text("Done."))
	return err
}
```

Delete:

```go
_, err = c.Delete(sent.Ref())
```

`sent.Ref()` is a string you can store for later. The incoming message reference is `c.Event().Ref()`; use it for quoted replies:

```go
return c.Reply("Got it", message.Quote(c.Event().Ref()))
```

Editing and deletion require platform support; unsupported operations return `UNSUPPORTED`.

## Streaming

Use `c.Stream` for progressively generated content, such as model responses:

```go
func story(c *sdk.Context) error {
	parts := []string{"Once upon a time, ", "there was a bot. ", "The end."}
	i := 0
	_, err := c.Stream(func(ctx context.Context) (string, error) {
		if i == len(parts) {
			return "", io.EOF
		}
		part := parts[i]
		i++
		return part, nil
	})
	return err
}
```

Supply a function that returns the next text chunk on each call and `io.EOF` when complete.

- With editing support, the SDK sends the first chunk and appends subsequent chunks by editing the same message.
- Without editing support, it collects the content and sends it once complete.

The plugin code is the same in both cases.

## Send to another session

`c.Reply` and `c.Send` target the current session. Use `c.SendTo` for another destination:

```go
_, err := c.SendTo("telegram:-100123456", message.Text("Hello"))
```

With multiple bot accounts, select one with `sdk.Via`:

```go
_, err := c.SendTo(session, message.Text("Hello"), sdk.Via("main"))
```

Session identifiers use `platform:session-ID` format. Usually, save the value from `c.Session()`. To construct one, use `message.SID("telegram", "-100123456", "")`.

Owners can restrict accounts available for proactive sends. Replies to the current message remain available.
