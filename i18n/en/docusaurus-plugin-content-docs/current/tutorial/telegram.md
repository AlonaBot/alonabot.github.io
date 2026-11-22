---
title: Connect Telegram
description: Run the development plugin against a real Telegram account.
---

Use the [v0.2.0 CLI](../quick-start.md) and Go 1.27.1 or later. Continue in the to-do project with its `./data` directory.

## 1. Create a bot

Send `/newbot` to [@BotFather](https://t.me/BotFather). Keep the returned token private.

## 2. Configure the account

Merge the following into `data/core_config.json`, preserving existing settings:

```json title="data/core_config.json"
{
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}" }
      }
    }
  }
}
```

`main` names this bot instance. The entire `${TELEGRAM_BOT_TOKEN}` string is expanded from Core's environment.

## 3. Run

```fish
set -gx TELEGRAM_BOT_TOKEN '123456:ABC-DEF...'
alonabot run
```

Core enables the configured adapter and downloads its official platform archive if needed. A previously uninstalled adapter needs [explicit reinstallation](../usage/install.md#official-components). With a platform account configured, terminal chat is no longer automatic.

Send `/todo add buy milk` in Telegram and expect `Added: buy milk`. Source edits reload the development plugin.

For a proxy, use:

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

See the [Telegram guide](../usage/telegram.md) for long polling, media and menus.

## 4. Grant yourself administrator access

Install the help plugin following [Telegram setup](../usage/telegram.md#connect), then send `/whoami`:

```text
telegram:123456789
```

Add that identity to admins:

```json
{
  "admins": ["telegram:123456789"]
}
```

The development reloader applies saved admins immediately. Deployment file edits take effect on Core restart; `alonabot admin add telegram:123456789` saves the change online.

## Keep terminal chat

```fish
alonabot run --console
```

## Continue

Capabilities vary by platform. Unsupported operations return `UNSUPPORTED`; see the [platform matrix](../usage/platforms.md). Add [scheduling](../advanced/schedule.md), [buttons](../advanced/buttons.md) or [model calls](../advanced/llm.md), then [package your plugin](../advanced/publish.md) or [deploy it](../usage/install.md).
