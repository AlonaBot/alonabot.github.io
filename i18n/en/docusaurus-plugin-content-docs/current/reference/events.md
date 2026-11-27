---
title: Events, permissions, and identifiers
description: Standard events, permissions, and identifier formats.
---

## Events

| Constant | Name | Trigger | Payload type |
| --- | --- | --- | --- |
| `sdk.MessageCreated` | `message.created` | New message | `*message.CreatedPayload` |
| `sdk.MessageEdited` | `message.edited` | Edited message | `*message.EditedPayload` |
| `sdk.MessageDeleted` | `message.deleted` | Deleted message | `*message.DeletedPayload` |
| `sdk.ButtonClicked` | `button.clicked` | Button click; usually handled by [`button.On`](../advanced/buttons.md) | `*message.ButtonClickedPayload` |
| `sdk.MemberJoined` | `member.joined` | Member joins | `*message.MemberPayload` |
| `sdk.MemberLeft` | `member.left` | Member leaves | `*message.MemberPayload` |
| `sdk.ReactionAdded` | `reaction.added` | Reaction added | `*message.ReactionAddedPayload` |
| `sdk.BotOnline` | `bot.online` | Account goes online | `*message.BotOnlinePayload` |
| `sdk.BotOffline` | `bot.offline` | Account goes offline | `*message.BotOfflinePayload` |
| `sdk.CommandInvoked` | `command.invoked` | Command execution; contains name and outcome without arguments or chat content, suitable for metrics | `*message.CommandInvokedPayload` |

See [Text matching and events](../advanced/matching.md). Platform events are covered in [Telegram SDK](../platforms/telegram-sdk.md) and [OneBot 11 SDK](../platforms/onebot11-sdk.md).

### New message payload

```go
type CreatedPayload struct {
	PlatformMessageID string         // Platform message ID
	Chain             message.Chain  // Message content
	ToMe              bool           // Addressed to the bot
}
```

`ToMe` is `true` for private messages, mentions, and replies to the bot.

## Context methods

| Method | Result |
| --- | --- |
| `c.User()` | Triggering user; empty for calls without a user, such as tasks |
| `c.Session()` | Current session, or an empty string |
| `c.Instance()` | Receiving bot account name |
| `c.Text()` | Message text |
| `c.Event()` | Full event |
| `c.ChatType()`, `c.IsPrivate()`, `c.IsGroup()`, `c.IsChannel()` | Chat type from the current event or inherited by a Service call. Without an inbound event, it is `message.ChatUnspecified` |
| `c.Has(permission)` | Permission check |
| `c.Config()` | Configuration |
| `c.Logger()` | Logger |
| `c.T(key, ...)` | Text in the current user's language |
| `c.Match()` | Regular expression matches |
| `c.Reply(...)`, `c.Send(...)`, `c.SendTo(...)` | Send messages |
| `c.Edit(...)`, `c.Delete(...)` | Edit or delete |
| `c.Stream(...)` | Stream output |
| `c.Wait(duration)` | Wait for the user's next message |
| `c.StopPropagation()` | Stop later Handlers |

`c` implements `context.Context`; pass it to `kv.Set(c, ...)`, `db.QueryContext(c, ...)`, and similar APIs.

Use `c` only while its Handler runs. Background goroutines need their own context.

## Permissions

| Constant | Name | Meaning |
| --- | --- | --- |
| `sdk.Anyone` | | Any source |
| `sdk.User` | `user` | Platform-verified user |
| `sdk.Admin` | `admin` | Bot administrator |
| `sdk.ChatAdmin` | `chat_admin` | Current group administrator or owner |

See [Telegram SDK](../platforms/telegram-sdk.md) and [OneBot 11 SDK](../platforms/onebot11-sdk.md) for platform constants.

## Identifier formats

User, session, and message identifiers are strings suitable for database storage.

| Identifier | Format | Example | Read | Construct |
| --- | --- | --- | --- | --- |
| User | `platform:userID` | `telegram:123456789` | `c.User()` | `message.UID(platform, userID)` |
| Session | `platform:sessionID` | `telegram:-100123456` | `c.Session()` | `message.SID(platform, sessionID, "")` |
| Topic | `platform:sessionID#topicID` | `telegram:-100123456#42` | `c.Session()` | `message.SID(platform, sessionID, topicID)` |
| Message | `session/messageID@instance` | `telegram:-100123456/789@main` | `sent.Ref()`, `c.Event().Ref()` | `message.Ref(session, messageID, instance)` |

Parse with `message.ParseUID`, `message.ParseSID`, and `message.ParseRef`. These helpers handle escaping of special characters.

## Message content

`message.Chain` contains segments. Constructors:

| Function | Segment |
| --- | --- |
| `message.Text(s)` | Text |
| `message.ImageURL(url)`, `message.Image(source)` | Image |
| `message.VideoURL(url)` | Video |
| `message.VoiceURL(url)` | Voice |
| `message.FileURL(url)`, `message.File(source, filename)` | File |
| `message.Mention(userID)` | Mention; use the platform user ID without its platform prefix |
| `message.Quote(reference)` | Quoted message |
| `message.Buttons(rows...)` | Buttons |
| `message.Forward(...)` | Merged forward |

`chain.Text()` concatenates text segments.
