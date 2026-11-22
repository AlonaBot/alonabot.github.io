---
title: Core settings
description: Configure accounts, replies, proxies and idle sleep.
---

Core stores settings in `<data_dir>/core_config.json`, creating the file on first start. Merge changes into the existing object and restart Core after manual deployment edits.

```json title="core_config.json"
{
  "listen": "127.0.0.1:7650",
  "base_url": "http://127.0.0.1:7650",
  "admins": ["telegram:123456789"],
  "command_prefixes": ["/"],
  "default_locale": "zh-CN",
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}" }
      }
    }
  }
}
```

## Settings

| Key | Default | Purpose |
| --- | --- | --- |
| listen | `127.0.0.1:7650` | HTTP listener |
| base_url | `http://127.0.0.1:7650` | Browser-facing URL and expected Host |
| trusted_proxies | empty | Trusted reverse-proxy networks |
| admins | empty | Bot administrator identities |
| command_prefixes | `["/"]` | Accepted prefixes |
| default_locale | en-US | Default reply language |
| proxy | empty | Outgoing proxy environment |
| adapters | empty | Platform account groups |
| reply | below | Reply decoration and forwarding |
| log.level / log.format | info / text | Output threshold and text/json format |
| log.sources | empty | Per-component output thresholds |
| log.file.enabled / max_age_days | true / 30 | File logging and retention |
| log.file.max_size / max_total | 100 MiB / 1 GiB | File rotation and total storage budget |
| sleep.mode / idle_timeout | always_on / 15m | Global idle strategy |
| sleep.plugins | empty | Per-plugin never/duration overrides |

## Bot administrators

```json
{ "admins": ["telegram:123456789", "onebot11:10001"] }
```

Use platform:userID. The help plugin's /whoami reports your identity. Bot permissions and browser management credentials serve separate actions.

## Prefixes

```json
{ "command_prefixes": ["/", "!"] }
```

An empty prefix accepts bare commands. Profile platform settings can override prefixes and replies per chat. The old command_prefixes_by_instance field is retained as unknown and ignored.

## Accounts

```json
{
  "adapters": {
    "telegram": {
      "default_instance": "main",
      "instances": {
        "main":   { "token": "${TG_MAIN_TOKEN}" },
        "backup": { "token": "${TG_BACKUP_TOKEN}" }
      }
    }
  }
}
```

Instance names use letters, digits, underscore or hyphen and must be unique across Core. default_instance selects an account for explicit sends without Via; with exactly one instance it can be omitted. Per-instance fields are described in [Telegram](telegram.md) and [OneBot11](onebot11.md).

## Environment variables

```json
{ "token": "${TELEGRAM_BOT_TOKEN}" }
```

Only a whole `${NAME}` string expands. Missing variables produce correction records and follow schema handling; an empty required credential still fails that instance. Saving preserves the original expression.

## Replies

```json
{
  "reply": {
    "mention_sender": false,
    "quote": false,
    "prefix": "",
    "forward_threshold": 0
  }
}
```

mention_sender and prefix decorate the first reply to the original inbound group target. quote adds a reference; forward_threshold selects merged forwarding when the instance supports message.forward, with zero disabling it. Core preserves confirmed decorations when editing. Background or cross-chat sends retain their explicit behavior.

## Proxy

```json
{ "proxy": "http://127.0.0.1:7890" }
```

Core and child processes receive HTTP_PROXY/HTTPS_PROXY. An empty setting preserves the inherited proxy environment. Telegram chooses whether to use it through proxy_mode. Supported proxy schemes are http, https and socks5.

## Domain access

Put an HTTPS reverse proxy in front of Core:

```json
{
  "listen": "0.0.0.0:7650",
  "base_url": "https://bot.example.com",
  "trusted_proxies": ["127.0.0.1/32"]
}
```

base_url is the browser URL; trusted_proxies lists proxy networks. A non-loopback listener requires HTTPS base_url or a nonempty trusted-proxy configuration. The published container's default internal wildcard listener is paired with host loopback publishing; keep that deployment arrangement.

## Saving memory

```json
{ "sleep": { "mode": "component_idle", "idle_timeout": "15m" } }
```

Installed plugins declaring sleep support can exit while idle and wake for messages, services, HTTP or due jobs. Cold start consumes the request deadline. Development components and components needing continuous workers remain resident. Override one plugin with:

```json
{ "sleep": { "mode": "component_idle", "plugins": { "alonabot-plugin-todo": "never" } } }
```

The CLI's sleep-policy command provides online overrides.

## Invalid files and values

Syntax errors, duplicate keys or an invalid root reject startup with path/line/column details. Invalid field values are corrected in the runtime copy with diagnostics; unknown keys remain stored. Component config additionally runs OnConfigLoad, schema correction and required checks. Pruning invalid keys is an explicit management operation.
