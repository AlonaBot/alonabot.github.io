---
title: Configuration
description: Declare configuration fields, read values, and store secrets.
---

Configuration gives bot owners settings they can adjust. Add a per-user todo limit to the plugin.

## Declare fields

Declare each configuration field as a key in `plugin_config_schema.json`:

```json title="plugin_config_schema.json"
{
  "limit": {
    "type": "int",
    "description": "Maximum items per user",
    "default": 20
  }
}
```

`description` appears in the management form; write it in English. `default` supplies the value when unset.

## Read values

Use `c.Config()` inside a Handler:

```go
	todo.Command("add").Description("Add a to-do item").RawTail().
		Handle(func(c *sdk.Context, text string) error {
			limit := c.Config().Int("limit")
			return c.Reply(fmt.Sprintf("Added: %s (limit %d)", text, limit))
		})
```

```text
> /todo add buy milk
Added: buy milk (limit 20)
```

## Change a value

During development, values are stored in `data/plugins/alonabot-plugin-todo/config.json`:

```json title="data/plugins/alonabot-plugin-todo/config.json"
{ "limit": 3 }
```

Saving restarts the plugin automatically:

```text
> /todo add buy milk
Added: buy milk (limit 3)
```

In a deployed bot, owners edit the form on the WebUI plugin page.

## Field types

| `type` | Accessor | Value |
| --- | --- | --- |
| `string` | `String(key)` | Single-line text |
| `text` | `String(key)` | Multiline text |
| `int` | `Int(key)` | Integer, returned as `int64` |
| `float` | `Float(key)` | Floating-point number |
| `bool` | `Bool(key)` | Toggle |
| `list` | `Strings(key)` | List of strings |
| `object` | `Object(key)` | Nested configuration; read children with the same accessors |

An undeclared key or a mismatched accessor, such as `String` for an `int`, terminates the plugin with an error naming the key. This exposes incorrect access during development.

For field properties and additional types such as lists, selections, and templates, see [Configuration schema](../reference/config-schema.md).

## Secrets

Mark sensitive fields such as API keys with `"secret": true`:

```json title="plugin_config_schema.json"
{
  "limit": { "type": "int", "description": "Maximum items per user", "default": 20 },
  "api_key": { "type": "string", "description": "API key", "secret": true }
}
```

Read them normally: `c.Config().String("api_key")` returns the original value. The management interface hides it, and diagnostic exports redact it. Secret fields cannot declare a `default`.

Keep secrets out of logs and error messages.

## Read during startup

Outside a Handler, use `p.Config()`, for example to establish a connection during startup:

```go
	p.OnStart(func(ctx context.Context) error {
		slog.Info("todo plugin starting", "limit", p.Config().Int("limit"))
		return nil
	})
```

`OnStart` runs once on each plugin startup. See [Lifecycle callbacks](../advanced/hooks.md#lifecycle-callbacks).

## Translate field descriptions

```json title="i18n/zh-CN.json"
{
  "config": {
    "limit": { "description": "每人最多几条待办" },
    "api_key": { "description": "API 密钥" }
  }
}
```

Next: [Storing data](storage.md).
