---
title: Events, permissions and identifiers
description: Standard event payloads and identity formats.
---

## Standard events

| Constant | Name | Trigger | Payload |
| --- | --- | --- | --- |
| sdk.MessageCreated | message.created | New message | *message.CreatedPayload |
| sdk.MessageEdited | message.edited | Edited message | *message.EditedPayload |
| sdk.MessageDeleted | message.deleted | Deleted message | *message.DeletedPayload |
| sdk.ButtonClicked | button.clicked | Button click; normally handled by [button.On](../advanced/buttons.md) | *message.ButtonClickedPayload |
| sdk.MemberJoined | member.joined | Member joins | *message.MemberPayload |
| sdk.MemberLeft | member.left | Member leaves | *message.MemberPayload |
| sdk.ReactionAdded | reaction.added | Reaction added | *message.ReactionAddedPayload |
| sdk.BotOnline | bot.online | Account online | *message.BotOnlinePayload |
| sdk.BotOffline | bot.offline | Account offline | *message.BotOfflinePayload |
| sdk.CommandMenuReady | bot.command_menu_ready | Manual command-menu owner is ready | *message.CommandMenuReadyPayload |
| sdk.CommandInvoked | command.invoked | Command name and outcome for statistics; excludes arguments and chat content | *message.CommandInvokedPayload |

See [Matching and events](../advanced/matching.md) for registration and the [platform table](../usage/platforms.md) for actual event coverage.

### New message payload

```go
type CreatedPayload struct {
	PlatformMessageID string
	Chain             message.Chain
	ToMe              bool
}
```

ToMe is true for private messages, bot mentions and replies to the bot.

## Context methods

| Method | Result |
| --- | --- |
| c.User() | Triggering user; empty for calls without one |
| c.Session() | Chat session; empty when absent |
| c.Instance() | Receiving account name |
| c.Text() | Text content |
| c.Event() | Complete event |
| c.ChatType(), c.IsPrivate(), c.IsGroup(), c.IsChannel() | Chat type |
| c.Has(permission) | Permission check |
| c.Config() | Effective configuration |
| c.Logger() | Logger |
| c.T(key, ...) | Text in the current locale |
| c.Match() | Regex matches |
| c.Reply(...), c.Send(...), c.SendTo(...) | Send messages |
| c.Edit(...), c.Delete(...) | Edit or delete |
| c.Stream(...) | Stream output |
| c.Wait(duration) | Wait for a user reply |
| c.StopPropagation() | Stop later Handlers for this event |

Context implements context.Context, so pass it to kv.Set, QueryContext and similar functions. Its lifetime ends with the Handler. Background work should use the [lifecycle context pattern](../advanced/hooks.md#lifecycle-callbacks).

## Permissions

| Constant | Name | Meaning |
| --- | --- | --- |
| sdk.Anyone | — | Any source |
| sdk.User | user | Platform-authenticated user |
| sdk.Admin | admin | Bot administrator |
| sdk.ChatAdmin | chat_admin | Current chat administrator or owner |

Platform-specific permission packages:

| Platform | Package | Constant | Name |
| --- | --- | --- | --- |
| Telegram | github.com/AlonaBot/alonabot-adapter-telegram/perm | ChatOwner | telegram.chat_owner |
| Telegram | Same | ChatAdmin | telegram.chat_admin |
| OneBot11 | github.com/AlonaBot/alonabot-adapter-onebot11/perm | GroupOwner | onebot11.group_owner |
| OneBot11 | Same | GroupAdmin | onebot11.group_admin |
| OneBot11 | Same | PrivateFriend | onebot11.private_friend |

Use sdk.PermissionName(perm.GroupOwner). Group owners and administrators also satisfy sdk.ChatAdmin.

## Identifier formats

Identifiers are strings that can be stored directly.

| Identity | Format and example | Read | Construct |
| --- | --- | --- | --- |
| User | platform:userID, telegram:123456789 | c.User() | message.UID(platform, userID) |
| Session | platform:chatID, telegram:-100123456 | c.Session() | message.SID(platform, chatID, "") |
| Topic | platform:chatID#topicID, telegram:-100123456#42 | c.Session() | message.SID(platform, chatID, topicID) |
| Message | session/messageID@instance, telegram:-100123456/789@main | sent.Ref(), c.Event().Ref() | message.Ref(session, messageID, instance) |

Parse with message.ParseUID, ParseSID and ParseRef. These helpers handle escaping special characters.

## Message chains

message.Chain contains segments:

| Constructor | Content |
| --- | --- |
| message.Text(s) | Text |
| message.ImageURL(url), message.Image(source) | Image |
| message.VideoURL(url) | Video |
| message.VoiceURL(url) | Voice |
| message.FileURL(url, filename), message.File(source, filename) | File |
| message.Mention(userID) | Mention using the platform user ID without its namespace |
| message.Quote(ref) | Quoted message |
| message.Buttons(rows...) | Buttons |
| message.Forward(...) | Forwarded nodes |

chain.Text() concatenates the text segments.
