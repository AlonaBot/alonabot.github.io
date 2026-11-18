---
sidebar_position: 5
title: Messages and Media
description: Send mixed content, preserve receipts and use media, edits and streamed text.
---

Use `c.Reply("Hello")` for text. Use `c.Send(content)` for images, files or send receipts. Register these handlers in `New()` with `p.Command("name").Handle(handler)`.

## Single segments and mixed content

`message.Content` accepts both a single segment and a `message.Chain`:

```go
func sendPicture(c *sdk.Context) error {
    _, err := c.Send(message.Chain{
        message.Text("A picture"),
        message.ImageURL("https://example.com/photo.png"),
    })
    return err
}
```

Replace the example URL with an accessible HTTPS image. Other constructors include `VideoURL`, `VoiceURL`, `FileURL`, `Mention`, `Quote` and `Forward`. Chain order is preserved; the Adapter plans platform operations according to instance capabilities. See the [message model](https://github.com/AlonaBot/AlonaBot/blob/main/spec/MESSAGE-MODEL.md).

## Receipts and edits

`Send`, `SendTo` and `Edit` return `*message.SendResult` and `error`. Both may be present after a partial failure. Preserve the receipt and error; `PartResults` records each physical operation's status and original segment indexes. Overall `Status` is Accepted, Partial, Rejected or Unknown.

This example imports `sdk`, `message` and the standard library's `fmt`. The target instance must support `message.edit`:

```go
func sendAndEdit(c *sdk.Context) error {
    sent, err := c.Send(message.Text("Working..."))
    if err != nil {
        c.Logger().Error("send failed", "receipt", sent, "err", err)
        return err
    }
    ref := sent.Ref()
    if ref == "" {
        return fmt.Errorf("send receipt has no confirmed message ID")
    }
    _, err = c.Edit(ref, message.Text("Done"))
    return err
}
```

`Ref()` returns the first confirmed message handle; `Refs()` returns all confirmed handles. If the platform supplies no message ID, the handle is empty: retain the original message as appropriate for your workflow. `c.Delete(refs...)` deletes confirmed messages and retains per-item deletion results. These operations depend on the corresponding Adapter capabilities.

## Other chats and background sends

- `c.Send` / `c.Reply` use the current default chat.
- `c.SendTo(sid, content, sdk.Via("instance"))` sends to a specified chat while retaining the current handler's parent call.
- Background tasks use `sdk.Send(ctx, sid, content, ...)` or `sdk.SendText(ctx, sid, text, ...)` when only an error is needed.

Build chat strings with `message.SID(adapterID, chatID, threadID)` and read the current target through `c.Session()` and `c.Instance()`. `message.UID(adapterID, userID)` builds a user string. Other targets, instance changes and background sends are admitted against Core's instance sending permissions on every call. Background work uses the SDK lifetime context; finish using a handler's Context when it returns.

## Media from memory

Import `sdk/media`, `sdk/message` and `sdk`:

```go
func sendFile(c *sdk.Context) error {
    file, err := media.File(c.Context(), []byte("report contents"), "report.txt", "text/plain")
    if err != nil {
        return err
    }
    _, err = c.Send(message.Chain{message.Text("Report"), file})
    return err
}
```

`media.Image`, `Video` and `File` inline non-empty data up to **1 MiB** and upload larger data through Core first. For a large file or an existing reader, use `media.Upload(ctx, reader, mime)`. Pass the returned `ref.Source()` to constructors such as `message.Image` or `message.File`. Chunked upload avoids building a second full-file inline string.

Incoming images carry `message.ImageSegment.Source`. If it includes `IncomingMedia`, use `Source.Incoming.Source()` to obtain the source. `media.Open(ctx, source)` reads incoming/media_ref tokens on demand; close the reader after success. To pass media to another plugin, use `media.Grant(ctx, token, granteePluginID, sessions...)` to request a new grant scoped to target chats.

## Stream text

Connect an existing source of text deltas to `c.Stream`. This example imports `sdk`, plus standard-library `context` and `io`:

```go
func streamText(c *sdk.Context) error {
    chunks := []string{"Hello", ", world!"}
    i := 0
    receipts, err := c.Stream(func(ctx context.Context) (string, error) {
        if err := ctx.Err(); err != nil {
            return "", err
        }
        if i == len(chunks) {
            return "", io.EOF
        }
        text := chunks[i]
        i++
        return text, nil
    })
    if err != nil {
        c.Logger().Error("stream failed", "receipts", receipts, "err", err)
    }
    return err
}
```

`next` receives the current call's context and returns a text delta. `io.EOF` ends normally; text returned with it is still processed. With `message.edit`, the SDK sends then throttles edits, starting new messages at the text limit. Without editing support, it buffers deltas and sends on normal completion. Results retain every receipt already obtained; source and sending errors are returned unchanged. Streaming uses a real event's default target.

## Deletion and platform actions

`c.Delete(refs...)` deletes messages in the same chat and instance using their handles. Background work uses `sdk.Delete(ctx, refs...)`. Inspect both the returned `message.DeleteResult.Items` and the error to preserve per-item outcomes. The target instance must support `message.delete`; official adapter implementations are listed in [Adapter Overview](../adapters/index.md).

For an action declared by an adapter, a handler uses `c.CallAction(to, name, version, params, sdk.Via("instance"))`. It returns raw JSON and an error, with Core validating the declared input/result schemas. Account actions use an empty chat string. Background work uses `action.NewClient(ctx).CallAction(...)` from `sdk/action` to retain the task’s cancellation and deadline. Follow the adapter’s action names and parameter schema; official Telegram and OneBot 11 action helpers are upcoming in their [plans](../adapters/index.md).

## User-facing text

Use `c.T("message.key", "name", value)` for replies. Put messages in the `messages` node of `i18n/en-US.json` and `i18n/zh-CN.json`; use English for logs and errors. Static `pong` keeps the example small; localize production replies.

Sources: [sending](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/send.go), [streaming](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/stream.go), [media](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/media/media.go), [deletion](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/delete.go) and [actions](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/action/action.go). Next: [Commands and Events](commands.md), [Configuration Schema and Secrets](config.md).
