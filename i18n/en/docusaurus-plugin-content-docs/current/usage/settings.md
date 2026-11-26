---
title: Settings
description: Reference for core_config.json.
---

Core settings are stored in `core_config.json` in the data directory, generated on first startup. Most are editable in WebUI; this chapter explains direct file editing.

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

Restart Core after manual edits.

## Settings reference

| Key | Default | Meaning |
| --- | --- | --- |
| `listen` | `127.0.0.1:7650` | Listening address and port |
| `base_url` | `http://127.0.0.1:7650` | Public management URL |
| `trusted_proxies` | Empty | Reverse proxy addresses; see [Domain access](#domain-access) |
| `admins` | Empty | Bot administrators; see below |
| `command_prefixes` | `["/"]` | Command prefixes |
| `default_locale` | `en-US` | Default reply language |
| `proxy` | Empty | Proxy for outbound requests |
| `adapters` | Empty | Platform accounts; see below |
| `reply` | See below | Reply behavior |
| `log.level` | `info` | Verbosity: `debug`, `info`, `warn`, `error`, `critical` |
| `log.file.enabled` | `true` | Write log files |
| `log.file.max_age_days` | `30` | Log retention in days |
| `sleep.mode` | `always_on` | Let idle plugins exit to save memory; see below |

## Bot administrators

```json
{ "admins": ["telegram:123456789", "onebot11:10001"] }
```

Entries use `platform:user-ID` format. Send `/whoami` to the bot to get your ID.

Administrators can use administrator-only plugin commands. WebUI access uses a separate management token.

## Command prefixes

```json
{ "command_prefixes": ["/", "!"] }
```

This allows both `/help` and `!help`. Use `[""]` to accept `help` without a prefix.

## Platform accounts

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

Accounts are grouped by platform under `adapters`. A platform can have several accounts. Names such as `main` and `backup` may contain letters, numbers, `_`, and `-`, and must be unique across platforms.

Account fields depend on the platform; see [Telegram](../platforms/telegram.md) and [OneBot 11](../platforms/onebot11.md).

`default_instance` selects the account for proactive sends without an explicit instance. Omit it when there is only one account.

## Environment variables

Any string value can use `${VARIABLE}` to read from the environment at startup. This is useful for tokens:

```json
{ "token": "${TELEGRAM_BOT_TOKEN}" }
```

An undefined environment variable is treated as an unset field.

## Reply behavior

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

| Key | Meaning |
| --- | --- |
| `mention_sender` | Mention the sender in replies |
| `quote` | Quote the original message |
| `prefix` | Text prepended to every reply |
| `forward_threshold` | Reply length that triggers merged forwarding; `0` disables it |

## Proxy

```json
{ "proxy": "http://127.0.0.1:7890" }
```

Supports `http`, `https`, and `socks5`. Core and all plugins use this proxy for outbound requests.

## Domain access

Management listens locally by default. To expose it through a domain, place an HTTPS reverse proxy such as Nginx or Caddy in front:

```json
{
  "listen": "0.0.0.0:7650",
  "base_url": "https://bot.example.com",
  "trusted_proxies": ["127.0.0.1/32"]
}
```

- Set `base_url` to the address users enter in their browser.
- Set `trusted_proxies` to the reverse proxy addresses.
- When listening beyond localhost, Core requires an HTTPS `base_url` or configured `trusted_proxies` to start. This protects management tokens in transit.

## Save memory

```json
{ "sleep": { "mode": "component_idle", "idle_timeout": "15m" } }
```

With `component_idle`, unused plugins exit after an idle period and restart when needed. The first message may take longer. The default `always_on` keeps all plugins running.

Plugins with background tasks stay running. To keep a particular plugin active:

```json
{ "sleep": { "mode": "component_idle", "plugins": { "alonabot-plugin-todo": "never" } } }
```

While Core is running, inspect and change individual plugins with a command; changes take effect immediately:

```sh
# Global settings and the state of every plugin
alonabot sleep-policy

# Never exit, custom idle timeout, back to automatic
alonabot sleep-policy alonabot-plugin-todo never
alonabot sleep-policy alonabot-plugin-todo 30m
alonabot sleep-policy alonabot-plugin-todo auto
```

## Invalid settings

- Invalid JSON: Core refuses to start and reports the line and column.
- Invalid field value, such as text where a number is expected: the field uses its default and logs the issue. Other settings remain effective.

## Download settings

Configure component and source-build downloads in WebUI settings:

| Key | Purpose |
| --- | --- |
| `github_download_prefix` | Mirror prefix for GitHub archive downloads |
| `github_api_base` | GitHub API endpoint |
| `go_download_base` | Go toolchain download URL; defaults to `https://go.dev/dl/` |
| `goproxy` | Go module proxy; defaults to `https://proxy.golang.org,direct` |

For GitHub source installs, select a branch, tag, or commit. Core downloads the toolchain, builds, and installs the component. Tasks show each step and full build logs. Toolchains and caches are stored in the data directory.
