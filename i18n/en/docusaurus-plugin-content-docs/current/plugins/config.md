---
sidebar_position: 2
title: Config Schema and Secrets
description: Declare plugin configuration in config_schema.json and read it at runtime.
---

Plugin configuration is not a Go type. You hand-write a `config_schema.json` next to `plugin.yaml`; the generator checks it and embeds the canonical JSON. See [CONTRACTS §5.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md) for the format.

## Declare

```json title="config_schema.json"
{
  "$version": 2,
  "$migrations": [{"to": 2, "rename": {"hello": "greeting"}}],
  "greeting": {"type": "string", "description": "Greeting", "default": "Hello"},
  "enabled": {"type": "bool", "default": true},
  "token": {"type": "string", "description": "Access token", "secret": true}
}
```

- `$version` is the config format version, default 1. The SDK runs `$migrations` from the saved version onward and skips them on first install. Each step runs `rename` → `map` → `wrap` → `remove`.
- After declarative migrations the SDK calls the root plugin's `OnConfigLoad` for extra transforms or value checks. Keep it a repeatable, pure config transform: no database, files or network.
- The SDK then fills only missing keys with `default` or the type's zero value and validates against the schema. Explicit `false`, `0`, empty strings and empty collections are kept.

## Read

From `OnStart` on, read through `p.Config()`:

```go
greeting := p.Config().String("greeting")
```

| Declared type | Getter |
| --- | --- |
| `string`, `text` | `String(key)` |
| `int`, `float`, `bool` | `Int(key)` (int64), `Float(key)` (float64), `Bool(key)` |
| `list` without `items` | `Strings(key)` |
| `object`, `list` with `items` | `Object(key)`, `Objects(key)` |
| `dict` | `Dict(key)` |
| `template`, `template_list` | `Template(key)`, `TemplateList(key)` |

Calling `Config()` in `OnConfigLoad` or earlier panics, as does reading an undeclared key or using the wrong getter; the message names the field path.

## Secrets

Secrets apply only to `string` and `text`: declare `"secret": true` and omit `default` and `options`. Core stores non-empty secrets as immutable references and resolves them to plaintext for the plugin at startup; an empty string means unset. Never put secret plaintext in logs, errors or business databases.

## Translations

Config text translations go under the `config` node of `i18n/<locale>.json`:

```json title="i18n/zh-CN.json"
{"config": {"greeting": {"description": "问候语"}, "token": {"description": "访问令牌"}}}
```

Source text is English; translations may override `description`, `hint` and `labels`. The generator checks that translation keys match the schema.
