---
title: Telegram
description: Connect a Telegram bot.
---

## Connect

After configuring an account, Core installs and enables the official Telegram Adapter at startup. First use requires internet access. [Reinstall manually](../usage/install.md#install-official-components) if you previously uninstalled it.

Use `/help` to check the connection. First [configure the management token](../usage/manage.md#preparation) for the running Core, then install and enable the help plugin:

```sh
alonabot install --source AlonaBot/alonabot-plugin-help --yes
alonabot enable alonabot-plugin-help-official
```

1. Find [@BotFather](https://t.me/BotFather) on Telegram and send `/newbot` to create a bot and obtain a token.

2. Add it under Bot accounts in WebUI, or edit `core_config.json`:

```json title="core_config.json"
{
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "123456:ABC-DEF..." }
      }
    }
  }
}
```

3. Restart Core. Send `/help` to the bot on Telegram. A command list confirms the connection.

## Account settings

| Key | Default | Meaning |
| --- | --- | --- |
| `token` | Required | Token from BotFather |
| `proxy_mode` | `none` | `none`: direct; `core`: Core's `proxy`; `custom`: the `proxy` below |
| `proxy` | Empty | Proxy for `custom` mode; supports `http`, `https`, and `socks5` |
| `api_base_url` | `https://api.telegram.org` | Change for a self-hosted Bot API service |

If your network cannot reach Telegram:

```json
{
  "proxy": "http://127.0.0.1:7890",
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "...", "proxy_mode": "core" }
      }
    }
  }
}
```

## Group chats

Add the bot to a group to use commands. To receive regular group messages without a command or mention, disable privacy mode in BotFather: send `/setprivacy`, select the bot, then choose `Disable`.

## Troubleshooting

**Webhook conflict at startup**

A previous program configured a webhook for this bot. AlonaBot receives messages through polling. Delete the webhook at the URL below, then restart:

```text
https://api.telegram.org/bot<token>/deleteWebhook
```

**Use one receiver per token**

Two programs receiving messages with the same token compete for updates, causing intermittent delivery.

## Query account operations

See [Query account capabilities](index.md#query-account-capabilities).
