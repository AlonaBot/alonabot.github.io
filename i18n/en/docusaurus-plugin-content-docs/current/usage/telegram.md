---
title: Telegram
description: Configure long polling, media, typed actions and scoped menus.
---

## Connect

1. Send /newbot to [@BotFather](https://t.me/BotFather) and keep the token private.
2. Set TELEGRAM_BOT_TOKEN in Core's environment, then merge this account configuration.
3. Restart Core; the official adapter downloads on first use. An adapter loaded from source can reload the changed instance when automatic reloading is enabled in development mode. For an installed adapter, restart Core after changing its configuration.

```json title="core_config.json"
{
  "adapters": {
    "telegram": {
      "default_instance": "main",
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}" }
      }
    }
  }
}
```

Install help on the running Core, using its actual data directory, then send /help:

```fish
alonabot install --source AlonaBot/alonabot-plugin-help --yes
alonabot enable alonabot-plugin-help-official --yes
```

Previously uninstalled adapters need [explicit reinstallation](install.md#official-components). Add other accounts under distinct instance names; sdk.Via selects one.

## Long polling

Startup verifies the account with getMe, checks getWebhookInfo, then calls getUpdates using 30-second long polling. Core persists the acknowledged update cursor.

An existing webhook prevents startup. Stop the previous token consumer, call Bot API deleteWebhook, then start Core. Keep one polling receiver per token to avoid conflicts. Outgoing HTTP access is sufficient to receive updates.

## Instance settings and proxies

| Field | Default | Purpose |
| --- | --- | --- |
| token | required, secret | BotFather credential |
| api_base_url | `https://api.telegram.org` | API root, optional path prefix |
| file_base_url | empty | File root; empty uses API root |
| proxy_mode | none | none, core environment, or custom instance proxy |
| proxy | empty | Custom http/https/socks5 URL |
| auto_sync_commands | true | Publish scoped menus automatically |
| clear_commands_on_disable | true | Clear managed positions when switching to manual |

```json
{
  "proxy": "http://127.0.0.1:7890",
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}", "proxy_mode": "core" }
      }
    }
  }
}
```

API and file requests share the instance client. Container loopback points to the container itself; use a proxy address reachable from that container.

## Media, buttons, edits and deletion

Text, images, video, voice and files can be sent and received. Incoming audio becomes a file, animation/video note becomes video, and static stickers become images. Albums arrive as individual messages. Outgoing sources include HTTPS URLs, same-instance platform files, inline bytes and managed media references. Trusted image/gif metadata and recognizable inline GIFs select animation; URL-only images are left for Telegram to download as ordinary images.

```go
func update(c *sdk.Context) error {
    sent, err := c.Send(message.Text("Working..."))
    if err != nil {
        return err
    }
    _, err = c.Edit(sent.Ref(), message.Text("Done."))
    return err
}
```

Import sdk and sdk/message. Use `c.Delete(sent.Ref())` to delete. Editing accepts one text segment plus optional buttons. See [buttons](../advanced/buttons.md); reference replies use message.Quote. Deletion follows Telegram's permissions and time rules.

| Item | Adapter limit |
| --- | --- |
| Text | 4096 UTF-16 code units |
| Caption | 1024 UTF-16 code units |
| Consecutive image/video album | 10 items per group |
| getFile download | 20 MiB |
| Platform callback data | 64 bytes; Core issues tokens for business values |

Limit failures retain explicit errors. c.Stream splits long output and throttles edits using instance limits.

## Typed actions and events

The public action package belongs to the adapter module:

```go
import tgaction "github.com/AlonaBot/alonabot-adapter-telegram/action"

func pin(c *sdk.Context) error {
    _, err := tgaction.PinChatMessage(c, c.Event().Ref(), tgaction.PinChatMessageParams{})
    return err
}
```

Also import sdk. Other actions cover member moderation, unpinning, reactions, chat/member queries, title changes, leaving, typing and message drafts. Typing refreshes every four seconds until context cancellation. StreamDraft updates private-chat drafts and uses a normal Send for final text; final sending follows ordinary outgoing hooks.

Use published event types and names:

```go
import tgevent "github.com/AlonaBot/alonabot-adapter-telegram/event"

var topicCreated = sdk.AdapterEvent[tgevent.ForumTopicCreated](tgevent.ForumTopicCreatedName, 1)
p.On(topicCreated).Handle(func(c *sdk.Context, e *tgevent.ForumTopicCreated) error {
    return c.Reply("Topic created: " + e.Name)
})
```

Events include forum topic creation/edit/close/reopen, pinned messages, title changes and migration. Standard mappings include message creation/edit, member joins/leaves, reactions and callbacks. Ordinary message-deletion notifications currently have no inbound mapping.

## Scoped command menus {#command-menus}

Explicitly mark a root command:

```go
p.Command("hello").Menu().Description("Say hello").Handle(hello)
```

Automatic menus are isolated by account, chat and language. Core checks Profile, allowed instances, plugin state, command policy and the slash prefix. It selects winning public single-token primary names. Topics share their chat's menu; execution still checks topic access. English descriptions live in code; translations live under commands in locale dictionaries.

For manual ownership, set auto_sync_commands to false and restart the instance. The default clears managed positions before readiness; clear_commands_on_disable false preserves them. Initial manual startup and manual restarts retain existing menus.

```go
import "github.com/AlonaBot/AlonaBot/sdk/command"
p.On(sdk.CommandMenuReady).Handle(func(c *sdk.Context, ready *message.CommandMenuReadyPayload) error {
    if ready.ChatID == "" {
        return nil
    }
    return command.Set(c, ready.AdapterInstanceID, command.Menu{
        Scope: command.Scope{Type: "chat", ChatID: ready.ChatID},
        LanguageCode: "en",
        Commands: []command.Item{{Name: "hello", Description: "Say hello"}},
    })
})
```

Plugins can write chat, chat_administrators and chat_member scopes (the last includes UserID). Empty language means default; other language codes are lowercase two-letter primary codes. A menu has at most 100 entries, names match `^[a-z0-9_]{1,32}$`, and descriptions contain 1–256 Unicode characters. Set replaces the whole scope/language menu and transfers ownership.

Get reads the platform, Delete removes an explicit position, Status reports Ready/LastError/ownership, and Sync rebuilds automatic menus or reprocesses manual cleanup and ready events. Set/Delete require ready manual mode. Disabling, uninstalling or losing permission reclaims owned positions. Platform failures remain in LastError; fix the cause and Sync. Historical menus created by external tools require explicit position deletion.

## Group troubleshooting

Disable privacy through BotFather /setprivacy to receive ordinary group messages. Channels, member information and moderation depend on granted platform permissions. See the [platform matrix](platforms.md).
